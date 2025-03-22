declare module '@/stores/locales' {
  interface I18n {
    t(key: string, options?: Record<string, any>): string;
  }

  const i18n: I18n;
  export default i18n;
}
