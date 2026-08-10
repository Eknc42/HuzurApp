const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeQuestion } = require('../services/questionAnalyzer');
const { buildSearchPlan, internationalSearchPhrase } = require('../services/fatwaResearch');
const { classifySource } = require('../services/sourceRegistry');
const { verifySource } = require('../services/webSearch');
const { hydrateAnswer, resolveContextualQuestion } = require('../index');

test('Hanefi seferilik sorusunu analiz eder', () => {
  const result = analyzeQuestion('Hanefi mezhebine göre seferi namaz nasıl kılınır?');
  assert.equal(result.topic, 'namaz');
  assert.equal(result.madhhab, 'hanafi');
  assert.equal(result.comparison, false);
});

test('Türkçe mezhep adlarını tespit eder', () => {
  assert.equal(analyzeQuestion('Şafii mezhebine göre abdest nasıl bozulur?').madhhab, 'shafii');
  assert.equal(analyzeQuestion('Şafi mezhebine göre seferi namazı nasıl kılınır?').madhhab, 'shafii');
  assert.equal(analyzeQuestion('Maliki mezhebinde bu hüküm nedir?').madhhab, 'maliki');
  assert.equal(analyzeQuestion('Hanbeli mezhebinde bu hüküm nedir?').madhhab, 'hanbali');
});

test('uluslararası arama için İngilizce konu sorgusu üretir', () => {
  const question = 'Şafii mezhebine göre abdest nasıl bozulur?';
  const analysis = analyzeQuestion(question);
  assert.equal(internationalSearchPhrase(question, analysis), 'what invalidates wudu ablution');
});

test('dört mezhep sorusu tüm mezheplere ayrı arama üretir', () => {
  const analysis = analyzeQuestion('Dört mezhebe göre müzik dinlemek caiz mi?');
  const plan = buildSearchPlan('Dört mezhebe göre müzik dinlemek caiz mi?', analysis);
  assert.equal(analysis.madhhab, 'all');
  assert.equal(analysis.comparison, true);
  ['hanafi', 'shafii', 'maliki', 'hanbali'].forEach(madhhab => {
    assert.ok(plan.some(entry => entry.madhhab === madhhab));
  });
});

test('yalnız izin verilen kaynak alan adlarını sınıflandırır', () => {
  assert.equal(classifySource('https://fetva.diyanet.gov.tr/x').level, 5);
  assert.equal(classifySource('https://iifa-aifi.org/en/123').type, 'official_fatwa');
  assert.equal(classifySource('https://islamansiklopedisi.org.tr/namaz').type, 'academic_reference');
  assert.equal(classifySource('https://istanbul.diyanet.gov.tr/bilgi').type, 'official_islamic_info');
  assert.equal(classifySource('https://example.com/fetva'), null);
});

test('açılmış sayfa içerik ilgisini doğrular', () => {
  const valid = verifySource({
    url: 'https://fetva.diyanet.gov.tr/oruc',
    title: 'Oruç ve diş macunu',
    text: 'Oruçluyken diş macunu kullanmanın hükmü hakkında ayrıntılı açıklama.',
  }, 'Oruçluyken diş macunu kullanmak orucu bozar mı?');
  assert.equal(valid.valid, true);

  const untrusted = verifySource({
    url: 'https://blog.example.com/oruc', title: 'Oruç', text: 'Diş macunu hakkında içerik',
  }, 'Oruçluyken diş macunu kullanmak orucu bozar mı?');
  assert.equal(untrusted.valid, false);

  const falsePositive = verifySource({
    url: 'https://kurul.diyanet.gov.tr/tr/fetva/kaza-namazi',
    title: 'Kaza namazının delili nedir?',
    text: 'Kaza namazının ne zaman ve nasıl kılınacağı açıklanır.',
  }, 'seferi namaz kılınır');
  assert.equal(falsePositive.valid, false);

  const fridaySpecific = verifySource({
    url: 'https://kurul.diyanet.gov.tr/tr/fetva/cuma',
    title: 'Cuma namazı kimlere farzdır?',
    text: 'Cuma namazının yükümlülük şartları açıklanır.',
  }, 'Namaz kimlere farz değildir?');
  assert.equal(fridaySpecific.valid, false);
  assert.equal(fridaySpecific.reason, 'overly_specific_page');
});

test('kısa takip sorusunu önceki kullanıcının konusu ile çözer', () => {
  const resolved = resolveContextualQuestion('Kimlere farz değildir?', [
    { role: 'user', content: 'Namaz kimlere farzdır?' },
    { role: 'assistant', content: 'Kaynaklı cevap.' },
  ]);
  assert.equal(resolved, 'namaz hakkında: Kimlere farz değildir?');
});

test('model URL üretemez; yanıt URLleri yalnız araştırılmış kaynaktan gelir', () => {
  const researched = [{
    name: 'Diyanet Din İşleri Yüksek Kurulu', title: 'Başlık',
    url: 'https://fetva.diyanet.gov.tr/gercek', type: 'official_fatwa', level: 5,
  }];
  const result = hydrateAnswer({
    answer: 'Kaynağa göre açıklama.', short_answer: 'Kısa cevap.', topic: 'oruç',
    source_ids: [1], has_multiple_views: false,
    views: [{ label: 'Diyanet', answer: 'Görüş.', source_ids: [1] }],
  }, researched, { comparison: false });
  assert.equal(result.sources[0].url, researched[0].url);
  assert.equal(result.views[0].sources[0].url, researched[0].url);
});

test('eksik dört mezhep araştırmasında ortak hüküm üretmez', () => {
  const researched = [{
    name: 'SeekersGuidance', title: 'Şafii müzik görüşü',
    url: 'https://seekersguidance.org/example', type: 'institutional', level: 4,
    madhhab: 'shafii',
  }];
  const result = hydrateAnswer({
    answer: 'Her dört mezhebe göre müzik haramdır.',
    short_answer: 'Haramdır.', topic: 'helal-haram', source_ids: [1],
    has_multiple_views: false,
    views: [{ label: 'Şafii', answer: 'Şafii görüşü.', source_ids: [1] }],
  }, researched, { comparison: true, madhhab: 'all' });

  assert.doesNotMatch(result.answer, /her dört mezhebe göre/i);
  assert.match(result.answer, /ortak hükmüymüş gibi kesin bir sonuç verilemez/i);
  assert.equal(result.views.find(view => view.label === 'Hanefi').sources.length, 0);
});
