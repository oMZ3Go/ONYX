import { getRequestConfig } from "next-intl/server";
import { isLocale, defaultLocale } from "./config";
import { getDictionary } from "./messages";
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : defaultLocale;
  return { locale, messages: await getDictionary(locale) };
});
