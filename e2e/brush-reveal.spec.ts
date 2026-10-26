import { test, expect } from "./browser-test";

for (const locale of ["en", "ar"]) {
  test(`${locale}: curved brush drawing runs once, completes on pause, and never inherits continuous motion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 650 });
    await page.goto(`/${locale}`);
    const art = page.locator("#categories .brush-art");
    await expect(art).toHaveAttribute("data-reveal-state", "prepared");
    expect(
      await art.evaluate((el) =>
        el.getAnimations({ subtree: true }).every((a) => a.playState === "paused"),
      ),
    ).toBe(true);
    await page
      .locator("#categories")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(art).toHaveAttribute("data-reveal-state", "running");
    const first = art.locator(".brush-reveal-path").first();
    const offset = await first.evaluate((el) => getComputedStyle(el).strokeDashoffset);
    await expect
      .poll(() => first.evaluate((el) => getComputedStyle(el).strokeDashoffset))
      .not.toBe(offset);
    await expect(art.locator("img")).not.toHaveCSS("mask-image", "none");
    await expect(art).toHaveCSS("opacity", "0.2");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await expect
      .poll(() =>
        art.evaluate(
          (el) =>
            el.getAnimations({ subtree: true }).filter((a) => a.playState === "paused").length,
        ),
      )
      .toBe(7);
    // WAAPI reports "paused" before its pending pause is committed on the next frame.
    const frozen = await first.evaluate(async (el) => {
      const animation = el.getAnimations()[0]!;
      await animation.ready;
      return animation.currentTime;
    });
    await page.waitForTimeout(100);
    expect(await first.evaluate((el) => el.getAnimations()[0]!.currentTime)).toBe(frozen);
    await page
      .locator("#categories")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(art).toHaveAttribute("data-reveal-state", "complete");
    await expect(art.locator("img")).toHaveCSS("mask-image", "none");
    const settled = await art.boundingBox();
    await page.waitForTimeout(400);
    expect(await art.boundingBox()).toEqual(settled);
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page
      .locator("#categories")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(art).toHaveAttribute("data-reveal-state", "complete");
    expect(await art.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);

    const footer = page.locator("footer .brush-art");
    await expect(footer).toHaveAttribute("data-reveal-state", "prepared");
    await page
      .locator("footer")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(footer).toHaveAttribute("data-reveal-state", "running");
    await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
    for (const brush of await page.locator(".brush-art").all()) {
      await expect(brush).toHaveAttribute("data-reveal-state", "complete");
      await expect(brush.locator("img")).toHaveCSS("mask-image", "none");
      expect(
        await brush.evaluate((el) => {
          let count = el.getAnimations({ subtree: true }).length;
          for (let parent = el.parentElement; parent; parent = parent.parentElement)
            count += parent.getAnimations().length;
          return count;
        }),
      ).toBe(0);
    }
    await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
    expect(await footer.evaluate((el) => el.parentElement!.getAnimations().length)).toBe(0);
    await expect
      .poll(() =>
        page
          .locator('footer [data-ambient="footer"]')
          .evaluate((el) => el.getAnimations()[0]?.playState),
      )
      .toBe("running");
    const other = locale === "en" ? "ar" : "en";
    await page.locator(`.language-switcher a[lang="${other}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", other);
    await expect(page.locator(".brush-art")).toHaveCount(4);
    expect(
      await page
        .locator(".brush-art mask")
        .evaluateAll((els) => new Set(els.map((el) => el.id)).size),
    ).toBe(4);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const brush of await page.locator(".brush-art").all()) {
      await expect(brush).toHaveAttribute("data-reveal-state", "complete");
      await expect(brush.locator("img")).toHaveCSS("mask-image", "none");
    }
  });

  test(`${locale}: delayed hydration keeps already visible brush artwork complete`, async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/_next/static/chunks/*.js", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(`/${locale}#categories`, { waitUntil: "commit" });
    const brush = page.locator("#categories .brush-art");
    await expect(brush).toBeInViewport();
    await expect(brush.locator("img")).toHaveCSS("mask-image", "none");
    release();
    await expect(brush).toHaveAttribute("data-reveal-state", "complete");
    await expect(brush.locator("img")).toHaveCSS("mask-image", "none");
    expect(await brush.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  });

  test(`${locale}: offer illumination strengthens on hover without restarting its shared rotation`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await page
      .locator("#offers")
      .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.mouse.move(4, 30);
    const edge = page.locator(".offer-edge"),
      halo = edge.locator(".gradient-halo");
    await expect(halo).toHaveCSS("opacity", "0.86");
    await expect(edge.locator(".gradient-spill")).toHaveCSS("opacity", "0.14");
    await expect
      .poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    const animation = await edge.evaluateHandle((el) => el.getAnimations()[0]!);
    expect(await animation.evaluate((a) => a.effect!.getTiming())).toMatchObject({
      duration: 5700,
      easing: "linear",
      iterations: Infinity,
    });
    const before = await animation.evaluate((a) => Number(a.currentTime));
    await page.locator(".offer-copy").hover();
    await expect(halo).toHaveCSS("opacity", "1");
    await expect(edge.locator(".gradient-spill")).toHaveCSS("opacity", "0.17");
    await page.mouse.move(4, 30);
    await expect(halo).toHaveCSS("opacity", "0.86");
    await expect(edge.locator(".gradient-spill")).toHaveCSS("opacity", "0.14");
    expect(
      await animation.evaluate(
        (a) => a === document.querySelector(".offer-edge")!.getAnimations()[0],
      ),
    ).toBe(true);
    expect(await animation.evaluate((a) => Number(a.currentTime))).toBeGreaterThan(before);
    expect(
      await edge.evaluate(
        (el) =>
          new Set(
            [".gradient-border", ".gradient-halo > span", ".gradient-spill > span"].map(
              (sel) => getComputedStyle(el.querySelector(sel)!).backgroundImage,
            ),
          ).size,
      ),
    ).toBe(1);
    await page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
    await expect.poll(() => animation.evaluate((a) => a.playState)).toBe("paused");
    const time = await animation.evaluate(async (a) => {
      await a.ready;
      return a.currentTime;
    });
    await page.waitForTimeout(150);
    expect(await animation.evaluate((a) => a.currentTime)).toBe(time);
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await edge.evaluate((el) => el.getAnimations().length)).toBe(0);
    await expect(halo).toHaveCSS("opacity", "0.86");
    await expect(halo).toHaveCSS("pointer-events", "none");
  });
}

test("brush art remains complete without JavaScript in both locales", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: String(test.info().project.use.baseURL),
  });
  const page = await context.newPage();
  try {
    for (const locale of ["en", "ar"]) {
      await page.goto(`/${locale}`);
      for (const art of await page.locator(".brush-art").all()) {
        await art.scrollIntoViewIfNeeded();
        await expect(art.locator("img")).toHaveCSS("mask-image", "none");
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
      }
    }
  } finally {
    await context.close();
  }
});
