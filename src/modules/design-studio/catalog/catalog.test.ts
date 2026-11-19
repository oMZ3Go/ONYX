import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { fixtureStudioCatalog } from "./fixtures";
import { availableVariants, compatibleArtworks } from "./selectors";
import type { GarmentProduct } from "../types";
import inventory from "../../../../docs/phase-03/asset-inventory.json";
import ar from "../../../../messages/ar.json";
import en from "../../../../messages/en.json";

const product = fixtureStudioCatalog.products[0]!;
const variant = product.variants[0]!;

describe("studio catalog publication boundaries", () => {
  it("excludes inactive products, disabled colors, unavailable colors and incomplete image pairs", () => {
    const candidates: GarmentProduct = {
      ...product,
      variants: [
        variant,
        { ...variant, id: "disabled", active: false },
        { ...variant, id: "unavailable", availability: "unavailable" },
        { ...variant, id: "front-only", mockups: { front: variant.mockups.front } },
        {
          ...variant,
          id: "empty-image",
          mockups: { ...variant.mockups, back: { ...variant.mockups.back!, src: "" } },
        },
      ],
    };
    expect(availableVariants(candidates).map((entry) => entry.id)).toEqual([variant.id]);
    expect(availableVariants({ ...candidates, active: false })).toEqual([]);
  });

  it("honors artwork publication and product/color compatibility supplied by an adapter", () => {
    const art = fixtureStudioCatalog.artworks[0]!;
    const entries = [
      art,
      { ...art, id: "disabled", active: false },
      { ...art, id: "other-product", compatibility: { productIds: ["other"], variantIds: null } },
      {
        ...art,
        id: "other-color",
        compatibility: { productIds: [product.id], variantIds: ["other"] },
      },
      {
        ...art,
        id: "matching-color",
        compatibility: { productIds: [product.id], variantIds: [variant.id] },
      },
    ];
    expect(compatibleArtworks(entries, product.id, variant.id).map((entry) => entry.id)).toEqual([
      art.id,
      "matching-color",
    ]);
  });

  it("does not present preview fixtures as priced, calibrated or commercially approved", () => {
    expect(product.variants).toHaveLength(1);
    expect(variant.availability).toBe("preview");
    expect(variant.price).toBeNull();
    expect(variant.printSpecification).toBeNull();
    for (const artwork of fixtureStudioCatalog.artworks)
      expect(artwork.rights.commercialUse).toBe(false);
    expect(
      fixtureStudioCatalog.artworks.find((artwork) => artwork.id === "dragon")?.rights.status,
    ).toBe("provisional");
  });

  it("preserves every supplied source and delivers proportional previews with transparent hoodie edges", async () => {
    for (const artwork of fixtureStudioCatalog.artworks) {
      const original = await sharp(`public${artwork.source.src}`).metadata();
      expect(original.width).toBe(artwork.source.width);
      expect(original.height).toBe(artwork.source.height);
    }
    for (const asset of inventory) {
      const original = readFileSync(asset.source);
      expect(createHash("sha256").update(original).digest("hex")).toBe(asset.sha256);
      const preview = await sharp(asset.output).metadata();
      expect(preview.width! / preview.height!).toBe(asset.originalWidth / asset.originalHeight);
      expect(preview.hasAlpha).toBe(asset.hasAlpha);
      expect(asset.webBytes).toBeLessThan(asset.originalBytes);
      if (asset.hasAlpha) {
        const { data, info } = await sharp(asset.output)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let transparent = 0,
          edge = 0;
        for (let offset = 3; offset < data.length; offset += info.channels) {
          if (data[offset] === 0) transparent++;
          else if (data[offset]! < 255) edge++;
        }
        expect(transparent).toBeGreaterThan(info.width * info.height * 0.2);
        expect(edge).toBeGreaterThan(1000);
      }
    }
  });

  it("ships matching translation structures and uncorrupted Arabic", () => {
    function keys(value: object, prefix = ""): string[] {
      return Object.entries(value)
        .flatMap(([key, child]) =>
          typeof child === "object" ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`],
        )
        .sort();
    }
    expect(keys(ar.designStudio)).toEqual(keys(en.designStudio));
    expect(JSON.stringify(ar.designStudio)).not.toMatch(/\ufffd|\?{2}/);
  });
});
