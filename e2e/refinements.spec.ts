import { test, expect } from "./browser-test";
import en from "../messages/en.json";
import ar from "../messages/ar.json";
for (const locale of ["ar", "en"] as const) {
  const m = locale === "ar" ? ar : en;
  test(`${locale}: sticky navigation follows sections and measures the active underline`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    for (const id of ["collection", "categories", "offers", "about", "home"]) {
      await page.evaluate((id) => {
        const top = document.getElementById(id)!.getBoundingClientRect().top + scrollY - 110;
        window.scrollTo({ top, behavior: "instant" });
      }, id);
      const link = page.locator(`.desktop-navigation a[href="#${id}"]`);
      await expect(link).toHaveAttribute("aria-current", "location");
      const header = await page.locator(".site-header").boundingBox();
      expect(header!.y).toBe(0);
      // ARIA changes synchronously; even a reduced-motion transition commits on a paint.
      await expect
        .poll(async () => {
          const indicator = await page.locator(".nav-indicator").boundingBox();
          const box = await link.boundingBox();
          return Math.max(Math.abs(indicator!.x - box!.x), Math.abs(indicator!.width - box!.width));
        })
        .toBeLessThan(2);
    }
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect(page.locator('.desktop-navigation a[href="#contact"]')).toHaveAttribute(
      "aria-current",
      "location",
    );
    await expect(page.locator(".site-header")).toHaveAttribute("data-scrolled", "true");
  });
  test(`${locale}: brush menu reverses, closes outside and on desktop, and remains keyboard usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`);
    const summary = page.locator(".mobile-navigation summary"),
      menu = page.locator("#mobile-menu");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(summary).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(menu.locator("a").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(summary).toBeFocused();
    await summary.click();
    await page.mouse.click(8, 800);
    await expect(menu).not.toBeVisible();
    await summary.click();
    await summary.click();
    await summary.click();
    await expect(menu).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator(".mobile-navigation")).not.toHaveAttribute("open", "");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(menu).not.toBeVisible();
  });
  test(`${locale}: all category destinations are honest and retain locale context`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const key of ["cars", "anime", "typography", "minimal", "abstract"] as const) {
      await page.goto(`/${locale}/categories/${key}`);
      await expect(page.locator("h1")).toHaveText(m.categories[key].title);
      await expect(page.locator("main")).toContainText(m.categories.notice);
      await expect(page.locator("main .button")).toHaveAttribute("href", `/${locale}#categories`);
      await expect(page.locator(".product-card")).toHaveCount(0);
    }
    await page.goto(`/${locale}/categories/cars?source=review`);
    const other = locale === "ar" ? "en" : "ar";
    await page.locator(`.language-switcher a[lang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/categories/cars\\?source=review`));
    await expect(page.locator("html")).toHaveAttribute("dir", other === "ar" ? "rtl" : "ltr");
    const response = await page.goto(`/${locale}/categories/unknown`);
    expect(response?.status()).toBe(404);
  });
  test(`${locale}: process assembles once, sleeps, and replays without hiding readable steps`, async ({
    page,
  }) => {
    await page.clock.install();
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.evaluate(() =>
      document
        .querySelector("[data-process]")!
        .scrollIntoView({ behavior: "instant", block: "center" }),
    );
    const process = page.locator("[data-process]");
    await expect(process).toHaveAttribute("data-process-state", "entrance");
    // Entrance is rendered while offscreen too; wait for visibility to resume the active clock.
    await expect(process).toHaveAttribute("data-process-paused", "false");
    await page.clock.runFor(1500);
    await expect(process).toHaveAttribute("data-process-step", "2");
    await page.clock.runFor(2800);
    await expect(process).toHaveAttribute("data-process-state", "rest");
    await page.clock.runFor(11000);
    await expect(process).toHaveAttribute("data-process-state", "rest");
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    await expect(process).toHaveAttribute("data-process-paused", "true");
    const frozen = await process.getAttribute("data-process-state");
    await page.clock.runFor(60000);
    await expect(process).toHaveAttribute("data-process-state", frozen!);
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    await expect(process).toHaveAttribute("data-process-paused", "false");
    await page.clock.runFor(1100);
    await expect(process).toHaveAttribute("data-process-state", "replay");
    for (const el of await process.locator(".step-title,p").all())
      await expect(el).toHaveCSS("opacity", "1");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await expect(process).toHaveAttribute("data-process-paused", "true");
    const offscreen = await process
      .locator("li")
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    await page.clock.runFor(60000);
    expect(await process.locator("li").evaluateAll((els) => els.map((el) => el.innerHTML))).toEqual(
      offscreen,
    );
    await page.evaluate(() =>
      document
        .querySelector("[data-process]")!
        .scrollIntoView({ behavior: "instant", block: "center" }),
    );
    await expect(process).toHaveAttribute("data-process-paused", "false");
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(process).toHaveAttribute("data-process-paused", "true");
    const styles = await process.locator("li").evaluateAll((els) => els.map((el) => el.innerHTML));
    await page.clock.runFor(60000);
    expect(await process.locator("li").evaluateAll((els) => els.map((el) => el.innerHTML))).toEqual(
      styles,
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(process).toHaveAttribute("data-process-state", "static");
    for (const el of await process.locator(".step-title,p").all())
      await expect(el).toHaveCSS("opacity", "1");
  });
  test(`${locale}: contact integrity, image dragging and ambient lifecycle`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('.footer-contact a[href^="mailto:"]')).toHaveAttribute(
      "href",
      "mailto:beyond.thelimit.team@gmail.com",
    );
    await expect(page.locator(".footer-contact")).toContainText(m.footer.location);
    await expect(page.locator(".social-links [aria-disabled=true]")).toHaveCount(4);
    await expect(page.locator(".social-links a")).toHaveCount(0);
    expect(
      await page
        .locator("img")
        .evaluateAll((els) => els.every((el) => !(el as HTMLImageElement).draggable)),
    ).toBe(true);
    await page.locator("#offers").scrollIntoViewIfNeeded();
    const edge = page.locator('[data-ambient="edge"]');
    await expect
      .poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    expect(await edge.evaluate((el) => el.getAnimations()[0]?.effect?.getTiming())).toMatchObject({
      duration: 5700,
      delay: 870,
    });
    await page.locator(".offer-artwork").hover();
    await expect(page.locator(".offer-glow")).toHaveCSS("opacity", "1");
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    await expect.poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState)).toBe("paused");
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState)).toBe("paused");
    await page.locator("footer").scrollIntoViewIfNeeded();
    const footer = page.locator('[data-ambient="footer"]');
    await expect
      .poll(() => footer.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    expect(await footer.evaluate((el) => el.getAnimations()[0]?.effect?.getTiming())).toMatchObject(
      {
        duration: 10000,
        direction: "alternate",
      },
    );
  });
}
