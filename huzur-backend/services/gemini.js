require('dotenv').config({ path: ['.env.local', '.env'] });
const Groq = require('groq-sdk');

// Model fallback is handled explicitly below; SDK retries would otherwise make
// a rate-limited request wait tens of seconds before trying the fallback model.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 0 });
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'openai/gpt-oss-120b';
const VALIDATOR_MODEL = process.env.GROQ_VALIDATOR_MODEL || FALLBACK_MODEL;
const NO_SOURCE_MESSAGE = 'Bu konuda güvenilir ve doğrulanabilir bir fetva kaynağı bulamadım. Bu nedenle kesin bir hüküm vermek istemiyorum.';

const SYSTEM_PROMPT = `Sen Huzur uygulamasının kaynak tabanlı İslami bilgi asistanısın.
Görevin fetva üretmek değil, açılmış ve doğrulanmış web kaynaklarındaki görüşleri Türkçe aktarmaktır.
Yalnızca VERİLEN KAYNAK İÇERİKLERİNİ kullan. Genel eğitim bilgini kullanma.
Bir kaynağın söylemediği hiçbir şeyi ona atfetme; kaynak, alim, kitap, hadis, ayet veya URL uydurma.
Bir şeyin necis olması, temizlenmesi gerekmesi veya namazı etkilemesi onun abdesti bozduğu anlamına gelmez; bu hükümleri kesinlikle birbirine dönüştürme.
Kaynağın "bozmaz", "geçersiz kılmaz" gibi olumsuz hükmünü tersine çevirme ve miktar/şart ekleyerek "bozar" sonucuna ulaşma.
Farklı kurum ve mezheplerin görüşlerini birbirine karıştırma. Fark varsa kesin tek hüküm verme.
Her önemli dini/fıkhi iddia source_ids alanındaki en az bir kaynak kimliğiyle desteklenmelidir.
Kaynak içeriğinde açıkça mezhep adı yoksa o kaynağı bütün mezhebe atfetme.
Özellikle tıp, boşanma, nikah, miras, finans ve kişisel meselelerde yetersiz kaynakla kesin hüküm verme.
JSON dışında hiçbir şey yazma.`;

const GENERAL_KNOWLEDGE_PROMPT = `Sen Huzur uygulamasının İslami bilgi asistanısın.
Güvenilir web araştırması sonuç vermediği için yalnız genel bilgine dayanarak yardımcı olacaksın.
Yanıtı kesin fetva gibi sunma ve belirli bir kuruma, mezhebe, alime, kitaba, ayete veya hadise atfetme.
Peygamber, sahabe veya tarihî kişi hakkında rivayet, alıntı ya da örnek verme; doğrulanmamış nakil kullanma.
Kaynak veya URL uydurma. Emin olmadığın ayrıntıları çıkar.
Tıp, boşanma, nikah, miras, finans, faiz ve kişiye özel hükümlerde ihtiyatlı ol; yetkin bir uzmana danışılmasını belirt.
Cevabı Türkçe, kısa ve anlaşılır yaz. JSON dışında hiçbir şey yazma.`;

function removeUnverifiedAttributions(value) {
  const forbiddenAttribution = /\b(ayet|hadis|rivayet|peygamber|resul|rasul|sahabe|ashab|ebu\s+hur(?:e|ey)re|imam|âlim|alim|kitab|kurum|diyanet)/i;
  return String(value || '')
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => !forbiddenAttribution.test(sentence))
    .join(' ')
    .trim();
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model geçerli JSON döndürmedi.');
    return JSON.parse(match[0]);
  }
}

async function requestJson(messages, temperature, model) {
  const response = await groq.chat.completions.create({
    messages,
    model,
    temperature,
    max_completion_tokens: 1400,
    response_format: { type: 'json_object' },
  });
  return parseJson(response.choices[0]?.message?.content || '{}');
}

