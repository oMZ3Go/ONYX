import { expect, type Page } from "./browser-test";

/** Responsive sizes may replace a source while its first decode is pending. */
export async function studioImagesReady(page: Page, selector = ".ds-garment img") {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(async () => {
    await page.evaluate(async (query) => {
      const images = [...document.querySelectorAll<HTMLImageElement>(query)].filter(
        (img) =>
          img.getClientRects().length &&
          (img.loading !== "lazy" || img.getBoundingClientRect().top < innerHeight),
      );
      if (!images.length) throw new Error("Studio images are missing");
      await Promise.all(
        images.map(async (img) => {
          await img.decode();
          if (!img.complete || !img.naturalWidth)
            throw new Error(`Image not ready: ${img.currentSrc}`);
        }),
      );
    }, selector);
  }).toPass({ timeout: 10_000 });
}
