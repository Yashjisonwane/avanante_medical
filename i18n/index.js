import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import pa from './locales/pa.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  pa: { translation: pa },
};

// Get device language
const deviceLanguage = Localization.getLocales()[0].languageCode;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage, // default language based on device
    fallbackLng: 'en', // fallback language
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    compatibilityJSON: 'v3', // to support react-native
  });

export default i18n;