function isRetryableModelError(error) {
  const status = Number(error?.status);
  return status === 408
    || status === 409
    || status === 429
    || status >= 500
    || ['ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(error?.code);
}

function isModelFormatError(error) {
  return error?.error?.error?.code === 'json_validate_failed';
}

function isFallbackableModelError(error) {
  return isRetryableModelError(error) || isModelFormatError(error);
}

async function requestJsonWithTransientRetry(messages, temperature, model) {
  try {
    return await requestJson(messages, temperature, model);
  } catch (error) {
    // A quota error will not clear in milliseconds, but a dropped connection
    // or an upstream 5xx frequently does. Retry those once before changing model.
    if (!isRetryableModelError(error) || error.status === 429) throw error;
    await new Promise(resolve => setTimeout(resolve, 300));
    return requestJson(messages, temperature, model);
  }
}

async function completeJson(messages, { temperature = 0.1, model = MODEL, fallbackModel } = {}) {
  try {
    return await requestJsonWithTransientRetry(messages, temperature, model);
  } catch (error) {
    if (isFallbackableModelError(error) && fallbackModel && fallbackModel !== model) {
      console.warn(`Groq ${model} temporarily unavailable; using ${fallbackModel}.`);
      return requestJsonWithTransientRetry(messages, temperature, fallbackModel);
    }
    throw error;
  }
}

function sourceContext(sources, maxContentLength = 2400) {
  return sources.map((source, index) => `
[KAYNAK ${index + 1}]
Kurum: ${source.name}
Etiket: ${source.label}
Tür/seviye: ${source.type}/${source.level}
Mezhep: ${source.madhhab || 'belirtilmedi'}
Başlık: ${source.title}
URL: ${source.url}
İçerik: ${source.content.slice(0, maxContentLength)}
[/KAYNAK ${index + 1}]`).join('\n');
}

function sanitizeIds(ids, max) {
  return [...new Set((Array.isArray(ids) ? ids : [])
    .map(Number).filter(id => Number.isInteger(id) && id >= 1 && id <= max))];
}

function normalizeDraft(draft, sources, analysis) {
  const views = (Array.isArray(draft.views) ? draft.views : []).flatMap(view => {
    const sourceIds = sanitizeIds(view.source_ids, sources.length);
    if (!view?.answer || sourceIds.length === 0) return [];
    const sourceLabels = [...new Set(sourceIds
      .map(id => sources[id - 1]?.label)
      .filter(Boolean))];
    const modelLabel = String(view.label || '');
    const label = sourceLabels.length === 1
      ? sourceLabels[0]
      : sourceLabels.find(item => modelLabel.toLocaleLowerCase('tr-TR').includes(
        item.toLocaleLowerCase('tr-TR'),
      )) || sourceLabels.join(' + ') || 'Kaynak görüşü';
    return [{ label, answer: String(view.answer), source_ids: sourceIds }];
  });
  const usedIds = sanitizeIds(
    [...sanitizeIds(draft.source_ids, sources.length), ...views.flatMap(view => view.source_ids)],
    sources.length,
  );
  return {
    short_answer: String(draft.short_answer || NO_SOURCE_MESSAGE),
    answer: String(draft.answer || draft.short_answer || NO_SOURCE_MESSAGE),
    has_multiple_views: views.length > 1,
    topic: analysis.topic,
    source_ids: usedIds,
    views,
  };
}

async function validateDraft(question, draft, sources, analysis) {
  const validationPrompt = `Aşağıdaki taslak yanıtı kaynak içerikleriyle iddia iddia denetle.
Desteklenmeyen, yanlış kaynağa atfedilen veya mezhepleri karıştıran her ifadeyi çıkar ya da düzelt.
Özellikle abdest sorularında necaset/kan temizliği ve namazın geçerliliği hükümlerini abdestin bozulması hükmüne dönüştürme.
Kaynak "bozmaz" diyorsa taslakta şart veya miktar eklenerek "bozar" denmesine izin verme.
Kaynaklar yalnız bazı durumları kapsıyorsa yanıtın tam liste iddiasını kaldır ve kapsamın sınırlı olduğunu belirt.
Sadece kaynak kimliklerini kullan. Aynı JSON şemasını eksiksiz döndür.

SORU: ${question}
ANALİZ: ${JSON.stringify(analysis)}
TASLAK: ${JSON.stringify(draft)}
KAYNAKLAR: ${sourceContext(sources, 1800)}

JSON şeması:
{"short_answer":"...","answer":"...","source_ids":[1],"views":[{"label":"...","answer":"...","source_ids":[1]}]}`;
  return completeJson([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: validationPrompt },
  ], {
    temperature: 0,
    model: VALIDATOR_MODEL,
    fallbackModel: VALIDATOR_MODEL === FALLBACK_MODEL ? MODEL : FALLBACK_MODEL,
  });
}

function sourcesDoNotAnswerQuestion(draft) {
  if (!draft.source_ids?.length) return true;
  const summary = `${draft.short_answer || ''} ${draft.answer || ''}`.toLocaleLowerCase('tr-TR');
  return [
    /kaynak(lar)?da[^.]{0,100}(bulunamad|bulunmamakta|yer almamakta|belirtilmem|içermem)/,
    /doğrudan[^.]{0,80}(bilgi|görüş|hüküm)[^.]{0,60}(yok|yer alma)/,
    /soruya[^.]{0,80}(cevap|yanıt)[^.]{0,60}(yok|verileme)/,
    /kesin[^.]{0,50}(hüküm|yargı)[^.]{0,50}(verilemez|varılamaz)/,
  ].some(pattern => pattern.test(summary));
}

