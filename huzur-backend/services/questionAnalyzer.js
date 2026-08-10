const MADHHABS = {
  hanafi: /hanefi|hanafi/i,
  shafii: /şafi(?:i|î)?|safi(?:i)?|shafi(?:[\s'-]?i)?/i,
  maliki: /maliki|mâliki/i,
  hanbali: /hanbeli|hanbali/i,
};

const TOPICS = [
  ['boşanma', /boşan|talak|iddet/i],
  ['finans', /faiz|kripto|bitcoin|borsa|kredi|finans|zek[aâ]t/i],
  ['oruç', /oru[cç]|ramazan|diş macunu/i],
  ['abdest', /abdest|gus[uü]l|teyemmüm/i],
  ['namaz', /namaz|sefer[iî]|kaza|rek[aâ]t/i],
  ['Kur’an', /kur['’]?an|mushaf|ayet/i],
  ['aile', /nik[aâ]h|evlilik|miras|adet|hayız/i],
  ['helal-haram', /caiz|helal|haram|müzik/i],
];

function analyzeQuestion(question, forceComparison = false) {
  const normalized = String(question || '').trim();
  const requested = Object.entries(MADHHABS)
    .filter(([, pattern]) => pattern.test(normalized))
    .map(([key]) => key);
  const allRequested = /d[oö]rt\s+mezhe(?:p|b)\p{L}*|t[uü]m\s+mezhe(?:p|b)\p{L}*|mezheplere\s+g[oö]re/iu.test(normalized);
  const topicEntry = TOPICS.find(([, pattern]) => pattern.test(normalized));
  const comparison = forceComparison || allRequested || /karşılaştır|farklı g[oö]r[uü]ş/i.test(normalized);

  return {
    language: 'tr',
    topic: topicEntry?.[0] || 'İslami bilgi',
    subtopic: normalized.slice(0, 120),
    madhhab: allRequested ? 'all' : (requested[0] || null),
    comparison,
  };
}

module.exports = { analyzeQuestion };
