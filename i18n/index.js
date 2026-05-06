import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  pa: { translation: pa },
};

// Get device language as a fallback
const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  return locales && locales.length > 0 ? locales[0].languageCode : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(), // Initial language, will be updated by hydration
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3',
  });

export default i18n;
