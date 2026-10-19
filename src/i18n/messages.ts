import type english from "../../messages/en.json";
import type { Locale } from "./config";
export type Messages = typeof english;
export async function getDictionary(locale: Locale): Promise<Messages> {
  return (
    await (locale === "ar" ? import("../../messages/ar.json") : import("../../messages/en.json"))
  ).default;
}