async function createGeneralKnowledgeAnswer(question, analysis) {
  const generated = await completeJson([
    { role: 'system', content: GENERAL_KNOWLEDGE_PROMPT },
    {
      role: 'user',
      content: `SORU: ${question}\nSORU ANALİZİ: ${JSON.stringify(analysis)}\n\nYalnız şu JSON şemasını döndür:\n{"short_answer":"...","answer":"..."}`,
    },
  ], { fallbackModel: FALLBACK_MODEL });
  const warning = 'Güvenilir web kaynakları araştırıldı ancak soruyu doğrudan cevaplayan doğrulanabilir bir sayfa bulunamadı. Aşağıdaki yanıt genel AI bilgisine dayanmaktadır ve fetva değildir.';
  const shortAnswer = removeUnverifiedAttributions(generated.short_answer);
  const answer = removeUnverifiedAttributions(generated.answer);
  return {
    short_answer: shortAnswer || answer || NO_SOURCE_MESSAGE,
    answer: `${warning}\n\n${answer || shortAnswer || NO_SOURCE_MESSAGE}`,
    has_multiple_views: false,
    topic: analysis.topic,
    source_ids: [],
    views: [],
    general_knowledge: true,
  };
}

function createDeterministicSourceAnswer(analysis, sources) {
  const prayerInvalidatorsSourceIndex = sources.findIndex(source => (
    source.coverage === 'prayer_invalidators'
    && source.label === 'Diyanet'
    && /namazda.*konuşmak/i.test(source.content)
  ));
  if (/namaz/i.test(analysis.subtopic || '') && prayerInvalidatorsSourceIndex >= 0) {
    const sourceId = prayerInvalidatorsSourceIndex + 1;
    const asksAboutSpeaking = /konuş/i.test(analysis.subtopic || '');
    const shortAnswer = asksAboutSpeaking
      ? 'Evet. Diyanet Namaz İlmihali’ne göre namazda konuşmak namazı bozar.'
      : 'Namazın şart veya rükünlerinden birinin eksilmesi; konuşmak, çok hareket etmek, kıbleden dönmek, yiyip içmek ve benzeri namaza aykırı davranışlar namazı bozar.';
    const answer = asksAboutSpeaking
      ? 'Diyanet Namaz İlmihali’ne göre namazda bilerek, yanılarak veya yanlışlıkla konuşmak namazı bozar. Birine seslenmek, selâm vermek ya da verilen selâma sözle karşılık vermek ve aksırana “çok yaşa” demek de konuşma kapsamında değerlendirilir.'
      : 'Diyanet Namaz İlmihali’nde başlıca namaz bozucular şöyle sıralanır:\n\n1. Namazın bir şartının veya rüknünün eksilmesi.\n2. Namazda konuşmak.\n3. Dışarıdan bakıldığında namazda olunmadığı izlenimi verecek kadar çok ve namaz dışı hareket etmek.\n4. Göğsü kıble yönünden çevirmek.\n5. Yiyip içmek.\n6. Özür olmadan boğaz temizlemeye veya öksürmeye çalışmak.\n7. “Üf, tüh, uf, puf, ah, oh” gibi sözler söylemek veya normal sebeple inlemek.\n8. Kişinin kendisinin duyacağı kadar gülmek.\n9. Avret yeri açıkken ya da namaza engel miktarda necaset varken bir rükün eda etmek.';
    return {
      short_answer: shortAnswer,
      answer,
      has_multiple_views: false,
      topic: analysis.topic,
      source_ids: [sourceId],
      views: [{ label: 'Diyanet', answer, source_ids: [sourceId] }],
      general_knowledge: false,
    };
  }

  const smokingSourceIndex = sources.findIndex(source => (
    source.coverage === 'direct_ruling'
    && source.label === 'Diyanet'
    && (/sigara içmenin dini hükmü/i.test(source.title) || /sigara içmesi caiz değildir/i.test(source.content))
  ));
  if (/sigara|tütün/i.test(analysis.subtopic || '') && smokingSourceIndex >= 0) {
    const sourceId = smokingSourceIndex + 1;
    const shortAnswer = 'Diyanet Din İşleri Yüksek Kuruluna göre sigara içmek caiz değildir.';
    const answer = 'Diyanet, sigaranın sağlığa verdiği bilimsel olarak ortaya konmuş ciddi zararlar nedeniyle mübah görülemeyeceğini belirtir. Bazı âlimler sigarayı “tahrîmen (harama yakın) mekruh” saymıştır. Günümüzde birçok âlim ve fetva meclisi ise kişinin kendisine ve başkalarına zarar vermemesi, zararın giderilmesi ve sağlığın korunması ilkelerinden hareketle sigaranın haram olduğu görüşündedir. Sonuç olarak Diyanet’e göre sigara içmek caiz değildir.';
    return {
      short_answer: shortAnswer,
      answer,
      has_multiple_views: false,
      topic: analysis.topic,
      source_ids: [sourceId],
      views: [{ label: 'Diyanet', answer, source_ids: [sourceId] }],
      general_knowledge: false,
    };
  }

  const completeListIndex = sources.findIndex(source => (
    source.coverage === 'complete_list'
    && source.madhhab === 'shafii'
    && /four things nullify ablution/i.test(source.content)
  ));
  if (analysis.topic !== 'abdest' || analysis.madhhab !== 'shafii' || completeListIndex < 0) {
    return null;
  }

  const sourceId = completeListIndex + 1;
  const shortAnswer = 'Şafii mezhebine göre abdesti dört durum bozar: ön veya arka özel yoldan bir şey çıkması; elin içiyle cinsel organa ya da anüse doğrudan dokunmak; evlenilmesi dinen mümkün karşı cinsten yetişkinle ten teması; bilincin kaybolması.';
  const answer = `Kaynakta Şafii mezhebine göre abdesti bozan dört durum şöyle sıralanır:\n\n1. Ön veya arka özel yoldan bir şey çıkması.\n2. Elin iç kısmıyla herhangi bir kişinin cinsel organına veya anüsüne doğrudan dokunmak.\n3. Evlenilmesi dinen mümkün karşı cinsten yetişkin bir kişiyle doğrudan ten teması.\n4. Bilincin kaybolması.`;
  return {
    short_answer: shortAnswer,
    answer,
    has_multiple_views: false,
    topic: analysis.topic,
    source_ids: [sourceId],
    views: [{ label: 'Şafii', answer, source_ids: [sourceId] }],
    general_knowledge: false,
  };
}

