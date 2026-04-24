import i18next from 'i18next';
import HttpBackend from 'i18next-http-backend';

declare const __BUILD_TS__: string | undefined;
const BUILD_TOKEN = typeof __BUILD_TS__ !== 'undefined' ? __BUILD_TS__ : String(Date.now());

const SUPPORTED = ['en', 'ru'] as const;
export type Locale = (typeof SUPPORTED)[number];
const NAMESPACES = ['ui', 'stats', 'weapons', 'brands', 'gear-sets', 'talents', 'named-gear', 'named-bonus', 'named-source', 'talent-desc', 'weapon-mods', 'weapon-source', 'brand-bonuses', 'set-bonuses', 'set-chest', 'set-backpack'];
const STORAGE_KEY = 'divcalc:lang';

function isLocale(x: string | null | undefined): x is Locale {
  return !!x && (SUPPORTED as readonly string[]).includes(x);
}

export function detectLang(): Locale {
  const path = globalThis.location?.pathname || '';
  for (const lc of SUPPORTED) {
    if (path.startsWith(`/${lc}/`) || path === `/${lc}`) return lc;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // ignore
  }
  const nav = (navigator.language || '').toLowerCase();
  for (const lc of SUPPORTED) {
    if (nav.startsWith(lc.split('-')[0] ?? '')) return lc;
  }
  return 'en';
}

export async function initI18n(lng: Locale): Promise<void> {
  await i18next.use(HttpBackend).init({
    lng,
    fallbackLng: 'en',
    ns: NAMESPACES,
    defaultNS: 'ui',
    supportedLngs: [...SUPPORTED],
    load: 'currentOnly',
    nonExplicitSupportedLngs: false,
    backend: { loadPath: `/locales/{{lng}}/{{ns}}.json?v=${BUILD_TOKEN}` },
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    partialBundledLanguages: true,
  });
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
  document.documentElement.lang = lng;
}

export async function switchLang(lng: Locale): Promise<void> {
  await i18next.changeLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
  document.documentElement.lang = lng;
}

export { i18next };
