import { getLocales } from 'expo-localization';

import { en, type StringKey } from './en';
import { fr } from './fr';

const primary = getLocales()[0];

export const language: 'fr' | 'en' = primary?.languageCode === 'fr' ? 'fr' : 'en';

/** Locale used for numbers and dates (device region when available). */
export const locale: string = primary?.languageTag ?? (language === 'fr' ? 'fr-FR' : 'en-US');

/** Currency of the phone's region, for cost estimates. */
export const currency: string = primary?.currencyCode ?? 'EUR';

const strings = language === 'fr' ? fr : en;

export function t(key: StringKey, params?: Record<string, string | number>): string {
  let s: string = strings[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}
