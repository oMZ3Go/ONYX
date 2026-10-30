import { test, expect, type Page } from "./browser-test";

async function alignedPerimeters(page: Page) {
  await expect(page.locator(".perimeter-light")).toHaveCount(5);
  await expect
    .poll(() =>
      page.locator(".perimeter-light").evaluateAll((lights) =>
        Math.max(
          ...lights.flatMap((light) => {
            const host = light.parentElement!;
            const outer = host.getBoundingClientRect();
            const box = light.getBoundingClientRect();
            const ring = light.querySelector(".gradient-border")!;
            const path = ring.getBoundingClientRect();
            return [
              Math.abs(box.x - outer.x),
              Math.abs(box.y - outer.y),
              Math.abs(box.width - outer.width),
              Math.abs(box.height - outer.height),
              Math.abs(path.x - outer.x),
              Math.abs(path.y - outer.y),
              Math.abs(path.right - outer.right),
              Math.abs(path.bottom - outer.bottom),
              Math.abs(
                parseFloat(getComputedStyle(ring).borderTopLeftRadius) -
                  parseFloat(getComputedStyle(host).borderTopLeftRadius),
              ),
            ];
          }),
        ),
      ),
    )
    .toBeLessThan(0.1);
}

for (const locale of ["en", "ar"]) {
  test(`${locale}: perimeter follows resized rounded borders and preserves interactive motion`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const pause = () =>
      page.locator(".motion-toggle").evaluate((el) => (el as HTMLButtonElement).click());
    await pause(); // Finish entrances before comparing actual screen geometry.
    await alignedPerimeters(page);
    const offer = page.locator("#offers .offer-frame");
    const edge = offer.locator("[data-ambient]");
    await offer.scrollIntoViewIfNeeded();
    await pause();
    await expect
      .poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    const animation = await edge.evaluateHandle((el) => el.getAnimations()[0]!);
    const offset = await edge.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--gradient-angle"),
    );
    await expect
      .poll(() => edge.evaluate((el) => getComputedStyle(el).getPropertyValue("--gradient-angle")))
      .not.toBe(offset);
    await pause();
    await expect.poll(() => edge.evaluate((el) => el.getAnimations()[0]?.playState)).toBe("paused");
    const time = await animation.evaluate(async (a) => {
      await a.ready;
      return a.currentTime;
    });
    for (const width of [390, 768, 1024, 320, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await alignedPerimeters(page);
      expect(
        await animation.evaluate(
          (a) => a === document.querySelector('[data-ambient="edge"]')!.getAnimations()[0],
        ),
      ).toBe(true);
      expect(await animation.evaluate((a) => a.currentTime)).toBe(time);
    }
    const paths = await page.locator(".perimeter-light").evaluateAll((els) =>
      els.map((el) => {
        const border = el.querySelector(".gradient-border")!;
        const halo = el.querySelector(".gradient-halo > span")!;
        return {
          width: parseFloat(getComputedStyle(border).paddingTop),
          gradient: getComputedStyle(border).backgroundImage,
          halo: getComputedStyle(halo).backgroundImage,
          clipping: getComputedStyle(el.parentElement!).overflow,
          mask: getComputedStyle(border).maskComposite,
          animations: el.getAnimations({ subtree: true }).length,
        };
      }),
    );
    for (const [index, path] of paths.entries()) {
      expect(path.width).toBe(index === 4 ? 1.25 : 1);
      expect(path.gradient).toContain("conic-gradient");
      expect(path.halo).toBe(path.gradient);
      expect(path.mask.split(",").map((value) => value.trim())).toEqual(["exclude", "exclude"]);
      expect(path.animations).toBeLessThanOrEqual(1);
      expect(path.clipping).toBe("visible");
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const card = page.locator(".product-card").first();
    await card.scrollIntoViewIfNeeded();
    await pause();
    const cardEdge = card.locator('[data-ambient="product-edge"]');
    for (let i = 0; i < 2; i++) {
      await card.hover();
      await expect(card.locator(".product-edge")).toHaveCSS("opacity", "1");
      await expect
        .poll(() => cardEdge.evaluate((el) => el.getAnimations()[0]?.playState))
        .toBe("running");
      expect(
        await cardEdge.evaluate((el) => el.getAnimations()[0]!.effect!.getTiming().duration),
      ).toBe(3900);
      const before = await cardEdge.evaluate((el) => Number(el.getAnimations()[0]!.currentTime));
      await expect
        .poll(() => cardEdge.evaluate((el) => Number(el.getAnimations()[0]!.currentTime)))
        .toBeGreaterThan(before + 150);
      await page.mouse.move(4, 100);
      await expect(card.locator(".product-edge")).toHaveCSS("opacity", "0");
      await expect
        .poll(() => cardEdge.evaluate((el) => el.getAnimations()[0]?.playState))
        .toBe("paused");
    }
    await card.locator("a").focus();
    await expect(card.locator("a")).toBeFocused();
    await expect(card.locator(".product-edge")).toHaveCSS("opacity", "1");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(card.locator(".product-edge")).toBeVisible();
    expect(await cardEdge.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await card.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
    await expect(card.locator("a")).toHaveAttribute("href", "#design-studio");
    await expect(page.locator(".offer-edge")).toBeVisible();
    expect(await edge.evaluate((el) => el.getAnimations().length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  test(`${locale}: menu hides its scrollbar without losing wheel or keyboard access`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 960, height: 510 });
    await page.goto(`/${locale}`);
    const summary = page.locator(".mobile-navigation summary");
    const menu = page.locator("#mobile-menu");
    await summary.click();
    await expect
      .poll(() => menu.evaluate((el) => el.getAnimations({ subtree: true }).length))
      .toBe(0);
    for (const [width, height] of [
      [960, 510],
      [320, 568],
      [390, 844],
      [768, 900],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await expect
        .poll(() => menu.evaluate((el) => el.scrollHeight - el.clientHeight))
        .toBeLessThanOrEqual(1);
      await expect(menu).toHaveCSS("scrollbar-width", "none");
      expect(await menu.evaluate((el) => (el as HTMLElement).offsetWidth - el.clientWidth)).toBe(0);
      await page.mouse.move(2, 2);
      await expect
        .poll(() =>
          menu.locator("a[data-section-link]").evaluateAll((links) => {
            const rows = links.map((link) => {
              const style = getComputedStyle(link),
                rtl = style.direction === "rtl";
              const row = link.getBoundingClientRect();
              const icon = link.querySelector("svg")!;
              const iconBox = icon.getBoundingClientRect();
              const path = icon.querySelector("path")!.getBoundingClientRect();
              const label = link.querySelector("span")!.getBoundingClientRect();
              const stroke =
                (parseFloat(getComputedStyle(icon).strokeWidth) * iconBox.width) / 24 / 2;
              const edge = rtl
                ? row.right - parseFloat(style.borderInlineStartWidth)
                : row.left + parseFloat(style.borderInlineStartWidth);
              return {
                gap: (rtl ? edge - path.right : path.left - edge) - stroke,
                icon: rtl ? row.right - iconBox.right : iconBox.left - row.left,
                label: rtl ? row.right - label.right : label.left - row.left,
                height: row.height,
              };
            });
            return rows.every(
              (row) =>
                row.gap >= 10 &&
                row.gap <= 14 &&
                row.height === 48 &&
                Math.abs(row.icon - rows[0]!.icon) < 0.1 &&
                Math.abs(row.label - rows[0]!.label) < 0.1,
            );
          }),
        )
        .toBe(true);
      await expect(menu.locator("a[aria-current]")).toHaveCSS(
        "border-inline-start-color",
        "rgb(138, 169, 186)",
      );
    }
    for (const [width, height] of [
      [844, 320],
      [720, 250],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await expect
        .poll(() => menu.evaluate((el) => el.scrollHeight - el.clientHeight))
        .toBeGreaterThan(100);
      await menu.hover();
      await page.mouse.wheel(0, 600);
      await expect.poll(() => menu.evaluate((el) => el.scrollTop)).toBeGreaterThan(100);
      const final = menu.locator("a").last();
      await expect(final).toBeInViewport();
      await page.mouse.wheel(0, -600);
      await expect.poll(() => menu.evaluate((el) => el.scrollTop)).toBe(0);
      await summary.focus();
      for (let index = 0; index < 7; index++) {
        await page.keyboard.press("Tab");
        await expect(menu.locator("a").nth(index)).toBeFocused();
        await expect(menu.locator("a").nth(index)).toBeInViewport();
      }
      const bounds = await menu.boundingBox();
      const last = await final.boundingBox();
      expect(last!.y + last!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
      expect(
        await menu.evaluate(
          (el) =>
            [...el.querySelectorAll("*")].filter((child) =>
              ["auto", "scroll"].includes(getComputedStyle(child).overflowY),
            ).length,
        ),
      ).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await expect(summary).toBeFocused();
    await summary.click();
    await page.mouse.click(2, 245);
    await expect(menu).not.toBeVisible();
    const other = locale === "en" ? "ar" : "en";
    await page.locator(`.language-switcher a[lang="${other}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("lang", other);
    await summary.click();
    await expect(menu.locator("a")).toHaveCount(7);
    await menu.locator("a").last().click();
    await expect(menu).not.toBeVisible();
    await expect(page).toHaveURL(/#design-studio$/);
  });
}
