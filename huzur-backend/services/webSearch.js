const { classifySource } = require('./sourceRegistry');

const HTTP_TIMEOUT_MS = 7000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const pageCache = new Map();

function decodeHtml(value = '') {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)));
}

function stripHtml(html = '') {
  return decodeHtml(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url, options = {}) {
  const { retries = 1, ...fetchOptions } = options;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36 HuzurAI/1.0',
          'Accept-Language': 'tr,en;q=0.8',
          ...(fetchOptions.headers || {}),
        },
      });
      if (response.status < 500 || attempt === retries) return response;
      lastError = new Error(`Temporary upstream error (${response.status})`);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
    } finally {
      clearTimeout(timeout);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw lastError;
}

function normalizeResults(items) {
  const seen = new Set();
  return items.flatMap(item => {
    let url;
    try {
      url = new URL(item.url).toString();
    } catch (_) {
      return [];
    }
    if (!/^https?:/.test(url) || seen.has(url)) return [];
    seen.add(url);
    return [{ title: stripHtml(item.title || ''), url, snippet: stripHtml(item.snippet || '') }];
  });
}

async function searchBrave(query, count) {
  const response = await fetchWithTimeout(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
    { headers: { Accept: 'application/json', 'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY } },
  );
  if (!response.ok) throw new Error(`Brave search failed (${response.status})`);
  const data = await response.json();
  return (data.web?.results || []).map(item => ({
    title: item.title, url: item.url, snippet: item.description,
  }));
}

async function searchGoogle(query, count) {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_SEARCH_API_KEY,
    cx: process.env.GOOGLE_SEARCH_CX,
    q: query,
    num: String(Math.min(count, 10)),
  });
  const response = await fetchWithTimeout(`https://www.googleapis.com/customsearch/v1?${params}`);
  if (!response.ok) throw new Error(`Google search failed (${response.status})`);
  const data = await response.json();
  return (data.items || []).map(item => ({ title: item.title, url: item.link, snippet: item.snippet }));
}

async function searchSerper(query, count) {
  const response = await fetchWithTimeout('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': process.env.SERPER_API_KEY },
    body: JSON.stringify({ q: query, num: count }),
  });
  if (!response.ok) throw new Error(`Serper search failed (${response.status})`);
  const data = await response.json();
  return (data.organic || []).map(item => ({ title: item.title, url: item.link, snippet: item.snippet }));
}

async function searchDuckDuckGo(query, count) {
  const response = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error(`DuckDuckGo search failed (${response.status})`);
  const html = await response.text();
  const results = [];
  const pattern = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(html)) && results.length < count) {
    let url = decodeHtml(match[1]);
    try {
      const parsed = new URL(url, 'https://duckduckgo.com');
      const redirected = parsed.searchParams.get('uddg');
      url = redirected ? decodeURIComponent(redirected) : parsed.toString();
    } catch (_) {}
    results.push({ title: stripHtml(match[2]), url, snippet: '' });
  }
  return results;
}

async function webSearch(query, { count = 5 } = {}) {
  let results;
  if (process.env.BRAVE_SEARCH_API_KEY) results = await searchBrave(query, count);
  else if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) results = await searchGoogle(query, count);
  else if (process.env.SERPER_API_KEY) results = await searchSerper(query, count);
  else results = await searchDuckDuckGo(query, count);
  return normalizeResults(results);
}

async function searchDiyanet(question, { count = 5 } = {}) {
  const searchUrl = `https://kurul.diyanet.gov.tr/tr/fetvalar?arama=${encodeURIComponent(question)}`;
  const response = await fetchWithTimeout(searchUrl, { headers: { Accept: 'text/html' } });
  if (!response.ok) throw new Error(`Diyanet search failed (${response.status})`);
  const html = await response.text();
  const results = [];
  const seen = new Set();
  const pattern = /Soru:<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?Cevap:<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<a[^>]+href=["']([^"']*\/tr\/fetva\/[^"']+)["']/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const url = new URL(decodeHtml(match[3]), response.url).toString();
    if (seen.has(url)) continue;
    seen.add(url);
    results.push({ title: stripHtml(match[1]) || 'Diyanet fetvası', url, snippet: stripHtml(match[2]) });
  }
  const tokens = queryTokens(question);
  results.forEach(result => {
    const haystack = `${result.title} ${result.snippet}`.toLocaleLowerCase('tr-TR');
    result.relevance = tokens.filter(token => tokenAppears(haystack, token)).length;
  });
  results.sort((a, b) => b.relevance - a.relevance);
  return normalizeResults(results.slice(0, count));
}

