import { test, expect } from "./browser-test";

test("navigation observer tolerates a transient zero-height viewport", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator(".nav-indicator")).toHaveCSS("opacity", "1");
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "innerHeight")!;
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 0 });
    window.dispatchEvent(new Event("resize"));
    Object.defineProperty(window, "innerHeight", descriptor);
    window.dispatchEvent(new Event("resize"));
  });
  await expect(page.locator('.desktop-navigation a[href="#home"]')).toHaveAttribute(
    "aria-current",
    "location",
  );
});

for (const locale of ["en", "ar"] as const) {
  test(`${locale}: prepared entrances finish, stay readable, and release all animation styles`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const target = page.locator(".category-card").first();
    await expect(target).toHaveAttribute("data-reveal-state", "prepared");
    await expect(page.locator(".hero-values li").first()).toHaveCSS("opacity", "1");
    await target.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(target).toHaveAttribute("data-reveal-state", "running");
    await expect(target).toHaveAttribute("data-reveal-state", "complete");
    expect(await target.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await target.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(target).toHaveAttribute("data-reveal-state", "complete");
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    for (const element of await page.locator("[data-reveal]").all())
      await expect(element).toHaveCSS("opacity", "1");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      await page
        .locator("[data-reveal]")
        .evaluateAll((els) => els.every((el) => el.getAnimations().length === 0)),
    ).toBe(true);
  });

  test(`${locale}: delayed hydration never conceals the visible story`, async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/_next/static/chunks/*.js", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(`/${locale}#about`, { waitUntil: "commit" });
    await expect(page.locator("#story-title")).toBeInViewport();
    const story = page.locator('.story-copy > [data-reveal="side"]');
    await expect(story).toHaveCSS("opacity", "1");
    release();
    await expect(story).toHaveAttribute("data-reveal-state", "complete");
    await expect(story).toHaveCSS("opacity", "1");
    expect(await story.evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test(`${locale}: real pointer and card highlights stop on exit, pause and reduced motion`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const logo = page.locator("header .brand-logo");
    await logo.hover();
    await expect
      .poll(() => logo.locator("img").evaluate((el) => Number(getComputedStyle(el).opacity)))
      .toBeLessThan(0.5);
    await page.mouse.move(500, 50);
    const returning = await logo
      .locator("img")
      .evaluate(
        (el) =>
          new Promise<number>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => resolve(Number(getComputedStyle(el).opacity))),
            ),
          ),
      );
    expect(returning).toBeGreaterThan(0.18);
    expect(returning).toBeLessThan(1);
    await expect(logo.locator("img")).toHaveCSS("opacity", "1");
    await expect(page.locator(".pointer-trail, .cursor-trail")).toHaveCount(0);
    const marks = page.locator("#categories .category-dots i");
    await expect(marks).toHaveCount(4);
    await page
      .locator("#categories")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    const categoryBox = (await page.locator("#categories").boundingBox())!;
    await page.mouse.move(categoryBox.x + 50, categoryBox.y + 100);
    await page.mouse.move(categoryBox.x + 500, categoryBox.y + 140, { steps: 12 });
    await expect
      .poll(() => marks.first().evaluate((el) => Number(getComputedStyle(el).opacity)))
      .toBeGreaterThan(0);
    await expect(marks.first()).toHaveCSS("opacity", "0");
    const card = page.locator(".product-card").first();
    await card.scrollIntoViewIfNeeded();
    const edge = card.locator('[data-ambient="product-edge"]');
    await card.hover();
    await expect
      .poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    await page.mouse.move(4, 120);
    await expect.poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState)).toBe("paused");
    await card.locator("a").focus();
    await expect
      .poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    await expect.poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState)).toBe("paused");
    await page.mouse.move(600, 350, { steps: 8 });
    await expect(marks.first()).toHaveCSS("opacity", "0");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await edge.evaluate((el) => el.getAnimations().length)).toBe(0);
    const other = locale === "en" ? "ar" : "en";
    await page.locator(`.language-switcher a[lang=${other}]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", other);
    await expect(page.locator(".category-dots")).toHaveCount(1);
    await expect(page.locator(".pointer-trail, .cursor-trail")).toHaveCount(0);
  });

  test(`${locale}: brush strokes settle during preference changes and interrupted closing`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`);
    const summary = page.locator(".mobile-navigation summary");
    await summary.click();
    const strokes = page.locator(".menu-paint i");
    await expect(strokes).toHaveCount(5);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("#mobile-menu")).toBeVisible();
    expect(
      await strokes.evaluateAll((els) => els.every((el) => el.getAnimations().length === 0)),
    ).toBe(true);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.keyboard.press("Escape");
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    await expect(page.locator("#mobile-menu")).not.toBeVisible();
    await expect(summary).toBeFocused();
    await summary.click();
    await expect(summary).toHaveAttribute("aria-expanded", "true");
    await page.locator('#mobile-menu a[href="#collection"]').click();
    await expect(page.locator(".mobile-navigation")).not.toHaveAttribute("open", "");
  });
}
