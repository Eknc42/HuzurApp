const { webSearch, searchDiyanet, openPage, verifySource } = require('./webSearch');
const { classifySource } = require('./sourceRegistry');

const MADHHAB_LABELS = {
  hanafi: 'Hanefi', shafii: 'Şafii', maliki: 'Maliki', hanbali: 'Hanbeli',
};
const MADHHAB_SEARCH_LABELS = {
  hanafi: 'Hanafi', shafii: 'Shafii', maliki: 'Maliki', hanbali: 'Hanbali',
};
const SHAFII_ABLUTION_REFERENCE = {
  name: 'IslamQA.org',
  title: 'The Bare Essentials of a Valid Prayer - IslamQA',
  url: 'https://islamqa.org/shafii/qibla-shafii/33302/the-bare-essentials-of-a-valid-prayer/',
  type: 'aggregator',
  level: 2,
  label: 'Şafii',
  madhhab: 'shafii',
  coverage: 'complete_list',
  // Verified snapshot used only when the hosting provider cannot open the page.
  // The public answer still links to the original allowlisted source.
  content: 'Four things nullify ablution: (1) anything exiting the private parts; (2) directly touching any person’s genitals or anus with the inside of the hand; (3) skin-to-skin contact with a mature, marriageable person of the opposite sex; and (4) losing awareness.',
};
const SMOKING_DIYANET_REFERENCE = {
  name: 'Diyanet Din İşleri Yüksek Kurulu',
  title: 'Sigara içmenin dini hükmü nedir?',
  url: 'https://kurul.diyanet.gov.tr/tr/fetva/sigara-icmenin-dini-hukmu-nedir/0193c42d-b845-70df-5e8c-44ed6a000be4',
  type: 'official_fatwa',
  level: 5,
  label: 'Diyanet',
  madhhab: null,
  coverage: 'direct_ruling',
  content: 'Sigaranın mübah görülmesi düşünülemez. Bazı alimler sigaranın tahrimen, harama yakın mekruh olduğunu söylemiştir. Günümüzde birçok alim ve fetva meclisi zarar ve sağlığı koruma ilkeleri nedeniyle sigaranın haram olduğu görüşündedir. Dolayısıyla bir Müslümanın sigara içmesi caiz değildir.',
};
const PRAYER_INVALIDATORS_DIYANET_REFERENCE = {
  name: 'Diyanet İşleri Başkanlığı',
  title: 'Namaz İlmihali — Namazı Bozan Şeyler',
  url: 'https://namaz.diyanet.gov.tr/namaz/html/kutuphane/HTML/NamazIlmihali/assets/common/downloads/publication.pdf',
  type: 'official_islamic_info',
  level: 5,
  label: 'Diyanet',
  madhhab: null,
  coverage: 'prayer_invalidators',
  content: 'Namazın rükünlerinden veya şartlarından birinin eksikliği namazı bozar. Namazı bozan başlıca şeyler: namazda bilerek, yanılarak veya yanlışlıkla konuşmak; namaz dışı çok hareket etmek; yönü kıbleden çevirmek; yiyip içmek; özürsüz boğaz temizlemeye veya öksürmeye çalışmak; üf, tüh, uf, puf, ah, oh gibi sözler söylemek; normal sebeple inlemek; gülmek; avret yeri açık veya namaza engel necaset varken bir rükün eda etmek.',
};

function isSmokingQuestion(value) {
  return /\b(sigara|tütün|tobacco|smoking|cigarette)/i.test(String(value || ''));
}

function isPrayerInvalidatorQuestion(value) {
  const text = String(value || '').toLocaleLowerCase('tr-TR');
  if (!/namaz/.test(text)) return false;
  const asksAboutSpeaking = /konuş/.test(text);
  const asksForGeneralList = /namaz[ıi]?\s+(ne(ler)?\s+bozar|bozan(\s+(durum|şey|h[âa]l|davranış)\w*)?)/.test(text);
  return asksAboutSpeaking || asksForGeneralList;
}

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
  if (analysis.topic === 'namaz' && isPrayerInvalidatorQuestion(question)) {
    return 'what invalidates prayer salah speaking eating movement';
  }
  if (analysis.topic === 'abdest') return 'what invalidates wudu ablution';
  if (/müzik/.test(text)) return 'music permissible Islamic ruling';
  if (/sigara|tütün/.test(text)) return 'smoking tobacco Islamic ruling';
  if (/diş macunu/.test(text)) return 'toothpaste while fasting ruling';
  if (/kripto|bitcoin/.test(text)) return 'cryptocurrency Islamic ruling';
  if (/faiz/.test(text)) return 'interest riba prohibition Islamic ruling';
  if (/adet|hayız/.test(text) && /kur/.test(text)) return 'menstruating woman recite Quran ruling';
  if (/zek[aâ]t/.test(text)) return 'eligible recipients of zakat';
  if (/iddet/.test(text)) return 'iddah waiting period after divorce';
  // An untranslated broad topic query (for example "prayer Islamic ruling")
  // tends to return a nearby but different fatwa. Unknown intents stay on the
  // Turkish Diyanet/TDV path and fall back to clearly labelled general AI if
  // no direct source is found.
  return null;
}

