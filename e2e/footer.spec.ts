import { test, expect } from "./browser-test";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

for (const locale of ["en", "ar"] as const) {
  const m = { en, ar }[locale];

  test(`${locale}: footer groups stay aligned and readable across screen sizes`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const footer = page.locator("footer");
    await expect(footer.locator(".footer-brand .button")).toHaveCount(0);
    await expect(footer.locator(".footer-grid h2")).toHaveText([
      m.footer.explore,
      m.footer.brand,
      m.footer.founders.title,
      m.footer.contact,
    ]);
    await expect(footer.locator(".footer-founders-list strong")).toHaveText([
      m.footer.founders.mz,
      m.footer.founders.tala,
    ]);
    await expect(footer.locator(".footer-founders-list li > span")).toHaveText([
      m.footer.founders.role,
      m.footer.founders.role,
    ]);
    await expect(footer.getByRole("region", { name: m.footer.follow })).toBeVisible();

    for (const width of [320, 390, 768, 1024, 1200, 1440, 1920]) {
      await page.setViewportSize({ width, height: 950 });
      const layout = await footer.evaluate((root) => {
        const rect = (el: Element) => {
          const box = el.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        };
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          headings: [...root.querySelectorAll(".footer-grid h2")].map(rect),
          names: [...root.querySelectorAll(".footer-founders-list strong")].map(rect),
          social: [...root.querySelectorAll(".social-links > *")].map(rect),
          container: rect(root.querySelector(".container")!),
          socialRow: rect(root.querySelector(".footer-social")!),
          clippedContent: [
            ...root.querySelectorAll<HTMLElement>(".footer-grid > *, .social-links > *"),
          ].some((el) => el.scrollWidth > el.clientWidth + 1),
        };
      });
      expect(layout.overflow, `${width}px document overflow`).toBe(false);
      expect(layout.clippedContent, `${width}px clipped footer content`).toBe(false);
      expect(layout.socialRow.width).toBeCloseTo(layout.container.width, 0);
      expect(layout.names[0]!.height).toBeCloseTo(layout.names[1]!.height, 0);
      if (width >= 1200) {
        expect(layout.names[1]!.y).toBeGreaterThan(layout.names[0]!.y + layout.names[0]!.height);
        expect(layout.names[0]!.x).toBeCloseTo(layout.names[1]!.x, 0);
        await expect(footer.locator(".footer-founders-list li + li")).toHaveCSS(
          "border-inline-start-width",
          "0px",
        );
      } else {
        expect(layout.names[0]!.y).toBeCloseTo(layout.names[1]!.y, 0);
        expect(
          locale === "ar"
            ? layout.names[0]!.x > layout.names[1]!.x
            : layout.names[0]!.x < layout.names[1]!.x,
        ).toBe(true);
      }
      for (const button of layout.social) {
        expect(button.width).toBeCloseTo(layout.social[0]!.width, 0);
        expect(button.height).toBeCloseTo(layout.social[0]!.height, 0);
        expect(button.height).toBeGreaterThanOrEqual(44);
      }
      if (width >= 1200) {
        for (const heading of layout.headings)
          expect(heading.y).toBeCloseTo(layout.headings[0]!.y, 0);
      } else {
        expect(layout.headings[0]!.y).toBeCloseTo(layout.headings[1]!.y, 0);
        expect(layout.headings[2]!.y).toBeGreaterThan(layout.headings[0]!.y);
        if (width >= 768) expect(layout.headings[2]!.y).toBeCloseTo(layout.headings[3]!.y, 0);
        else expect(layout.headings[3]!.y).toBeGreaterThan(layout.headings[2]!.y);
      }
    }
  });

  test(`${locale}: footer keyboard order, destinations and moved motion control remain usable`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const links = page.locator(".footer-grid nav a");
    const destinations = [
      "#collection",
      "#categories",
      "#offers",
      "#about",
      "#how-it-works",
      "#design-studio",
    ];
    await links.first().focus();
    for (let index = 0; index < destinations.length; index++) {
      await expect(links.nth(index)).toBeFocused();
      await expect(links.nth(index)).toHaveAttribute("href", destinations[index]!);
      await page.keyboard.press("Tab");
    }
    for (const founder of await page.locator(".footer-founders-list a").all()) {
      await expect(founder).toBeFocused();
      await page.keyboard.press("Tab");
    }
    await expect(page.locator('.footer-contact a[href^="mailto:"]')).toBeFocused();
    await page.keyboard.press("Tab");
    const social = page.locator(".social-links > *");
    for (let index = 0; index < 4; index++) {
      await expect(social.nth(index)).toBeFocused();
      await expect(social.nth(index)).toHaveAttribute("aria-disabled", "true");
      await expect(social.nth(index)).toHaveAccessibleDescription(m.footer.socialNotice);
      const url = page.url();
      await page.keyboard.press("Enter");
      expect(page.url()).toBe(url);
      await page.keyboard.press("Tab");
    }
    const top = page.locator(".back-to-top");
    await expect(top).toBeFocused();
    await page.keyboard.press("Tab");
    const toggle = page.locator(".footer-bottom .motion-toggle");
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveCSS("outline-style", "solid");
    const ambient = page.locator('footer [data-ambient="footer"]');
    await expect
      .poll(() => ambient.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAccessibleName(m.common.play);
    await expect
      .poll(() => ambient.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("paused");
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect
      .poll(() => ambient.evaluate((el) => el.getAnimations()[0]?.playState))
      .toBe("running");
    // Finish positioning the control before native anchor scrolling starts.
    // Rapid focus traversal can otherwise leave a competing smooth scroll to the footer.
    await top.scrollIntoViewIfNeeded();
    await top.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#home$/);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(100);
  });

  test(`${locale}: founder profiles open safely and social hover respects disabled and motion states`, async ({
    page,
    context,
  }) => {
    await page.goto(`/${locale}`);
    await page.locator(".footer-founders").scrollIntoViewIfNeeded();
    await expect(page.locator(".footer-founders")).toHaveAttribute("data-reveal-state", "complete");
    const founders = page.locator(".footer-founders-list a");
    const destinations = ["https://github.com/oMZ3Go", "https://www.instagram.com/talajarkas.123/"];
    for (const [index, destination] of destinations.entries()) {
      // Verify browser navigation to the approved destination without relying on third-party availability.
      await context.route(destination, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: "<title>Profile destination verified</title>",
        }),
      );
      const founder = founders.nth(index);
      await expect(founder).toHaveAttribute("href", destination);
      await expect(founder).toHaveAttribute("target", "_blank");
      await expect(founder).toHaveAttribute("rel", "noopener noreferrer");
      await expect(founder).toHaveAccessibleName(
        index === 0 ? m.footer.founders.mz : m.footer.founders.tala,
      );
      const popupPromise = page.waitForEvent("popup");
      await founder.click();
      const popup = await popupPromise;
      await popup.waitForLoadState();
      expect(popup.url()).toBe(destination);
      expect(await popup.evaluate(() => window.opener === null)).toBe(true);
      await popup.close();
    }
    await founders.first().focus();
    await page.keyboard.press("Tab");
    await expect(founders.nth(1)).toBeFocused();
    await expect(founders.nth(1)).toHaveCSS("outline-style", "solid");
    const social = page.locator(".social-links > *");
    for (const button of await social.all()) {
      await button.hover();
      await expect(button).toHaveCSS("translate", "0px -2px");
      await expect(button).toHaveCSS("border-color", "rgb(138, 169, 186)");
      await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
      await expect(button).not.toHaveCSS("box-shadow", "none");
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).not.toHaveAttribute("href");
      expect(
        await button.evaluate((el) =>
          getComputedStyle(el)
            .transitionDuration.split(",")
            .every((value) => parseFloat(value) >= 0.2 && parseFloat(value) <= 0.35),
        ),
      ).toBe(true);
    }
    await social.first().focus();
    await page.keyboard.press("Tab");
    await expect(social.nth(1)).toHaveCSS("outline-style", "solid");
    await page.locator(".motion-toggle").click();
    await social.first().hover();
    await expect(social.first()).toHaveCSS("translate", "none");
    await expect(social.first()).toHaveCSS("transition-property", "none");
    await page.locator(".motion-toggle").click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await social.first().hover();
    await expect(social.first()).toHaveCSS("translate", "none");
    await expect(social.first()).toHaveCSS("transition-property", "none");
    expect(
      await page
        .locator('footer [data-ambient="footer"]')
        .evaluate((el) => el.getAnimations().length),
    ).toBe(0);
  });

  test(`${locale}: repeated Pause and Play never move utility-bar elements`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const toggle = page.locator(".motion-toggle");
    const boxes = () =>
      page.locator(".footer-bottom, .footer-bottom > *").evaluateAll((elements) =>
        elements.map((el) => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }),
      );
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 950 });
      await page.evaluate(() =>
        scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
      );
      await expect(toggle).toBeInViewport();
      const baseline = await boxes();
      for (let count = 0; count < 6; count++) {
        await toggle.click();
        await expect(toggle).toHaveAccessibleName(count % 2 === 0 ? m.common.play : m.common.pause);
        const current = await boxes();
        expect(current).toHaveLength(baseline.length);
        current.forEach((box, index) => {
          for (const key of ["x", "y", "width", "height"] as const)
            expect(
              Math.abs(box[key] - baseline[index]![key]),
              `${width}px toggle ${count}: ${key}`,
            ).toBeLessThan(0.01);
        });
      }
    }
  });

  test(`${locale}: atmosphere covers every corner through two round trips and seamless reversals`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    const light = page.locator('footer [data-ambient="footer"]');
    const brush = page.locator("footer .brush-art");
    for (const width of [390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1600 });
      await page.locator("footer").scrollIntoViewIfNeeded();
      await expect
        .poll(() => light.evaluate((el) => el.getAnimations()[0]?.playState))
        .toBe("running");
      await expect(brush).toHaveAttribute("data-reveal-state", "complete");
      const coverage = await light.evaluate((element) => {
        const layer = element as HTMLElement;
        const footer = layer.closest("footer")!;
        const parent = layer.parentElement!;
        const rect = footer.getBoundingClientRect();
        const animation = layer.getAnimations()[0]!;
        const originalTime = animation.currentTime;
        const duration = Number(animation.effect!.getTiming().duration);
        animation.pause();
        const corners = [
          [rect.left, rect.top],
          [rect.right, rect.top],
          [rect.right, rect.bottom],
          [rect.left, rect.bottom],
        ];
        const originX = rect.left + parent.offsetLeft + layer.offsetLeft;
        const originY = rect.top + parent.offsetTop + layer.offsetTop;
        const sample = (time: number) => {
          animation.currentTime = time;
          const style = getComputedStyle(layer);
          const [ox, oy] = style.transformOrigin.split(" ").map(parseFloat);
          const matrix = new DOMMatrix()
            .translate(originX + ox!, originY + oy!)
            .multiply(new DOMMatrix(style.transform))
            .translate(-ox!, -oy!);
          const inverse = matrix.inverse();
          const margin = Math.min(
            ...corners.flatMap(([x, y]) => {
              const point = new DOMPoint(x, y).matrixTransform(inverse);
              return [point.x, point.y, layer.offsetWidth - point.x, layer.offsetHeight - point.y];
            }),
          );
          return {
            margin,
            matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
            opacity: Number(style.opacity),
          };
        };
        let minimumMargin = Infinity;
        for (let time = 0; time <= duration * 4; time += 100)
          minimumMargin = Math.min(minimumMargin, sample(time).margin);
        let largestBoundaryChange = 0;
        for (const boundary of [duration, duration * 2, duration * 3, duration * 4]) {
          const before = sample(boundary - 1),
            after = sample(boundary + 1);
          largestBoundaryChange = Math.max(
            largestBoundaryChange,
            ...before.matrix.map((value, index) => Math.abs(value - after.matrix[index]!)),
            Math.abs(before.opacity - after.opacity),
          );
        }
        const brushRect = footer.querySelector(".brush-art img")!.getBoundingClientRect();
        sample(0);
        const brushAfter = footer.querySelector(".brush-art img")!.getBoundingClientRect();
        animation.currentTime = originalTime;
        animation.play();
        return {
          minimumMargin,
          largestBoundaryChange,
          brushShift: Math.hypot(brushRect.x - brushAfter.x, brushRect.y - brushAfter.y),
        };
      });
      expect(coverage.minimumMargin, `${width}px full-cycle coverage margin`).toBeGreaterThan(1);
      expect(coverage.largestBoundaryChange).toBeLessThan(0.1);
      expect(coverage.brushShift).toBeLessThan(0.01);
      await expect(brush).toHaveCSS("opacity", "0.2");
      await expect(brush.locator("img")).toHaveAttribute("src", /dry-brush-gesture/);
    }
  });
}
