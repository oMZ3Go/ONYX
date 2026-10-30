import { test, expect, type Page } from "./browser-test";
import en from "../messages/en.json";
import ar from "../messages/ar.json";
const dictionaries = { ar, en };

for (const locale of ["ar", "en"] as const)
  test(`${locale}: environmental motion, hover and manual pause work in the browser`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const hero = page.locator('[data-float="hero"]');
    const state = () => hero.evaluate((el) => el.getAnimations()[0]?.playState);
    await expect.poll(state).toBe("running");
    const initialTime = await hero.evaluate((el) => Number(el.getAnimations()[0]?.currentTime));
    await expect
      .poll(() => hero.evaluate((el) => Number(el.getAnimations()[0]?.currentTime)))
      .toBeGreaterThan(initialTime + 50);
    // Interact with the stationary composition; the floating child never becomes stable.
    await page.locator(".hero-artwork").hover();
    await expect(page.locator(".hero-hover")).toHaveCSS(
      "transform",
      "matrix(1.04, 0, 0, 1.04, 0, 0)",
    );
    await expect(page.locator(".hero-glow")).toHaveCSS("opacity", "1");
    for (const type of ["offer", "story"]) {
      const layer = page.locator(`[data-float="${type}"]`);
      await page.locator(type === "offer" ? "#offers" : "#about").scrollIntoViewIfNeeded();
      await expect
        .poll(() => layer.evaluate((el) => el.getAnimations()[0]?.playState))
        .toBe("running");
      const before = await layer.evaluate((el) => getComputedStyle(el).transform);
      await expect
        .poll(() => layer.evaluate((el) => getComputedStyle(el).transform))
        .not.toBe(before);
      await expect.poll(state).toBe("paused");
    }
    await page.locator(".motion-toggle").click();
    await expect(page.locator(".motion-toggle")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".hero-copy")).toHaveAttribute("data-paused", "true");
    expect(
      await page
        .locator("[data-float]")
        .evaluateAll((elements) =>
          elements.every((el) => el.getAnimations().every((a) => a.playState === "paused")),
        ),
    ).toBe(true);
    await page.locator(".motion-toggle").click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(state).toBe("running");
  });

