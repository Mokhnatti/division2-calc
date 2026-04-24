import i18next from 'i18next';
import type { Locale } from './i18n.js';

const SUPPORTED_SET: Set<string> = new Set(['en', 'ru']);

class LangState {
  current: Locale = $state('en');
  ready: boolean = $state(false);

  init(lang: Locale) {
    this.current = lang;
    this.ready = true;
    i18next.on('languageChanged', (lng) => {
      this.current = (SUPPORTED_SET.has(lng) ? lng : 'en') as Locale;
    });
  }
}

export const lang = new LangState();

export function t(ns: string, key: string, opts?: Record<string, unknown>): string {
  void lang.current;
  const full = `${ns}:${key}`;
  return i18next.t(full, { defaultValue: key, ...(opts || {}) }) as string;
}

export function tr(ns: string, key: string, fallback: string, opts?: Record<string, unknown>): string {
  void lang.current;
  const full = `${ns}:${key}`;
  return i18next.t(full, { defaultValue: fallback, ...(opts || {}) }) as string;
}
