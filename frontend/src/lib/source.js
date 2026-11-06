// Detecta a origem real do visitante: campanha (utm_source), buscador,
// rede social, e-mail ou acesso direto. Retorna um rótulo amigável.
const REFERRER_MAP = [
  { test: /(^|\.)google\./, label: 'Google' },
  { test: /(^|\.)bing\./, label: 'Bing' },
  { test: /(^|\.)(duckduckgo)\./, label: 'DuckDuckGo' },
  { test: /(^|\.)(facebook|fb)\./, label: 'Facebook' },
  { test: /(^|\.)instagram\./, label: 'Instagram' },
  { test: /(^|\.)(youtube|youtu)\./, label: 'YouTube' },
  { test: /(^|\.)(twitter|x|t)\.co/, label: 'Twitter/X' },
  { test: /(^|\.)linkedin\./, label: 'LinkedIn' },
  { test: /(^|\.)(whatsapp|wa\.me|api\.whatsapp)\./, label: 'WhatsApp' },
  { test: /(^|\.)(t\.me|telegram)\./, label: 'Telegram' },
  { test: /(^|\.)(mail|gmail|outlook|webmail)\./, label: 'E-mail' },
  { test: /(^|\.)(sbt|aacd)\./, label: 'SBT / AACD' },
];

const UTM_LABELS = {
  email: 'E-mail',
  'e-mail': 'E-mail',
  newsletter: 'E-mail',
  google: 'Google',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  sbt: 'SBT',
};

function labelFromUtm(src) {
  const key = src.toLowerCase().trim();
  if (UTM_LABELS[key]) return UTM_LABELS[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function getTrafficSource() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = params.get('utm_source');
    if (utm) return labelFromUtm(utm);
    if (params.get('gclid')) return 'Google Ads';
    if (params.get('fbclid')) return 'Facebook';

    const ref = document.referrer || '';
    if (!ref) return 'Direto';

    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (host === window.location.hostname) return 'Direto';

    for (const entry of REFERRER_MAP) {
      if (entry.test.test(host)) return entry.label;
    }
    return host;
  } catch (e) {
    return 'Direto';
  }
}
