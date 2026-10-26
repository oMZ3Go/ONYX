import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { assets, categoryKeys } from "@/modules/landing/assets";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Icon } from "@/components/icon";
type Props = { params: Promise<{ locale: string; slug: string }> };
const isCategory = (slug: string): slug is (typeof categoryKeys)[number] =>
  categoryKeys.some((key) => key === slug);
export function generateStaticParams() {
  return categoryKeys.map((slug) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCategory(slug)) notFound();
  const m = await getDictionary(locale);
  return {
    title: `${m.categories[slug].title} — ${m.categories.soon} | ONYX`,
    robots: { index: false, follow: false },
  };
}
export default async function CategoryPreview({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isCategory(slug)) notFound();
  setRequestLocale(locale);
  const m = await getDictionary(locale),
    copy = m.categories;
  return (
    <>
      <header className="category-header container">
        <a className="brand-logo" href={`/${locale}`} aria-label={m.common.homeLabel}>
          <Image draggable={false} {...assets.logo.light} alt="ONYX" sizes="100px" />
        </a>
        <LanguageSwitcher locale={locale} label={m.nav.language} />
      </header>
      <main id="main-content" className="category-preview container" tabIndex={-1}>
        <Image
          draggable={false}
          {...assets.categories[slug]}
          alt=""
          sizes="(max-width: 767px) 90vw, 45vw"
          loading="eager"
        />
        <div>
          <p className="eyebrow">{copy.soon}</p>
          <h1>{copy[slug].title}</h1>
          <p className="category-tagline">{copy[slug].description}</p>
          <p>{copy.notice}</p>
          <a className="button button-primary" href={`/${locale}#categories`}>
            {copy.back}
            <Icon name="arrow" className="directional" />
          </a>
        </div>
      </main>
    </>
  );
}
