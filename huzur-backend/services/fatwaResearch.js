const { webSearch, searchDiyanet, openPage, verifySource } = require('./webSearch');
const { classifySource } = require('./sourceRegistry');

const MADHHAB_LABELS = {
  hanafi: 'Hanefi', shafii: 'Şafii', maliki: 'Maliki', hanbali: 'Hanbeli',
};
const MADHHAB_SEARCH_LABELS = {
  hanafi: 'Hanafi', shafii: 'Shafii', maliki: 'Maliki', hanbali: 'Hanbali',
};

function focusedSearchPhrase(question) {
  return String(question)
    .replace(/(hanefi|şafi|şafii|şafiî|safi|safii|maliki|hanbeli)\s+mezhebine\s+göre/gi, ' ')
    .replace(/dört\s+mezhebe\s+göre/gi, ' ')
    .replace(/\b(nasıl|neden|nedir|mıdır|midır|caiz mi)\b/gi, ' ')
    .replace(/[?!.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function internationalSearchPhrase(question, analysis) {
  const text = String(question).toLocaleLowerCase('tr-TR');
  if (/sefer|yolcu/.test(text) && analysis.topic === 'namaz') return 'traveler prayer shortening rules';
  if (analysis.topic === 'abdest') return 'what invalidates wudu ablution';
  if (/müzik/.test(text)) return 'music permissible Islamic ruling';
  if (/diş macunu/.test(text)) return 'toothpaste while fasting ruling';
  if (/kripto|bitcoin/.test(text)) return 'cryptocurrency Islamic ruling';
  if (/faiz/.test(text)) return 'interest riba prohibition Islamic ruling';
  if (/adet|hayız/.test(text) && /kur/.test(text)) return 'menstruating woman recite Quran ruling';
  if (/zek[aâ]t/.test(text)) return 'eligible recipients of zakat';
  if (/iddet/.test(text)) return 'iddah waiting period after divorce';
  return `${analysis.topic} Islamic ruling`;
}

function buildSearchPlan(question, analysis) {
  const plan = [
    { label: 'Diyanet', query: `site:kurul.diyanet.gov.tr/tr/fetvalar ${question}`, madhhab: null },
    { label: 'IIFA', query: `site:iifa-aifi.org/en ${question} Islamic ruling`, madhhab: null },
    { label: 'Dar al-Ifta', query: `site:dar-alifta.org ${question} fatwa`, madhhab: null },
  ];
  const requested = analysis.madhhab === 'all'
    ? Object.keys(MADHHAB_LABELS)
    : analysis.madhhab ? [analysis.madhhab] : [];
  requested.forEach(madhhab => plan.push({
    label: MADHHAB_LABELS[madhhab],
    madhhab,
    query: `${MADHHAB_SEARCH_LABELS[madhhab]} ${question} site:seekersguidance.org OR site:islamqa.org`,
  }));
  return plan;
}

async function mapLimited(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function researchFatwa(question, analysis) {
  const internationalQuestion = internationalSearchPhrase(question, analysis);
  const plan = buildSearchPlan(internationalQuestion, analysis);
  const focusedQuestion = focusedSearchPhrase(question) || question;
  const searches = await mapLimited(plan, 3, async entry => {
    try {
      const results = entry.label === 'Diyanet'
        ? await searchDiyanet(focusedQuestion, { count: 3 })
        : await webSearch(entry.query, { count: 3 });
      return { entry, results };
    } catch (error) {
      console.warn(`Search skipped for ${entry.label}:`, error.message);
      return { entry, results: [] };
    }
  });

  const candidates = [];
  const seen = new Set();
  searches.forEach(({ entry, results }) => results.slice(0, 2).forEach(result => {
    if (!seen.has(result.url) && candidates.length < 14) {
      seen.add(result.url);
      candidates.push({ ...result, searchLabel: entry.label, madhhab: entry.madhhab });
    }
  }));

  const opened = await mapLimited(candidates, 4, async candidate => {
    try {
      // Search results are never fetched unless the URL is already on the allowlist.
      if (!classifySource(candidate.url)) return null;
      const page = await openPage(candidate.url);
      const verification = verifySource(page, focusedQuestion);
      if (!verification.valid) return null;
      return {
        name: verification.classification.name,
        title: page.title || candidate.title,
        url: page.url,
        type: verification.classification.type,
        level: verification.classification.level,
        label: candidate.madhhab ? MADHHAB_LABELS[candidate.madhhab] : verification.classification.label,
        madhhab: candidate.madhhab,
        content: page.text,
      };
    } catch (error) {
      console.warn(`Page skipped (${candidate.url}):`, error.message);
      return null;
    }
  });

  return opened.filter(Boolean)
    .sort((a, b) => {
      const requestedMadhhab = analysis.madhhab && analysis.madhhab !== 'all'
        ? analysis.madhhab
        : null;
      const aPriority = requestedMadhhab && a.madhhab === requestedMadhhab ? 1 : 0;
      const bPriority = requestedMadhhab && b.madhhab === requestedMadhhab ? 1 : 0;
      return (bPriority - aPriority) || (b.level - a.level);
    })
    .slice(0, analysis.comparison ? 10 : 7);
}

module.exports = { buildSearchPlan, focusedSearchPhrase, internationalSearchPhrase, researchFatwa };
