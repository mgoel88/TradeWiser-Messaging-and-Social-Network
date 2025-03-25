import { en } from './locales/en';
import { hi } from './locales/hi';
import { ta } from './locales/ta';
import { bn } from './locales/bn';
import { create } from 'zustand';

type Locale = 'en' | 'hi' | 'ta' | 'bn';

// Available languages
export const locales = {
  en: { name: 'English', flag: '🇬🇧' },
  hi: { name: 'हिंदी', flag: '🇮🇳' },
  ta: { name: 'தமிழ்', flag: '🇮🇳' },
  bn: { name: 'বাংলা', flag: '🇮🇳' }
};

// Translations map
const translations = {
  en,
  hi,
  ta,
  bn
};

// Language store
interface LanguageState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  locale: (localStorage.getItem('language') as Locale) || 'en',
  setLocale: (locale: Locale) => {
    localStorage.setItem('language', locale);
    set({ locale });
  },
  t: (key: string) => {
    const { locale } = get();
    const keys = key.split('.');
    
    let result = translations[locale];
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        // @ts-ignore
        result = result[k];
      } else {
        // Fallback to English if key not found in selected language
        let fallback = translations['en'];
        for (const k of keys) {
          if (fallback && typeof fallback === 'object' && k in fallback) {
            // @ts-ignore
            fallback = fallback[k];
          } else {
            return key; // Key not found in any language
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  }
}));