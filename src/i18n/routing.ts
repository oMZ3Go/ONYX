import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale, localeCookie } from "./config";
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
  localeCookie: { name: localeCookie, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 },
});