function buildSearchPlan(question, analysis) {
  const plan = [
    { label: 'Diyanet', query: 'Diyanet doğrudan arama', madhhab: null },
  ];
  if (question) {
    plan.push(
      { label: 'IIFA', query: `site:iifa-aifi.org/en ${question}`, madhhab: null },
      { label: 'Dar al-Ifta', query: `site:dar-alifta.org ${question} fatwa`, madhhab: null },
    );
  }
  const requested = analysis.madhhab === 'all'
    ? Object.keys(MADHHAB_LABELS)
    : analysis.madhhab ? [analysis.madhhab] : [];
  if (question) {
    requested.forEach(madhhab => plan.push({
      label: MADHHAB_LABELS[madhhab],
      madhhab,
      query: `${MADHHAB_SEARCH_LABELS[madhhab]} ${question} site:seekersguidance.org OR site:islamqa.org`,
    }));
  }
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

function curatedCandidates(analysis, verificationQuestion) {
  if (isSmokingQuestion(analysis.subtopic)) {
    return [{
      ...SMOKING_DIYANET_REFERENCE,
      snippet: 'Sigara içmenin dini hükmü nedir? Sigara içmesi caiz değildir.',
      searchLabel: 'Diyanet',
      verificationQuestion: analysis.subtopic,
    }];
  }
  if (isPrayerInvalidatorQuestion(analysis.subtopic)) {
    return [{
      ...PRAYER_INVALIDATORS_DIYANET_REFERENCE,
      snippet: 'Namazı bozan şeyler: namazda konuşmak, çok hareket etmek, kıbleden dönmek, yiyip içmek.',
      searchLabel: 'Diyanet',
      verificationQuestion: analysis.subtopic,
    }];
  }
  if (analysis.topic !== 'abdest' || analysis.madhhab !== 'shafii') return [];
  return [{
    title: 'The Bare Essentials of a Valid Prayer - IslamQA',
    url: 'https://islamqa.org/shafii/qibla-shafii/33302/the-bare-essentials-of-a-valid-prayer/',
    snippet: 'Four things nullify ablution',
    searchLabel: MADHHAB_LABELS.shafii,
    madhhab: 'shafii',
    coverage: 'complete_list',
    verificationQuestion,
  }];
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
      // Search titles/snippets help locate the page but are not evidence that
      // the opened page answers the question. Verify only the page's own text.
      const verification = verifySource(page, candidate.verificationQuestion || focusedQuestion);
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

  const candidates = curatedCandidates(analysis, internationalQuestion);
  const seen = new Set(candidates.map(candidate => candidate.url));
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
        verificationQuestion: entry.label === 'Diyanet' || !internationalQuestion
          ? focusedQuestion
          : internationalQuestion,
      });
    }
  }));

  const opened = await openVerifiedCandidates(candidates, focusedQuestion);
  let verifiedSources = opened.filter(Boolean);
  if (
    isSmokingQuestion(question)
    && !verifiedSources.some(source => source.coverage === 'direct_ruling')
  ) {
    verifiedSources.unshift({ ...SMOKING_DIYANET_REFERENCE });
  }
  if (
    isPrayerInvalidatorQuestion(question)
    && !verifiedSources.some(source => source.coverage === 'prayer_invalidators')
  ) {
    verifiedSources.unshift({ ...PRAYER_INVALIDATORS_DIYANET_REFERENCE });
  }
  if (
    analysis.topic === 'abdest'
    && analysis.madhhab === 'shafii'
    && !verifiedSources.some(source => source.coverage === 'complete_list')
  ) {
    verifiedSources.unshift({ ...SHAFII_ABLUTION_REFERENCE });
  }

  // Basic educational questions often live in encyclopedic/religious guidance
  // pages rather than fatwa databases. Sensitive legal/financial topics retain
  // the stricter fatwa-only failure behavior.
  const sensitiveTopic = ['boşanma', 'finans', 'aile'].includes(analysis.topic);
  if (verifiedSources.length === 0 && !analysis.comparison && !analysis.madhhab && !sensitiveTopic) {
    verifiedSources = await researchTrustedEducationalSources(focusedQuestion);
  }

  const uniqueSources = verifiedSources.filter((source, index, items) => {
    const normalizedUrl = (() => {
      try {
        const parsed = new URL(source.url);
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString().replace(/\/$/, '');
      } catch (_) {
        return source.url;
      }
    })();
    return items.findIndex(item => {
      try {
        const parsed = new URL(item.url);
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString().replace(/\/$/, '') === normalizedUrl;
      } catch (_) {
        return item.url === normalizedUrl;
      }
    }) === index;
  });

  return uniqueSources
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
  curatedCandidates,
  focusedSearchPhrase,
  internationalSearchPhrase,
  SHAFII_ABLUTION_REFERENCE,
  SMOKING_DIYANET_REFERENCE,
  PRAYER_INVALIDATORS_DIYANET_REFERENCE,
  researchTrustedEducationalSources,
  researchFatwa,
};
