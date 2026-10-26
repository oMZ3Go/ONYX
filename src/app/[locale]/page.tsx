import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/messages";
import { catalog } from "@/modules/catalog/read-catalog";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/modules/landing/components/hero-section";
import { FeaturedProducts } from "@/modules/landing/components/featured-products";
import { CategoryGrid } from "@/modules/landing/components/category-grid";
import { getLandingCategories } from "@/modules/landing/categories";
import { HowItWorks } from "@/modules/landing/components/how-it-works";
import { OfferBanner } from "@/modules/landing/components/offer-banner";
import { BrandStory } from "@/modules/landing/components/brand-story";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = await getDictionary(locale);
  return {
    title: m.meta.title,
    description: m.meta.description,
    robots: { index: false, follow: false },
    alternates: { languages: { ar: "/ar", en: "/en", "x-default": "/ar" } },
  };
}
export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [m, featured] = await Promise.all([getDictionary(locale), catalog.getFeatured()]);
  return (
    <>
      <SiteHeader locale={locale} messages={m} />
      <main id="main-content" tabIndex={-1}>
        <HeroSection locale={locale} messages={m} />
        <FeaturedProducts locale={locale} messages={m} catalog={featured} />
        <CategoryGrid
          copy={m.categories}
          locale={locale}
          categories={getLandingCategories(m.categories)}
        />
        <HowItWorks locale={locale} copy={m.process} />
        <OfferBanner copy={m.offer} start={m.common.start} locale={locale} />
        <BrandStory copy={m.story} />
        <section
          id="design-studio"
          className="studio-notice section-light"
          aria-labelledby="studio-title"
          tabIndex={-1}
        >
          <div className="container">
            <div>
              <p className="eyebrow">{m.studio.eyebrow}</p>
              <h2 id="studio-title">{m.studio.title}</h2>
              <p>{m.studio.description}</p>
            </div>
            <a href="#collection" className="button button-ink">
              {m.common.back}
            </a>
          </div>
        </section>
      </main>
      <SiteFooter messages={m} locale={locale} />
    </>
  );
}
