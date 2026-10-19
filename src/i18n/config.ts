export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const localeCookie = "ONYX_LOCALE";
export function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "en";
}
export function preferredLocale(cookie?: string): Locale {
  return isLocale(cookie) ? cookie : defaultLocale;
}
export function direction(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}
