import { test, expect } from "./browser-test";

for (const locale of ["en", "ar"]) {
  test(`${locale}: hoodie magnet stays bounded, composes with floating and resets with eligibility`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const region = page.locator(".hero-artwork");
    const magnet = page.locator(".hero-magnet");
    const float = page.locator('[data-float="hero"]');
    await expect
      .poll(() => float.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    const offset = () =>
      magnet.evaluate((el) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return Math.hypot(matrix.m41, matrix.m42);
      });
    const box = (await region.boundingBox())!;
    const copy = (await page.locator(".hero-copy").boundingBox())!;
    await page.mouse.move(copy.x + copy.width * 0.3, copy.y + copy.height * 0.5, { steps: 16 });
    await expect.poll(offset).toBeGreaterThan(1);
    expect(await region.evaluate((el) => el.matches(":hover"))).toBe(false);
    await expect(page.locator(".hero-hover")).toHaveCSS("transform", "none");
    for (const [x, y] of [
      [0.15, 0.2],
      [0.9, 0.75],
      [0.45, 0.4],
    ]) {
      await page.mouse.move(box.x + box.width * x!, box.y + box.height * y!, { steps: 12 });
      await expect.poll(offset).toBeGreaterThan(0.5);
      expect(await offset()).toBeLessThanOrEqual(10.01);
      const axes = await magnet.evaluate((el) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return [Math.abs(m.m41), Math.abs(m.m42)];
      });
      expect(axes[0]).toBeLessThanOrEqual(10);
      expect(axes[1]).toBeLessThanOrEqual(8);
    }
    const before = await float.evaluate((el) => Number(el.getAnimations()[0]!.currentTime));
    await expect
      .poll(() => float.evaluate((el) => Number(el.getAnimations()[0]!.currentTime)))
      .toBeGreaterThan(before + 100);
    await expect(page.locator(".hero-hover")).toHaveCSS(
      "transform",
      "matrix(1.04, 0, 0, 1.04, 0, 0)",
    );
    await expect(page.locator(".hero-glow")).toHaveCSS("opacity", "1");
    expect(
      await page.locator(".hero-glow").evaluate((el) => ({
        pointer: getComputedStyle(el).pointerEvents,
        z: getComputedStyle(el).zIndex,
        parent: el.parentElement?.className,
      })),
    ).toEqual({ pointer: "none", z: "0", parent: "hero-magnet" });
    const departing = await offset();
    await page.mouse.move(5, 30);
    const returning = await magnet.evaluate(
      (el) =>
        new Promise<number>((resolve) => {
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
              resolve(Math.hypot(m.m41, m.m42));
            }),
          );
        }),
    );
    expect(returning).toBeGreaterThan(0);
    expect(returning).toBeLessThan(departing);
    await expect.poll(offset).toBeLessThan(0.02);
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.3);
    await expect.poll(offset).toBeGreaterThan(1);
    await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
    await expect(magnet).toHaveCSS("transform", "none");
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.4);
    await expect(magnet).toHaveCSS("transform", "none");
    await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.4);
    await expect(magnet).toHaveCSS("transform", "none");
    expect(await float.evaluate((el) => el.getAnimations().length)).toBe(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("#categories").scrollIntoViewIfNeeded();
    await expect(magnet).toHaveCSS("transform", "none");
  });

  test(`${locale}: four category dots stay local and clean up after stop, exit, pause and locale navigation`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const section = page.locator("#categories");
    const dots = page.locator(".category-dots i");
    await expect(dots).toHaveCount(4);
    await expect(page.locator(".pointer-trail, .cursor-trail")).toHaveCount(0);
    await page.mouse.move(300, 300, { steps: 10 });
    await expect(dots.first()).toHaveCSS("opacity", "0");
    await section.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    const box = (await section.boundingBox())!;
    const move = async () => {
      await page.mouse.move(box.x + 80, box.y + 90);
      await page.mouse.move(box.x + 520, box.y + 150, { steps: 16 });
    };
    for (let i = 0; i < 3; i++) {
      await move();
      await expect
        .poll(() => dots.first().evaluate((el) => Number(getComputedStyle(el).opacity)))
        .toBeGreaterThan(0);
      expect(
        await dots.evaluateAll(
          (els) => new Set(els.map((el) => getComputedStyle(el).transform)).size,
        ),
      ).toBeGreaterThan(1);
      await page.mouse.move(2, 110);
      await expect(dots.first()).toHaveCSS("opacity", "0");
    }
    await move();
    await expect(dots.first()).toHaveCSS("opacity", "0");
    const settled = await dots.evaluateAll((els) => els.map((el) => el.getAttribute("style")));
    await page.waitForTimeout(100);
    expect(await dots.evaluateAll((els) => els.map((el) => el.getAttribute("style")))).toEqual(
      settled,
    );
    await expect(page.locator(".category-dots")).toHaveCSS("pointer-events", "none");
    await expect(section).toHaveCSS("cursor", "auto");
    await expect(section.locator("a").first()).toHaveCSS("cursor", "pointer");
    await expect(page.locator(".category-dots")).toHaveAttribute("aria-hidden", "true");
    await move();
    await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
    await expect(dots.first()).toHaveCSS("opacity", "0");
    await move();
    await expect(dots.first()).toHaveCSS("opacity", "0");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".category-dots")).toBeHidden();
    const other = locale === "en" ? "ar" : "en";
    await page.locator(`.language-switcher a[lang="${other}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", other);
    await expect(page.locator("#categories > .category-dots")).toHaveCount(1);
    await expect(dots).toHaveCount(4);
  });

  test(`${locale}: original brush textures load without layout or interaction obstruction`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await expect(page.locator(".brush-art")).toHaveCount(4);
    for (const section of ["#collection", "#categories", "#how-it-works", "footer"]) {
      const art = page.locator(`${section} .brush-art`);
      await art.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          art
            .locator("img")
            .evaluate(
              (el) =>
                (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0,
            ),
        )
        .toBe(true);
      await expect(art).toHaveCSS("position", "absolute");
      await expect(art).toHaveCSS("pointer-events", "none");
      expect(await art.evaluate((el) => el.parentElement!.getAnimations().length)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  });
}

test("touch never activates the magnet or category dots and still scrolls the short mobile menu", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: String(test.info().project.use.baseURL),
    viewport: { width: 720, height: 250 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    await page.goto("/en");
    await page
      .locator(".hero-artwork")
      .dispatchEvent("pointermove", { pointerType: "touch", clientX: 600, clientY: 180 });
    await expect(page.locator(".hero-magnet")).toHaveCSS("transform", "none");
    await page
      .locator("#categories")
      .dispatchEvent("pointermove", { pointerType: "touch", clientX: 300, clientY: 100 });
    await expect(page.locator(".category-dots i").first()).toHaveCSS("opacity", "0");
    await page.locator(".mobile-navigation summary").tap();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toHaveCSS("scrollbar-width", "none");
    await expect
      .poll(() => menu.evaluate((el) => el.getAnimations({ subtree: true }).length))
      .toBe(0);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 350, y: 220 }],
    });
    for (const y of [210, 195, 180, 165, 150, 135, 120, 105, 90]) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 350, y }],
      });
      await page.waitForTimeout(25);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => menu.evaluate((el) => el.scrollTop)).toBeGreaterThan(20);
    // Wait for the native inertial scroll to stop before tapping a destination.
    await menu.evaluate(
      (el) =>
        new Promise<void>((resolve) => {
          let previous = el.scrollTop,
            stable = 0;
          const frame = () => {
            const current = el.scrollTop;
            stable = Math.abs(current - previous) < 0.1 ? stable + 1 : 0;
            previous = current;
            if (stable >= 8) resolve();
            else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }),
    );
    await menu.locator("a").last().scrollIntoViewIfNeeded();
    await menu.locator("a").last().tap();
    await expect(menu).not.toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
