const SOURCE_RULES = [
  {
    domains: ['fetva.diyanet.gov.tr', 'kurul.diyanet.gov.tr', 'diyanet.gov.tr'],
    name: 'Diyanet Din İşleri Yüksek Kurulu',
    type: 'official_fatwa',
    level: 5,
    label: 'Diyanet',
  },
  {
    domains: ['iifa-aifi.org'],
    name: 'International Islamic Fiqh Academy (IIFA)',
    type: 'official_fatwa',
    level: 5,
    label: 'IIFA',
  },
  {
    domains: ['dar-alifta.org', 'dar-alifta.gov.eg'],
    name: 'Dar al-Ifta al-Misriyyah',
    type: 'official_fatwa',
    level: 5,
    label: 'Dar al-Ifta',
  },
  {
    domains: ['seekersguidance.org'],
    name: 'SeekersGuidance',
    type: 'institutional',
    level: 4,
    label: 'Mezhep kaynağı',
  },
  {
    domains: ['islamqa.org'],
    name: 'IslamQA.org',
    type: 'aggregator',
    level: 2,
    label: 'Derleyici kaynak',
  },
];

function hostnameOf(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch (_) {
    return '';
  }
}

function classifySource(url) {
  const hostname = hostnameOf(url);
  const rule = SOURCE_RULES.find(item => item.domains.some(
    domain => hostname === domain || hostname.endsWith(`.${domain}`),
  ));
  return rule ? { ...rule, hostname } : null;
}

module.exports = { SOURCE_RULES, classifySource, hostnameOf };
