import type { ReactNode } from "react";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { direction, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import "../../styles/font-fallbacks.css";
import "../globals.css";
import "../../styles/refinements.css";

const inter = localFont({
  src: "../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
const arabic = localFont({
  src: "../../../node_modules/@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2",
  variable: "--font-arabic",
  display: "swap",
  weight: "100 900",
  adjustFontFallback: false,
  fallback: ["ONYX Arabic Body Fallback"],
});
const display = localFont({
  src: "../../../public/fonts/space-grotesk-latin-variable.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "300 700",
  preload: false,
});
const arabicDisplay = localFont({
  src: "../../../public/fonts/alexandria-arabic-variable.woff2",
  variable: "--font-display-arabic",
  display: "swap",
  weight: "100 900",
  adjustFontFallback: false,
  fallback: ["ONYX Arabic Heading Fallback"],
  // Arabic headings are visible on the first paint; fetch their font with the body fonts.
  preload: true,
});
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getDictionary(locale);
  return (
    <html
      lang={locale}
      dir={direction(locale)}
      className={`${inter.variable} ${arabic.variable} ${display.variable} ${arabicDisplay.variable}`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          {messages.common.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
