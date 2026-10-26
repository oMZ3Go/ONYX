import { test, expect } from "./browser-test";
import ar from "../messages/ar.json";
import en from "../messages/en.json";

for (const locale of ["en", "ar"] as const) {
  test(`${locale}: responsive artwork, card metadata and category arrows remain contained`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const copy = locale === "ar" ? ar : en;
    for (const width of [320, 375, 390, 430, 600, 768, 820, 900, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(width);
      const hero = await page.locator("#home").evaluate((el) => {
        const section = el.getBoundingClientRect(),
          image = el.querySelector(".hero-hover img")!.getBoundingClientRect(),
          copy = el.querySelector(".hero-copy")!.getBoundingClientRect();
        return {
          contained:
            image.left >= section.left &&
            image.right <= section.right &&
            image.top >= section.top &&
            image.bottom <= section.bottom + 0.1,
          gap: image.top - copy.bottom,
        };
      });
      expect(hero.contained, `${width}px hero`).toBe(true);
      if (width < 1024) expect(hero.gap).toBeGreaterThan(30);
      const categories = await page.locator(".category-card").evaluateAll(
        (cards, rtl) =>
          cards.map((card) => {
            const outer = card.getBoundingClientRect(),
              arrow = card.querySelector(".category-arrow")!.getBoundingClientRect(),
              title = card.querySelector("h3")!.getBoundingClientRect(),
              paragraph = card.querySelector("p")!.getBoundingClientRect();
            return {
              bottom: outer.bottom - arrow.bottom,
              corner: rtl ? arrow.left - outer.left : outer.right - arrow.right,
              titleFits: title.left >= outer.left && title.right <= outer.right,
              adjacent: rtl ? arrow.right <= paragraph.left : paragraph.right <= arrow.left,
              baseline: Math.abs(paragraph.bottom - arrow.bottom),
            };
          }),
        locale === "ar",
      );
      for (const card of categories) {
        expect(card.titleFits).toBe(true);
        expect(card.adjacent).toBe(true);
        expect(card.baseline).toBeLessThan(0.1);
        expect(card.bottom).toBeGreaterThanOrEqual(12);
        expect(card.corner).toBeLessThanOrEqual(16);
      }
      const products = await page.locator(".product-card").evaluateAll((cards) =>
        cards.map((card) => {
          const image = card.querySelector(".product-image img")!.getBoundingClientRect(),
            frame = card.querySelector(".product-image")!.getBoundingClientRect();
          return {
            imageFits: image.height <= frame.height + 0.1 && image.width <= frame.width + 0.1,
            font: parseFloat(
              getComputedStyle(card.querySelector(".product-metadata")!.firstElementChild!)
                .fontSize,
            ),
            cta: card.querySelector(".button")!.getBoundingClientRect().height,
          };
        }),
      );
      for (const product of products) {
        expect(product.imageFits).toBe(true);
        expect(product.font).toBeGreaterThanOrEqual(12);
        expect(product.cta).toBeGreaterThanOrEqual(44);
      }
    }
    for (const card of await page.locator(".product-card").all()) {
      await expect(card).toContainText(copy.common.colorsSoon);
      await expect(card).toContainText(copy.common.sizesSoon);
      await expect(card).toContainText(copy.common.priceSoon);
      await expect(card.locator(".product-badge")).toHaveText(copy.common.preview);
    }
    await page.setViewportSize({ width: 844, height: 320 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(844);
    await page
      .locator("#home")
      .evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "end" }));
    await expect(page.locator(".hero-hover img")).toBeVisible();
  });

  test(`${locale}: orbital dots and product ambient light share visibility and motion controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 650 });
    await page.goto(`/${locale}`);
    await expect(page.locator(".category-orbit")).toHaveCount(3);
    await expect(page.locator(".category-dots i")).toHaveCount(4);
    for (const selector of [
      ".product-card:first-child .product-ambient",
      ".category-orbit:first-child",
    ]) {
      const layer = page.locator(selector).first();
      await layer.evaluate((el) =>
        el.closest("section")!.scrollIntoView({ behavior: "instant", block: "center" }),
      );
      await expect
        .poll(() => layer.evaluate((el) => el.getAnimations()[0]?.playState))
        .toBe("running");
      const animation = await layer.evaluateHandle((el) => el.getAnimations()[0]!);
      const start = await animation.evaluate((a) => Number(a.currentTime));
      await expect
        .poll(() => animation.evaluate((a) => Number(a.currentTime)))
        .toBeGreaterThan(start + 100);
      expect(await layer.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none");
      await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
      await expect.poll(() => animation.evaluate((a) => a.playState)).toBe("paused");
      const frozen = await animation.evaluate(async (a) => {
        await a.ready;
        return a.currentTime;
      });
      await page.waitForTimeout(120);
      expect(await animation.evaluate((a) => a.currentTime)).toBe(frozen);
      await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
      await expect.poll(() => animation.evaluate((a) => a.playState)).toBe("running");
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await expect.poll(() => animation.evaluate((a) => a.playState)).toBe("paused");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator(".category-orbit,.product-ambient")
        .evaluateAll((els) => els.reduce((n, el) => n + el.getAnimations().length, 0)),
    ).toBe(0);
    await expect(page.locator(".category-orbits")).toHaveCSS("display", "none");
    await expect(page.locator(".product-ambient").first()).toHaveCSS("transform", "none");
  });
}
