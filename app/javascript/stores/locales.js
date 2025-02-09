import { create } from 'zustand'
import { I18n } from "i18n-js"
import translations from "../locales.json"

const i18n = new I18n(translations)
window.I18n = i18n

i18n.defaultLocale = "es"
i18n.locale = "es"

const useLocaleStore = create((set, get) => ({
  currentLocale: "es",
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
