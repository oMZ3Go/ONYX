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
import { AnimatedHeroHeadline } from "./motion/animated-hero-headline";
import { assets } from "./assets";
import { SiteHeader } from "@/components/site-header";
import { navigation } from "@/components/navigation";
import type { ProductDisplay } from "@/modules/catalog/contracts";
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
  it("renders five non-link categories using the corresponding artwork", () => {
    const html = renderToStaticMarkup(<CategoryGrid copy={en.categories} />);
    expect((html.match(/<article/g) || []).length).toBe(5);
    expect(html).not.toContain("href=");
    for (const key of Object.keys(assets.categories)) expect(html).toContain(`category-${key}`);
  });
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
