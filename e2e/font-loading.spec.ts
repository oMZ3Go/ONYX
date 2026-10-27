import { test, expect } from "./browser-test";

for (const width of [390, 1440]) {
  for (const held of ["body", "both"] as const) {
    test(`ar ${width}px: delayed ${held} fonts preserve initial typography`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");
      let releaseFonts!: () => void;
      const fontsCanFinish = new Promise<void>((resolve) => (releaseFonts = resolve));
      const requests = new Set<string>();
      await page.route("**/*.woff2", async (route) => {
        const url = route.request().url();
        if (!url.includes("noto_sans_arabic") && !(held === "both" && url.includes("alexandria")))
          return route.continue();
        requests.add(url);
        const response = await route.fetch();
        await fontsCanFinish;
        await route.fulfill({ response });
      });
      await page.addInitScript(() => {
        const shifts: unknown[] = [];
        Reflect.set(window, "fontLayoutShifts", shifts);
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number;
              sources: {
                node: Node | null;
                previousRect: DOMRectReadOnly;
                currentRect: DOMRectReadOnly;
              }[];
            };
            shifts.push({
              value: shift.value,
              time: shift.startTime,
              fonts: document.fonts.status,
              sources: shift.sources.map((source) => {
                const element =
                  source.node instanceof Element ? source.node : source.node?.parentElement;
                return {
                  tag: element?.tagName,
                  className: element?.className,
                  text: source.node?.textContent?.slice(0, 80),
                  previous: source.previousRect,
                  current: source.currentRect,
                };
              }),
            });
          }
        }).observe({ type: "layout-shift", buffered: true });
      });

      try {
        await page.goto("/ar", { waitUntil: "domcontentloaded" });
        await expect.poll(() => requests.size).toBe(held === "body" ? 1 : 2);
        // Hold the actual responses until fallback text has painted, without a timed sleep.
        await page.waitForFunction(
          () => performance.getEntriesByName("first-contentful-paint").length > 0,
        );
        const fontsFor = async (selector: string) => {
          const { root } = await cdp.send("DOM.getDocument");
          const { nodeId } = await cdp.send("DOM.querySelector", {
            nodeId: root.nodeId,
            selector,
          });
          return (await cdp.send("CSS.getPlatformFontsForNode", { nodeId })).fonts;
        };
        const fallbackFonts = await fontsFor(".hero-description");
        expect(
          fallbackFonts.some(
            (font) => ["Tahoma", "DejaVu Sans"].includes(font.familyName) && font.glyphCount > 0,
          ),
        ).toBe(true);
        expect(fallbackFonts.some((font) => font.familyName === "Noto Sans Arabic")).toBe(false);
        const fallbackHeadingFonts = await fontsFor("#hero-title");
        if (held === "both") {
          expect(
            fallbackHeadingFonts.some(
              (font) => ["Tahoma", "DejaVu Sans"].includes(font.familyName) && font.glyphCount > 0,
            ),
          ).toBe(true);
          expect(fallbackHeadingFonts.some((font) => font.familyName === "Alexandria")).toBe(false);
        }
        const assertContainedText = async () => {
          const geometry = await page.evaluate(() => {
            const rect = (selector: string) =>
              document.querySelector(selector)!.getBoundingClientRect();
            const title = rect("#hero-title");
            const description = rect(".hero-description");
            const actions = rect(".hero-actions");
            const buttons = [...document.querySelectorAll(".hero-actions .button")].map((element) =>
              element.getBoundingClientRect(),
            );
            return {
              overflow: document.documentElement.scrollWidth - innerWidth,
              titleGap: description.top - title.bottom,
              actionsGap: actions.top - description.bottom,
              // CTA sheen deliberately extends beyond the button's scroll box.
              // Measure actual text ranges so decoration cannot masquerade as clipped text.
              clipped: [
                ...document.querySelectorAll(
                  ".headline-line, .hero-description, .hero-actions .button",
                ),
              ].some((element) => {
                const bounds = element.getBoundingClientRect();
                return [...element.childNodes].some((node) => {
                  if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return false;
                  const range = document.createRange();
                  range.selectNodeContents(node);
                  return [...range.getClientRects()].some(
                    (text) => text.left < bounds.left - 1 || text.right > bounds.right + 1,
                  );
                });
              }),
              buttonsOverlap: buttons.some((a, i) =>
                buttons
                  .slice(i + 1)
                  .some(
                    (b) =>
                      Math.min(a.right, b.right) > Math.max(a.left, b.left) &&
                      Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top),
                  ),
              ),
            };
          });
          expect(geometry.overflow).toBeLessThanOrEqual(1);
          expect(geometry.titleGap).toBeGreaterThanOrEqual(0);
          expect(geometry.actionsGap).toBeGreaterThanOrEqual(0);
          expect(geometry.clipped).toBe(false);
          expect(geometry.buttonsOverlap).toBe(false);
        };
        const boxes = () =>
          page.locator("#hero-title, .hero-description").evaluateAll((elements) =>
            elements.map((element) => {
              const { x, y, right, width, height } = element.getBoundingClientRect();
              return { x, y, right, width, height };
            }),
          );
        const before = await boxes();
        await assertContainedText();
        // CDP captures the visible fallback frame without waiting for the held web fonts.
        await testInfo.attach("fallback-visible", {
          body: Buffer.from(
            (await cdp.send("Page.captureScreenshot", { format: "png" })).data,
            "base64",
          ),
          contentType: "image/png",
        });
        releaseFonts();
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
        });
        const after = await boxes();
        await assertContainedText();
        const bodyFonts = await fontsFor(".hero-description");
        const headingFonts = await fontsFor("#hero-title");
        const shifts = await page.evaluate(
          () => Reflect.get(window, "fontLayoutShifts") as { value: number }[],
        );
        await testInfo.attach("font-loading-diagnostics", {
          body: JSON.stringify({
            held,
            width,
            fallbackFonts,
            fallbackHeadingFonts,
            bodyFonts,
            headingFonts,
            before,
            after,
            shifts,
          }),
          contentType: "application/json",
        });
        // The intended web fonts must really render; an optional-font fallback is not a pass.
        expect(
          bodyFonts.some((font) => font.isCustomFont && font.familyName === "Noto Sans Arabic"),
        ).toBe(true);
        expect(
          headingFonts.some((font) => font.isCustomFont && font.familyName === "Alexandria"),
        ).toBe(true);
        // The max-content RTL title keeps its inline-start edge and line geometry.
        // Different fallback glyph widths may change its left edge without moving text.
        for (const key of ["right", "y", "height"] as const)
          expect(Math.abs(after[0]![key] - before[0]![key])).toBeLessThan(1);
        for (const key of ["x", "y", "width", "height"] as const)
          expect(Math.abs(after[1]![key] - before[1]![key])).toBeLessThan(1);
        expect(shifts.reduce((sum, shift) => sum + shift.value, 0)).toBeLessThan(0.001);
      } finally {
        releaseFonts();
      }
    });
  }
}
