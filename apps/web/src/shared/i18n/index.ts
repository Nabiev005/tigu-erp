import { LocaleSchema, type Locale } from '@tigu/shared';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ky from './ky.json';
import ru from './ru.json';

const STORAGE_KEY = 'tigu.locale';

function readStoredLocale(): Locale {
  try {
    const parsed = LocaleSchema.safeParse(localStorage.getItem(STORAGE_KEY));
    return parsed.success ? parsed.data : 'ky';
  } catch {
    return 'ky';
  }
}

export function currentLocale(): Locale {
  const parsed = LocaleSchema.safeParse(i18n.language);
  return parsed.success ? parsed.data : 'ky';
}

export function setLocale(locale: Locale): void {
  void i18n.changeLanguage(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage may be unavailable (private mode); the choice then lasts for this session only.
  }
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
});

void i18n.use(initReactI18next).init({
  resources: { ky: { translation: ky }, ru: { translation: ru } },
  lng: readStoredLocale(),
  fallbackLng: 'ky',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
