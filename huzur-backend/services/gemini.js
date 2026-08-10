require('dotenv').config({ path: ['.env.local', '.env'] });
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant';
const VALIDATOR_MODEL = process.env.GROQ_VALIDATOR_MODEL || FALLBACK_MODEL;
const NO_SOURCE_MESSAGE = 'Bu konuda güvenilir ve doğrulanabilir bir fetva kaynağı bulamadım. Bu nedenle kesin bir hüküm vermek istemiyorum.';

const SYSTEM_PROMPT = `Sen Huzur uygulamasının kaynak tabanlı İslami bilgi asistanısın.
Görevin fetva üretmek değil, açılmış ve doğrulanmış web kaynaklarındaki görüşleri Türkçe aktarmaktır.
Yalnızca VERİLEN KAYNAK İÇERİKLERİNİ kullan. Genel eğitim bilgini kullanma.
Bir kaynağın söylemediği hiçbir şeyi ona atfetme; kaynak, alim, kitap, hadis, ayet veya URL uydurma.
Farklı kurum ve mezheplerin görüşlerini birbirine karıştırma. Fark varsa kesin tek hüküm verme.
Her önemli dini/fıkhi iddia source_ids alanındaki en az bir kaynak kimliğiyle desteklenmelidir.
Kaynak içeriğinde açıkça mezhep adı yoksa o kaynağı bütün mezhebe atfetme.
Özellikle tıp, boşanma, nikah, miras, finans ve kişisel meselelerde yetersiz kaynakla kesin hüküm verme.
JSON dışında hiçbir şey yazma.`;

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
    messages, model, temperature, response_format: { type: 'json_object' },
  });
  return parseJson(response.choices[0]?.message?.content || '{}');
}

async function completeJson(messages, { temperature = 0.1, model = MODEL, fallbackModel } = {}) {
  try {
    return await requestJson(messages, temperature, model);
  } catch (error) {
    if (error.status === 429 && fallbackModel && fallbackModel !== model) {
      console.warn(`Groq ${model} rate limited; using ${fallbackModel}.`);
      return requestJson(messages, temperature, fallbackModel);
    }
    throw error;
  }
}

function sourceContext(sources, maxContentLength = 3500) {
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
    return [{ label: String(view.label || 'Kaynak görüşü'), answer: String(view.answer), source_ids: sourceIds }];
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
  ], { temperature: 0, model: VALIDATOR_MODEL });
}

async function createGroundedAnswer(question, analysis, sources) {
  if (!sources.length) {
    return {
      short_answer: NO_SOURCE_MESSAGE,
      answer: NO_SOURCE_MESSAGE,
      has_multiple_views: false,
      topic: analysis.topic,
      source_ids: [],
      views: [],
    };
  }

  const prompt = `Kullanıcının sorusunu yalnız aşağıdaki açılmış sayfaların içeriğine göre yanıtla.
Kısa cevap temkinli ve doğrudan olsun. answer alanı açıklamayı içersin.
Her kurum/mezhep görüşünü ayrı views öğesine yaz; birleştirme.
URL yazma; kullandığın [KAYNAK N] numaralarını source_ids olarak ver.
Kaynaklar yeterli değilse kesin hüküm verme ve eksikliği açıkça söyle.

SORU: ${question}
SORU ANALİZİ: ${JSON.stringify(analysis)}
KAYNAKLAR: ${sourceContext(sources)}

Yalnız şu JSON şemasını döndür:
{"short_answer":"...","answer":"...","source_ids":[1],"views":[{"label":"Diyanet","answer":"...","source_ids":[1]}]}`;

  const draft = normalizeDraft(await completeJson([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], { fallbackModel: FALLBACK_MODEL }), sources, analysis);

  try {
    const validated = await validateDraft(question, draft, sources, analysis);
    return normalizeDraft(validated, sources, analysis);
  } catch (error) {
    // The first pass is already source-constrained and source IDs are validated
    // deterministically. A validator quota issue must not discard a safe answer.
    if (error.status === 429) {
      console.warn('Citation validator rate limited; returning the source-constrained draft.');
      return draft;
    }
    throw error;
  }
}

// Eski içe aktarmaları açık bir hata ile korur; bu yol artık /api/chat tarafından kullanılmaz.
async function askGemini() {
  throw new Error('Legacy RAG answer generation is disabled. Use createGroundedAnswer.');
}

module.exports = { createGroundedAnswer, askGemini, NO_SOURCE_MESSAGE };