async function createGroundedAnswer(question, analysis, sources) {
  const deterministicAnswer = createDeterministicSourceAnswer(analysis, sources);
  if (deterministicAnswer) return deterministicAnswer;

  if (!sources.length) {
    return createGeneralKnowledgeAnswer(question, analysis);
  }

  const prompt = `Kullanıcının sorusunu yalnız aşağıdaki açılmış sayfaların içeriğine göre yanıtla.
Kısa cevap temkinli ve doğrudan olsun. answer alanı açıklamayı içersin.
Her kurum/mezhep görüşünü ayrı views öğesine yaz; birleştirme.
URL yazma; kullandığın [KAYNAK N] numaralarını source_ids olarak ver.
Kaynaklar yeterli değilse kesin hüküm verme ve eksikliği açıkça söyle.
Kaynaklar sorulan listenin yalnız bazı maddelerini açıklıyorsa bunları "bulunan kaynaklarda doğrulanabilen hususlar" diye sun; tam liste olduğunu iddia etme.

SORU: ${question}
SORU ANALİZİ: ${JSON.stringify(analysis)}
KAYNAKLAR: ${sourceContext(sources)}

Yalnız şu JSON şemasını döndür:
{"short_answer":"...","answer":"...","source_ids":[1],"views":[{"label":"Diyanet","answer":"...","source_ids":[1]}]}`;

  const draft = normalizeDraft(await completeJson([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { fallbackModel: FALLBACK_MODEL }), sources, analysis);
  if (sourcesDoNotAnswerQuestion(draft)) {
    return createGeneralKnowledgeAnswer(question, analysis);
  }

  try {
    const validated = await validateDraft(question, draft, sources, analysis);
    const normalized = normalizeDraft(validated, sources, analysis);
    if (sourcesDoNotAnswerQuestion(normalized)) {
      return createGeneralKnowledgeAnswer(question, analysis);
    }
    return { ...normalized, general_knowledge: false };
  } catch (error) {
    // Never expose an unvalidated draft from a smaller fallback model: it can
    // accidentally reverse a source's ruling. Keep the verified links visible
    // and ask the user to retry instead of presenting an unsafe summary.
    if (isFallbackableModelError(error)) {
      console.warn('Citation validation temporarily unavailable; returning sources without a ruling.');
      const message = 'İlgili kaynaklar bulundu ancak yanıt doğrulaması geçici olarak tamamlanamadı. Yanlış hüküm aktarmamak için lütfen kısa süre sonra tekrar deneyin.';
      return {
        short_answer: message,
        answer: message,
        has_multiple_views: false,
        topic: analysis.topic,
        source_ids: sources.map((_, index) => index + 1),
        views: [],
        general_knowledge: false,
      };
    }
    throw error;
  }
}

// Eski içe aktarmaları açık bir hata ile korur; bu yol artık /api/chat tarafından kullanılmaz.
async function askGemini() {
  throw new Error('Legacy RAG answer generation is disabled. Use createGroundedAnswer.');
}

module.exports = {
  createGroundedAnswer,
  createDeterministicSourceAnswer,
  removeUnverifiedAttributions,
  sourcesDoNotAnswerQuestion,
  askGemini,
  NO_SOURCE_MESSAGE,
};
