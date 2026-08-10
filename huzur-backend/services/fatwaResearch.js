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
  if (analysis.topic === 'abdest' && requested.includes('shafii')) {
    plan.push({
      label: MADHHAB_LABELS.shafii,
      madhhab: 'shafii',
      coverage: 'complete_list',
      query: 'site:islamqa.org/shafii "Four things nullify ablution"',
    });
  }
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

function prioritizeRelevantPassage(pageText, searchSnippet, preferSnippet = false) {
  const snippet = String(searchSnippet || '').trim();
  if (!snippet) return pageText;
  const needle = snippet.slice(0, 80).toLocaleLowerCase('tr-TR');
  const normalizedPage = pageText.toLocaleLowerCase('tr-TR');
  let index = normalizedPage.indexOf(needle);
  if (index < 0 && preferSnippet) {
    index = normalizedPage.indexOf('four things nullify ablution');
  }
  if (index < 0) return pageText;
  const start = Math.max(0, index - 800);
  const relevantPassage = pageText.slice(start, index + 5200);
  // Fatwa pages normally state the direct question and ruling near the start.
  // Keep that section first so the model's per-source character limit cannot
  // hide it behind a later search-snippet match (for example a prayer-specific
  // detail that would reverse the page's actual wudu ruling).
  if (preferSnippet) {
    return `DOĞRUDAN EŞLEŞEN BÖLÜM:\n${relevantPassage}\n\nSAYFA BAŞLANGICI:\n${pageText.slice(0, 2200)}`;
  }
  return `SAYFA BAŞLANGICI:\n${pageText.slice(0, 4200)}\n\nARAMA PARÇASININ ÇEVRESİ:\n${relevantPassage}`;
}

async function openVerifiedCandidates(candidates, focusedQuestion) {
  return mapLimited(candidates, 4, async candidate => {
    try {
      // Search results are never fetched unless the URL is already on the allowlist.
      if (!classifySource(candidate.url)) return null;
      const page = await openPage(candidate.url);
      const verification = verifySource({
        ...page,
        title: `${candidate.title || page.title} ${candidate.snippet || ''}`.trim(),
      }, candidate.verificationQuestion || focusedQuestion);
      if (!verification.valid) return null;
      return {
        name: verification.classification.name,
        title: page.title || candidate.title,
        url: page.url,
        type: verification.classification.type,
        level: verification.classification.level,
        label: candidate.madhhab ? MADHHAB_LABELS[candidate.madhhab] : verification.classification.label,
        madhhab: candidate.madhhab,
        coverage: candidate.coverage,
        // The excerpt is taken from the opened page itself. Search snippets are
        // used only to locate the relevant passage, never as answer evidence.
        content: prioritizeRelevantPassage(
          page.text,
          candidate.snippet,
          candidate.coverage === 'complete_list',
        ),
      };
    } catch (error) {
      console.warn(`Page skipped (${candidate.url}):`, error.message);
      return null;
    }
  });
}

async function researchTrustedEducationalSources(focusedQuestion) {
  try {
    const query = `site:islamansiklopedisi.org.tr OR site:diyanet.gov.tr ${focusedQuestion}`;
    const results = await webSearch(query, { count: 5 });
    const candidates = results.slice(0, 4).map(result => ({
      ...result,
      searchLabel: 'Güvenilir İslami bilgi kaynağı',
      madhhab: null,
    }));
    return (await openVerifiedCandidates(candidates, focusedQuestion)).filter(Boolean);
  } catch (error) {
    console.warn('Trusted educational source search skipped:', error.message);
    return [];
  }
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
      candidates.push({
        ...result,
        searchLabel: entry.label,
        madhhab: entry.madhhab,
        coverage: entry.coverage,
        // Diyanet pages are Turkish; international allowlisted sources are
        // searched and written in English. Verify each page in its own query
        // language so a valid English madhhab source is not rejected merely
        // because the user's original question was Turkish.
        verificationQuestion: entry.label === 'Diyanet'
          ? focusedQuestion
          : internationalQuestion,
      });
    }
  }));

  const opened = await openVerifiedCandidates(candidates, focusedQuestion);
  let verifiedSources = opened.filter(Boolean);

  // Basic educational questions often live in encyclopedic/religious guidance
  // pages rather than fatwa databases. Sensitive legal/financial topics retain
  // the stricter fatwa-only failure behavior.
  const sensitiveTopic = ['boşanma', 'finans', 'aile'].includes(analysis.topic);
  if (verifiedSources.length === 0 && !analysis.comparison && !analysis.madhhab && !sensitiveTopic) {
    verifiedSources = await researchTrustedEducationalSources(focusedQuestion);
  }

  return verifiedSources
    .sort((a, b) => {
      const requestedMadhhab = analysis.madhhab && analysis.madhhab !== 'all'
        ? analysis.madhhab
        : null;
      const aPriority = requestedMadhhab && a.madhhab === requestedMadhhab ? 1 : 0;
      const bPriority = requestedMadhhab && b.madhhab === requestedMadhhab ? 1 : 0;
      const aCoverage = a.coverage === 'complete_list' ? 1 : 0;
      const bCoverage = b.coverage === 'complete_list' ? 1 : 0;
      return (bPriority - aPriority) || (bCoverage - aCoverage) || (b.level - a.level);
    })
    .slice(0, analysis.comparison ? 10 : 7);
}

module.exports = {
  buildSearchPlan,
  focusedSearchPhrase,
  internationalSearchPhrase,
  researchTrustedEducationalSources,
  researchFatwa,
};
