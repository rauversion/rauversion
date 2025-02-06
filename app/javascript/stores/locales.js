import { I18n } from "i18n-js";
import translations from "../locales.json";

const i18n = new I18n(translations);

i18n.defaultLocale = "es";
i18n.locale = "es";

//window.i18n = i18n;

export default i18n