async function openPage(url) {
  const cached = pageCache.get(url);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.value;

  const response = await fetchWithTimeout(url, {
    retries: 0,
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  if (!response.ok) throw new Error(`Page could not be opened (${response.status})`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new Error('Unsupported page content');
  }
  const html = await response.text();
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  const text = stripHtml(html).slice(0, 24000);
  if (text.length < 250) throw new Error('Page has no substantial readable content');
  const canonicalUrl = new URL(canonicalMatch?.[1] || response.url || url, response.url || url);
  canonicalUrl.hostname = canonicalUrl.hostname.replace(/^www\.www\./, 'www.');
  const value = {
    url: canonicalUrl.toString(),
    title: stripHtml(titleMatch?.[1] || ''),
    text,
  };
  pageCache.set(url, { savedAt: Date.now(), value });
  return value;
}

function queryTokens(question) {
  const stop = new Set(['acaba', 'göre', 'için', 'nasıl', 'nedir', 'mıdır', 'mudur', 'mi', 'mı', 'mu', 'mü', 've', 'veya', 'bir']);
  return String(question).toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/).filter(token => token.length > 2 && !stop.has(token));
}

function tokenAppears(haystack, token) {
  const aliases = {
    kripto: ['crypto', 'cryptocurrency'],
    para: ['currency', 'money'],
    faiz: ['interest', 'usury', 'riba'],
    oruç: ['fasting', 'fast'],
    macunu: ['toothpaste'],
    müzik: ['music'],
    sigara: ['smoking', 'tobacco', 'cigarette'],
    tütün: ['smoking', 'tobacco', 'cigarette'],
    namaz: ['prayer', 'salah'],
    seferi: ['traveller', 'traveler', 'travel'],
    abdest: ['ablution', 'wudu'],
    bozulur: ['invalidate', 'invalidates', 'breaks'],
    kılınır: ['pray', 'prayer', 'performed'],
    kadın: ['woman', 'women'],
    adetliyken: ['menstruation', 'menstrual', 'menses'],
    okuyabilir: ['recite', 'recitation', 'read'],
    zekat: ['zakat'],
    boşanma: ['divorce'],
    iddet: ['iddah', 'waiting period'],
    caiz: ['permissible', 'ruling'],
  };
  return haystack.includes(token)
    || (token.length >= 6 && haystack.includes(token.slice(0, 5)))
    || (aliases[token] || []).some(alias => haystack.includes(alias));
}

function verifySource(page, question) {
  const classification = classifySource(page.url);
  if (!classification || classification.level < 2) return { valid: false, reason: 'untrusted_domain' };
  const haystack = `${page.title} ${page.text}`.toLocaleLowerCase('tr-TR');
  const normalizedQuestion = String(question).toLocaleLowerCase('tr-TR');
  const normalizedTitle = String(page.title).toLocaleLowerCase('tr-TR');
  const overlySpecificTerms = ['cuma', 'bayram', 'cenaze', 'vitir', 'teravih'];
  const mismatchedSpecificity = overlySpecificTerms.some(term => (
    normalizedTitle.includes(term) && !normalizedQuestion.includes(term)
  ));
  if (mismatchedSpecificity) return { valid: false, reason: 'overly_specific_page' };
  const tokens = queryTokens(question);
  const matches = tokens.filter(token => tokenAppears(haystack, token));
  const requiredMatches = classification.level === 5
    ? (tokens.length <= 3 ? tokens.length : Math.ceil(tokens.length * 0.6))
    : Math.min(2, tokens.length);
  const relevant = tokens.length === 0 || matches.length >= requiredMatches;
  return { valid: relevant, reason: relevant ? null : 'not_relevant', classification, matches };
}

module.exports = { webSearch, searchDiyanet, openPage, verifySource, stripHtml };
