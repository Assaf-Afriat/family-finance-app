import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import he from '@/locales/he.json'

const resources = {
  en: { translation: en },
  he: { translation: he },
}

const savedLanguage = typeof localStorage !== 'undefined' 
  ? localStorage.getItem('language') || 'en'
  : 'en'

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n

export const languages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'he', name: 'עברית', dir: 'rtl' },
]

export function getLanguageDirection(lang: string): 'ltr' | 'rtl' {
  return lang === 'he' ? 'rtl' : 'ltr'
}

export function changeLanguage(lang: string) {
  i18n.changeLanguage(lang)
  localStorage.setItem('language', lang)
  document.documentElement.dir = getLanguageDirection(lang)
  document.documentElement.lang = lang
}
