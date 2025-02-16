import { create } from 'zustand'
import { I18n } from "i18n-js"
import translations from "../locales.json"

const defaultLocale = document.querySelector('meta[name="default-locale"]')?.getAttribute('content') || '';

const i18n = new I18n(translations)
window.I18n = i18n

i18n.defaultLocale = defaultLocale
i18n.locale = i18n.defaultLocale

const useLocaleStore = create((set, get) => ({
  currentLocale: i18n.locale,
  setLocale: (locale) => {
    i18n.locale = locale
    set({ currentLocale: locale })
  },
  // t: (key, options = {}) => i18n.t(key, options)
}))

// Extend the store with a method to access i18n directly
useLocaleStore.i18n = i18n
// useLocaleStore.t = i18n.t

export default i18n
export {useLocaleStore}
