import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import en from "../../../../messages/en.json";
import ar from "../../../../messages/ar.json";
import { StudioScene } from "./studio-scene";
import { studioArtworks, studioAssets } from "./artworks";

describe("studio assets and fallback", () => {
  it("retains actual Arabic text instead of an encoding replacement", () => {
    expect(ar.studio.title).toMatch(/[\u0600-\u06ff]/);
    expect(JSON.stringify(ar.studio)).not.toMatch(/\?{2}|\ufffd/);
  });
  it("preserves the seven originals and supplies transparent, bounded derivatives", () => {
    const inventory = JSON.parse(readFileSync("docs/phase-02/asset-inventory.json", "utf8")) as {
      source: string;
      sha256: string;
      hasAlpha: boolean;
      webBytes: number;
      originalBytes: number;
    }[];
    expect(inventory).toHaveLength(7);
    for (const asset of inventory) {
      expect(createHash("sha256").update(readFileSync(asset.source)).digest("hex")).toBe(
        asset.sha256,
      );
      expect(asset.hasAlpha).toBe(true);
      expect(asset.webBytes).toBeLessThan(asset.originalBytes);
    }
    for (const asset of [
      ...Object.values(studioAssets),
      ...studioArtworks.map((artwork) => artwork.image),
    ])
      expect(existsSync(`public${asset.src}`)).toBe(true);
  });
  for (const [locale, copy] of [
    ["en", en.studio],
    ["ar", ar.studio],
  ] as const) {
    it(`${locale}: server-renders the crown, four real artwork controls, and honest unavailable states`, () => {
      const html = renderToStaticMarkup(<StudioScene copy={copy} locale={locale} />);
      expect(html).toContain('data-active-artwork="crown"');
      expect(html.match(/data-studio-option=/g)).toHaveLength(4);
      expect(html.match(/data-visible="true"/g)).toHaveLength(1);
      expect(html.match(/aria-disabled="true"/g)).toHaveLength(7);
      expect(html).toContain(copy.provisional);
      expect(html).toContain(copy.tools.image);
      expect(html).not.toMatch(
        /Preview only|للمعاينة فقط|Full editor coming soon|الاستوديو الكامل قريبًا/,
      );
      for (const artwork of studioArtworks) {
        expect(html).toContain(copy.artworks[artwork.id]);
        expect(html).toContain(`print-${artwork.id}.webp`);
      }
    });
  }
});