test("touch devices keep environmental layers static while links remain usable", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/ar");
  await expect(page.locator(".hero-copy")).not.toHaveAttribute("data-phase", "static");
  expect(
    await page
      .locator("[data-float]")
      .evaluateAll((elements) => elements.every((el) => el.getAnimations().length === 0)),
  ).toBe(true);
  await page.locator(".hero-cta").tap();
  await expect(page).toHaveURL(/#design-studio$/);
  await context.close();
});
test("slow hydration preserves the already visible completed headline", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/chunks/*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/en", { waitUntil: "commit" });
  await expect(page.locator("h1")).toBeVisible();
  await page.waitForTimeout(1100);
  await expect(page.locator(".headline-accent")).toHaveCSS("opacity", "1");
  release();
  await expect(page.locator(".hero-copy")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator(".headline-accent")).toHaveCSS("color", "rgb(138, 169, 186)");
});
async function hydrate(page: Page) {
  await expect(page.locator(".hero-copy")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function headlineIntersection(page: Page, visible: boolean) {
  // IO is a native rendering notification, not a timer advanced by page.clock.
  // This observer is registered after the application's observer. Wait for the
  // actual intersection delivery instead of spending a guessed amount of fake time.
  await page.evaluate(
    (expected) =>
      new Promise<void>((resolve) => {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry?.isIntersecting !== expected) return;
            observer.disconnect();
            resolve();
          },
          { threshold: 0.15 },
        );
        observer.observe(document.querySelector(".hero-copy")!);
      }),
    visible,
  );
}

async function startHeadlineClock(page: Page, locale: "ar" | "en") {
  // Install before navigation so application timers never mix real and fake clocks.
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/${locale}`);
  await hydrate(page);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await headlineIntersection(page, true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  // emulateMedia acknowledges the browser setting, not the application's later
  // MediaQueryList change callback. The first render establishes time zero.
  const hero = page.locator(".hero-copy");
  await expect(hero).toHaveAttribute("data-phase", "empty");
  await expect(hero).toHaveAttribute("data-enhanced", "true");
  return hero;
}

async function setDocumentHidden(page: Page, hidden: boolean) {
  // Exercise the visibility handler in Chromium; this is not an OS tab switch.
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
    // Duplicate notifications must neither create a second loop nor reset elapsed time.
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

async function headlineFrame(page: Page) {
  return page.locator(".hero-copy").evaluate((root) => ({
    phase: root.getAttribute("data-phase"),
    elements: [
      ...root.querySelectorAll(
        "h1, .headline-line, .designer-cursor, .designer-cursor > span, .cursor-trail, .color-menu, .hero-cta",
      ),
    ].map((element) => ({
      style: element.getAttribute("style"),
      selected: element.getAttribute("data-selected"),
      pulse: element.getAttribute("data-pulse"),
    })),
  }));
}
test("root defaults to Arabic and remembers a supported preference", async ({ page, context }) => {
  await page.goto("/?ref=preview");
  await expect(page).toHaveURL(/\/ar\?ref=preview/);
  await context.addCookies([{ name: "ONYX_LOCALE", value: "en", domain: "127.0.0.1", path: "/" }]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await context.addCookies([
    { name: "ONYX_LOCALE", value: "invalid", domain: "127.0.0.1", path: "/" },
  ]);
  await page.goto("/");
  await expect(page).toHaveURL(/\/ar$/);
});
for (const locale of ["ar", "en"] as const) {
  const m = dictionaries[locale];
  test(`${locale}: localized server HTML, metadata, keyboard anchors and CTAs`, async ({
    page,
    request,
  }) => {
    const response = await request.get(`/${locale}`);
    const html = await response.text();
    expect(html).toContain(`lang="${locale}"`);
    expect(html).toContain(`dir="${locale === "ar" ? "rtl" : "ltr"}"`);
    expect(html).toContain(m.hero.line1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await hydrate(page);
    await expect(page).toHaveTitle(m.meta.title);
    await expect(page.locator("h1")).toHaveAccessibleName(`${m.hero.line1} ${m.hero.line2}`);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await page.locator(".hero-cta").click();
    await expect(page).toHaveURL(/#design-studio$/);
    await expect(page.locator("#studio-title")).toBeInViewport();
    await expect(page.locator("#design-studio")).toContainText(m.studio.description);
    await page.locator("#design-studio summary").click();
    await expect(page.locator(".studio-editor-notice")).toBeVisible();
    await expect(page).toHaveURL(/#design-studio$/);
    await expect(page.locator(".product-card")).toHaveCount(4);
    await expect(page.locator(".category-card")).toHaveCount(5);
  });
  test(`${locale}: responsive images, no overflow, no mirroring or browser errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto(`/${locale}`);
      await hydrate(page);
      for (const image of await page.locator("img").all()) await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...document.images].every((image) => image.complete && image.naturalWidth > 0),
          ),
        )
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every((image) => getComputedStyle(image).transform === "none"),
          ),
      ).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `.cache/phase-01.1/final-${locale}-${width}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
  test(`${locale}: accessible mobile menu, Escape and navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`);
    await hydrate(page);
    const summary = page.locator(".mobile-navigation summary");
    await summary.click();
    await expect(page.locator("#mobile-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-menu")).not.toBeVisible();
    await expect(summary).toBeFocused();
    await summary.click();
    await page.locator('#mobile-menu a[href="#categories"]').click();
    await expect(page.locator(".mobile-navigation")).not.toHaveAttribute("open", "");
    await expect(page).toHaveURL(/#categories$/);
  });
  test(`${locale}: reduced motion and no-JavaScript fallback`, async ({ browser, page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await hydrate(page);
    await expect(page.locator(".hero-copy")).toHaveAttribute("data-phase", "static");
    await expect(page.locator(".headline-accent")).toHaveCSS("color", "rgb(138, 169, 186)");
    expect(
      await page
        .locator("[data-float]")
        .evaluateAll((elements) => elements.every((el) => el.getAnimations().length === 0)),
    ).toBe(true);
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const nojs = await context.newPage();
    await nojs.goto(`http://127.0.0.1:3000/${locale}`);
    await expect(nojs.locator("h1")).toHaveAccessibleName(`${m.hero.line1} ${m.hero.line2}`);
    await expect(nojs.locator(".headline-accent")).toHaveCSS("opacity", "1");
    await nojs.locator(".mobile-navigation summary").click();
    await expect(nojs.locator("#mobile-menu")).toBeVisible();
    await nojs.locator(".mobile-navigation summary").click();
    await nojs.locator(".hero-cta").click();
    await expect(nojs).toHaveURL(/#design-studio$/);
    await context.close();
  });
  test(`${locale}: deterministic complete headline sequence and 15-second hold`, async ({
    page,
  }) => {
    const hero = await startHeadlineClock(page, locale);
    await page.clock.runFor(16);
    await expect(hero).toHaveAttribute("data-phase", "empty");
    await expect(page.locator(".headline-line").first()).toHaveCSS("opacity", "0");
    await page.clock.runFor(1500);
    await expect(hero).toHaveAttribute("data-phase", "drag-first");
    await expect(page.locator(".headline-line").first()).toHaveAttribute("data-selected", "true");
    expect(
      await page
        .locator(".headline-line")
        .first()
        .locator(".headline-echo")
        .first()
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    ).toBeGreaterThan(0.02);
    await expect(page.locator(".headline-line").first()).toHaveCSS("filter", "none");
    await page.clock.runFor(2500);
    await expect(hero).toHaveAttribute("data-phase", "drag-second");
    await page.clock.runFor(1800);
    await expect(hero).toHaveAttribute("data-phase", "palette");
    await expect(page.locator(".headline-accent")).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(page.locator(".color-menu > div")).toHaveCount(3);
    await page.screenshot({ path: `.cache/phase-01.1/palette-${locale}.png` });
    await page.clock.runFor(1100);
    await expect(page.locator(".headline-accent")).toHaveCSS("color", "rgb(138, 169, 186)");
    await expect(page.locator(".headline-line").first()).toHaveCSS("color", "rgb(255, 255, 255)");
    await page.clock.runFor(1100);
    await expect(hero).toHaveAttribute("data-phase", "pulse");
    await expect(page.locator(".hero-cta")).toHaveAttribute("data-pulse", "true");
    await page.clock.runFor(600);
    await expect(hero).toHaveAttribute("data-phase", "idle");
    await expect(page.locator(".designer-cursor")).toHaveCSS("opacity", "0");
    for (const echo of await page.locator(".headline-echo").all())
      await expect(echo).toHaveCSS("opacity", "0");
    await expect(page.locator("h1")).toHaveCount(1);
    await page.clock.runFor(14800);
    await expect(hero).toHaveAttribute("data-phase", "idle");
    await page.clock.runFor(300);
    await expect(hero).toHaveAttribute("data-phase", "return");
    await page.clock.runFor(800);
    await expect(hero).toHaveAttribute("data-phase", "select-all");
    await page.clock.runFor(500);
    await expect(hero).toHaveAttribute("data-phase", "delete");
    await expect(page.locator(".headline-line").first()).toHaveCSS("opacity", "0");
    await page.clock.runFor(500);
    await expect(hero).toHaveAttribute("data-phase", "empty");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
for (const locale of ["ar", "en"] as const)
  test(`${locale}: click flash, palette folding and manual freeze share the headline clock`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const hero = await startHeadlineClock(page, locale);
    await page.clock.runFor(4912);
    await expect(hero).toHaveAttribute("data-phase", "context");
    await expect(page.locator(".designer-cursor")).toHaveAttribute("data-click", "true");
    expect(
      await page
        .locator(".designer-cursor > span")
        .evaluate((el) => Number(getComputedStyle(el).opacity)),
    ).toBeGreaterThan(0);
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    const frozen = await headlineFrame(page);
    await page.clock.runFor(30000);
    expect(await headlineFrame(page)).toEqual(frozen);
    await page.evaluate(() =>
      (document.querySelector(".motion-toggle") as HTMLButtonElement).click(),
    );
    await page.clock.runFor(600);
    const menu = page.locator(".color-menu");
    await expect(menu).toHaveAttribute("data-state", "opening");
    const opening = await menu.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opening).toBeGreaterThan(0);
    expect(opening).toBeLessThan(1);
    await page.clock.runFor(1100);
    await expect(menu).toHaveAttribute("data-state", "closing");
    await expect(menu.locator('[data-color="blue"]')).toHaveAttribute("data-chosen", "true");
    const closing = await menu.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(closing).toBeGreaterThan(0);
    expect(closing).toBeLessThan(1);
    await page.clock.runFor(200);
    await expect(menu).toHaveCSS("opacity", "0");
    await expect(page.locator(".headline-line").first()).toHaveCSS("color", "rgb(255, 255, 255)");
  });

test("language switch preserves query, anchor, remembered locale and updates all sections", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ar?source=review#home");
  await hydrate(page);
  await page.evaluate(() => {
    (window as Window & { marker?: string }).marker = "client-navigation";
  });
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en\?source=review#home/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("#story-title")).toHaveText("More Than Hoodies.");
  expect(await page.evaluate(() => (window as Window & { marker?: string }).marker)).toBe(
    "client-navigation",
  );
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
});
test("headline suspends offscreen, responds to reduced motion, and cleans up on locale changes", async ({
  page,
}) => {
  const hero = await startHeadlineClock(page, "en");
  await page.clock.runFor(1600);
  await expect(hero).toHaveAttribute("data-phase", "drag-first");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await headlineIntersection(page, false);
  const paused = await headlineFrame(page);
  await page.clock.runFor(60000);
  expect(await headlineFrame(page)).toEqual(paused);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await headlineIntersection(page, true);
  await expect(hero).toHaveAttribute("data-phase", "drag-first");
  await page.clock.runFor(2000);
  await expect(hero).toHaveAttribute("data-phase", "drag-second");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(hero).toHaveAttribute("data-phase", "static");
  await page.getByRole("link", { name: "العربية", exact: true }).click();
  await expect(page.locator("h1")).toHaveAccessibleName("صمّم هوديك بطريقتك");
  await page.clock.runFor(60000);
  await expect(page.locator(".designer-cursor")).toHaveCount(1);
  await expect(page.locator(".hero-copy")).toHaveAttribute("data-phase", "static");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".hero-copy")).toHaveAttribute("data-phase", "empty");
  await page.clock.runFor(1500);
  await expect(page.locator(".hero-copy")).toHaveAttribute("data-phase", "drag-first");
  await expect(page.locator(".designer-cursor")).toHaveCount(1);
});

for (const locale of ["ar", "en"] as const)
  test(`${locale}: mobile animation geometry and visibility lifecycle`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    const hero = await startHeadlineClock(page, locale);
    await page.clock.runFor(16);
    for (const [duration, phase] of [
      [1500, "drag-first"],
      [2500, "drag-second"],
      [1800, "palette"],
    ] as const) {
      await page.clock.runFor(duration);
      await expect(hero).toHaveAttribute("data-phase", phase);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await expect(page.locator(".color-menu")).toHaveCSS("opacity", "1");
    await expect(page.locator(".headline-accent")).toHaveCSS("color", "rgb(255, 255, 255)");
    const menu = await page.locator(".color-menu").boundingBox();
    expect(menu!.x).toBeGreaterThanOrEqual(0);
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(320);
    // Owner-approved contextual overlap with copy must never reach the real CTA.
    const actions = await page.locator(".hero-actions").boundingBox();
    expect(menu!.y + menu!.height).toBeLessThan(actions!.y);
    await page.screenshot({ path: `.cache/phase-01.1/palette-${locale}-320.png` });
    const pausedPalette = await headlineFrame(page);
    await setDocumentHidden(page, true);
    await page.clock.runFor(60000);
    await expect(hero).toHaveAttribute("data-phase", "palette");
    expect(await headlineFrame(page)).toEqual(pausedPalette);
    // Becoming visible must not resume a headline that is still offscreen.
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
    );
    await headlineIntersection(page, false);
    await setDocumentHidden(page, false);
    await page.clock.runFor(60000);
    expect(await headlineFrame(page)).toEqual(pausedPalette);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await headlineIntersection(page, true);
    await expect(hero).toHaveAttribute("data-phase", "palette");
    await setDocumentHidden(page, false);
    await page.clock.runFor(1100);
    await expect(hero).toHaveAttribute("data-phase", "to-button");
    await expect(page.locator(".headline-accent")).toHaveCSS("color", "rgb(138, 169, 186)");
    await expect(page.locator(".headline-line").first()).toHaveCSS("color", "rgb(255, 255, 255)");
    await page.clock.runFor(1100);
    await expect(hero).toHaveAttribute("data-phase", "pulse");
    const cursor = await page.locator(".designer-cursor").boundingBox(),
      button = await page.locator(".hero-cta").boundingBox();
    expect(cursor!.x).toBeGreaterThan(button!.x);
    expect(cursor!.x).toBeLessThan(button!.x + button!.width);
    expect(cursor!.y).toBeGreaterThan(button!.y);
    expect(cursor!.y).toBeLessThan(button!.y + button!.height);
    await page.clock.runFor(600);
    await expect(hero).toHaveAttribute("data-phase", "idle");
    const pausedIdle = await headlineFrame(page);
    await setDocumentHidden(page, true);
    await page.clock.runFor(60000);
    expect(await headlineFrame(page)).toEqual(pausedIdle);
    await setDocumentHidden(page, false);
    await page.clock.runFor(14800);
    await expect(hero).toHaveAttribute("data-phase", "idle");
    await page.clock.runFor(300);
    await expect(hero).toHaveAttribute("data-phase", "return");
    await page.clock.runFor(800);
    await expect(hero).toHaveAttribute("data-phase", "select-all");
    await page.clock.runFor(500);
    await expect(hero).toHaveAttribute("data-phase", "delete");
    await page.clock.runFor(500);
    await expect(hero).toHaveAttribute("data-phase", "empty");
    await page.locator(".hero-cta").click();
    await expect(page).toHaveURL(/#design-studio$/);
  });
