import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";
import { preferredLocale, direction } from "@/i18n/config";
import { fixtureCatalog, sampleProduct } from "@/modules/catalog/fixture-provider";
import { ProductCard } from "./components/product-card";
import { FeaturedProducts } from "./components/featured-products";
import { CategoryGrid } from "./components/category-grid";
import { getLandingCategories } from "./categories";
import { AnimatedHeroHeadline } from "./motion/animated-hero-headline";
import { assets } from "./assets";
import { SiteHeader } from "@/components/site-header";
import { navigation } from "@/components/navigation";
import { formatPrice, type ProductDisplay } from "@/modules/catalog/contracts";
vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ push: vi.fn() }),
}));
function paths(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, v]) =>
    typeof v === "object" ? paths(v, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}
describe("localization and navigation", () => {
  it("has complete matching nonempty dictionaries", () => {
    expect(paths(ar).sort()).toEqual(paths(en).sort());
    expect(JSON.stringify(ar)).not.toContain(':""');
  });
  it("defaults to Arabic and only trusts supported cookie values", () => {
    expect(preferredLocale()).toBe("ar");
    expect(preferredLocale("en")).toBe("en");
    expect(preferredLocale("fr")).toBe("ar");
    expect(direction("ar")).toBe("rtl");
    expect(direction("en")).toBe("ltr");
  });
  for (const [locale, messages] of [
    ["ar", ar],
    ["en", en],
  ] as const)
    it(`renders ${locale} header and complete semantic heading`, () => {
      const header = renderToStaticMarkup(<SiteHeader locale={locale} messages={messages} />);
      for (const [key, href] of navigation) {
        expect(header).toContain(messages.nav[key]);
        expect(header).toContain(`href="${href}"`);
      }
      const headline = renderToStaticMarkup(
        <AnimatedHeroHeadline locale={locale} copy={messages.hero} common={messages.common} />,
      );
      expect(headline).toContain(`aria-label="${messages.hero.line1} ${messages.hero.line2}"`);
      expect(headline).not.toContain("opacity:0");
      expect(headline).toContain('data-phase="static"');
      expect((headline.match(/data-color=/g) || []).length).toBe(3);
    });
});
describe("catalog boundary and actual assets", () => {
  for (const [locale, messages] of [
    ["en", en],
    ["ar", ar],
  ] as const) {
    it(`${locale}: exposes honest missing metadata and renders verified provider attributes`, () => {
      const missing = renderToStaticMarkup(
        <ProductCard product={sampleProduct} locale={locale} labels={messages.common} />,
      );
      for (const text of [
        messages.common.colorsSoon,
        messages.common.sizesSoon,
        messages.common.priceSoon,
        messages.common.preview,
      ])
        expect(missing).toContain(text);
      expect(missing).not.toContain('class="product-colors"');
      expect(missing).not.toContain('class="product-sizes"');
      const verified: ProductDisplay = {
        ...sampleProduct,
        category: { slug: "test", title: { en: "Test category", ar: "تصنيف الاختبار" } },
        colors: [{ id: "blue", hex: "#234567", label: { en: "Test blue", ar: "أزرق للاختبار" } }],
        sizes: [{ id: "size", label: { en: "Test size", ar: "مقاس الاختبار" } }],
        price: { minorUnits: 12345, currency: "KWD", scale: 3 },
      };
      const html = renderToStaticMarkup(
        <ProductCard product={verified} locale={locale} labels={messages.common} />,
      );
      for (const text of [
        verified.category!.title[locale],
        verified.colors![0]!.label[locale],
        verified.sizes![0]!.label[locale],
        formatPrice(verified.price!, locale),
      ])
        expect(html).toContain(text);
      for (const text of [
        messages.common.colorsSoon,
        messages.common.sizesSoon,
        messages.common.priceSoon,
      ])
        expect(html).not.toContain(text);
      expect(html).toContain('class="sr-only"');
      expect(html).not.toContain('role="button"');
    });
  }
  it("formats supplied integer minor units using the currency scale", () => {
    expect(formatPrice({ minorUnits: 12345, currency: "USD", scale: 2 }, "en")).toBe("$123.45");
    expect(formatPrice({ minorUnits: 12345, currency: "JPY", scale: 0 }, "en")).toBe("¥12,345");
    expect(formatPrice({ minorUnits: 10, currency: "USD", scale: 2 }, "en")).toBe("$0.10");
  });
  it("uses one fixture object across four unique presentation slots", async () => {
    const data = await fixtureCatalog.getFeatured();
    expect(data.slots).toHaveLength(4);
    expect(new Set(data.slots.map((slot) => slot.key)).size).toBe(4);
    expect(data.slots.every((slot) => slot.product === sampleProduct)).toBe(true);
    expect(sampleProduct.price).toBeUndefined();
    expect(sampleProduct.variants).toBeUndefined();
    const html = renderToStaticMarkup(
      <FeaturedProducts locale="en" messages={en} catalog={data} />,
    );
    expect((html.match(/data-product-id="preview-drip-logo"/g) || []).length).toBe(4);
    expect(html).toContain(en.featured.preview);
  });
  it("renders arbitrary provider data, optional prices, images and variant availability", () => {
    const product: ProductDisplay = {
      id: "test-only",
      title: { ar: "اختبار", en: "Test" },
      price: { minorUnits: 12345, currency: "USD", scale: 2 },
      variants: [{ id: "v1", availability: "unavailable" }],
    };
    const html = renderToStaticMarkup(
      <ProductCard product={product} locale="en" labels={en.common} />,
    );
    expect(html).toContain("$123.45");
    expect(html).toContain("Currently unavailable");
    expect(html).toContain("Image coming soon");
    expect(html).not.toContain("Drip Logo");
  });
  it("supports a real catalog with variable product counts", () => {
    const html = renderToStaticMarkup(
      <FeaturedProducts
        locale="en"
        messages={en}
        catalog={{ preview: false, slots: [{ key: "single", product: sampleProduct }] }}
      />,
    );
    expect((html.match(/data-product-id=/g) || []).length).toBe(1);
    expect(html).not.toContain(en.featured.preview);
  });
  it("renders five honest category preview destinations using the corresponding artwork", () => {
    const html = renderToStaticMarkup(
      <CategoryGrid
        copy={en.categories}
        locale="en"
        categories={getLandingCategories(en.categories)}
      />,
    );
    expect((html.match(/<article/g) || []).length).toBe(5);
    expect(html).toContain('href="/en/categories/cars"');
    for (const key of Object.keys(assets.categories)) expect(html).toContain(`category-${key}`);
  });
  for (const [locale, messages] of [
    ["en", en],
    ["ar", ar],
  ] as const) {
    it(`${locale}: accepts ordered category display data and omits unpublished entries`, () => {
      const initial = getLandingCategories(messages.categories);
      const title = locale === "ar" ? "تصنيف جديد" : "New category";
      const categories = [
        { ...initial[2]!, id: "stable-new-id", slug: "new-style", title },
        { ...initial[4]!, id: "unpublished-id", published: false },
        initial[0]!,
      ];
      const html = renderToStaticMarkup(
        <CategoryGrid copy={messages.categories} locale={locale} categories={categories} />,
      );
      expect([...html.matchAll(/data-category-id="([^"]+)"/g)].map((match) => match[1])).toEqual([
        "stable-new-id",
        "cars",
      ]);
      expect(html).toContain(title);
      expect(html).toContain(`href="/${locale}/categories/new-style"`);
      expect(html).toContain("category-typography.webp");
      expect(html).not.toContain("unpublished-id");
      expect(html).not.toContain("category-abstract.webp");
      expect(categories).toHaveLength(3);
    });
  }
  it("preserves original hashes and all official logo files", () => {
    const inventory = JSON.parse(readFileSync("docs/phase-01/asset-inventory.json", "utf8")) as {
      source: string;
      sha256: string;
    }[];
    for (const asset of inventory)
      expect(createHash("sha256").update(readFileSync(asset.source)).digest("hex")).toBe(
        asset.sha256,
      );
    for (const logo of Object.values(assets.logo))
      expect(existsSync(`public${logo.src}`)).toBe(true);
  });
});
