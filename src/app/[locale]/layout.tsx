import type { ReactNode } from "react";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { direction, isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import "../globals.css";

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
    <html lang={locale} dir={direction(locale)} className={`${inter.variable} ${arabic.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">
          {messages.common.skip}
        </a>
        {children}
      </body>
    </html>
  );
}
