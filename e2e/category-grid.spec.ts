import { test, expect } from "./browser-test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CategoryGrid } from "../src/modules/landing/components/category-grid";
import { getLandingCategories, type LandingCategory } from "../src/modules/landing/categories";
import ar from "../messages/ar.json";
import en from "../messages/en.json";

for (const locale of ["en", "ar"] as const) {
  test(`${locale}: categories preserve mobile and desktop, with a wide odd tablet final row`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const cards = page.locator(".category-card");
    await expect(cards).toHaveCount(5);

    for (const width of [
      320, 375, 390, 430, 599, 600, 768, 820, 900, 1024, 1099, 1100, 1280, 1440, 1920,
    ]) {
      await page.setViewportSize({ width, height: 900 });
      for (const card of await cards.all()) await expect(card).toBeVisible();
      const layout = await page.locator(".category-grid").evaluate((grid) => {
        const bounds = grid.getBoundingClientRect();
        return {
          center: bounds.x + bounds.width / 2,
          width: bounds.width,
          cards: [...grid.children].map((card) => {
            const box = card.getBoundingClientRect();
            const arrow = card.querySelector(".category-arrow")!.getBoundingClientRect();
            const title = card.querySelector("h3")!.getBoundingClientRect();
            const paragraph = card.querySelector("p")!.getBoundingClientRect();
            const rtl = getComputedStyle(card).direction === "rtl";
            return {
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
              arrowBottom: box.bottom - arrow.bottom,
              arrowEnd: rtl ? arrow.left - box.left : box.right - arrow.right,
              textGap: rtl ? paragraph.left - arrow.right : arrow.left - paragraph.right,
              baseline: Math.abs(paragraph.bottom - arrow.bottom),
              titleFits: title.left >= box.left && title.right <= box.right && title.top >= box.top,
              paragraphFits: paragraph.top >= title.bottom && paragraph.bottom <= box.bottom,
              imageFit: getComputedStyle(card.querySelector("img")!).objectFit,
            };
          }),
        };
      });
      const columns = width < 600 ? 1 : width < 1100 ? 2 : 5;
      const first = layout.cards[0]!;
      for (const [index, card] of layout.cards.entries()) {
        const context = `${locale} ${width}px card ${index + 1}`;
        const wide = columns === 2 && index === layout.cards.length - 1;
        expect(Math.abs(card.width - (wide ? layout.width : first.width)), context).toBeLessThan(1);
        expect(Math.abs(card.height - first.height), context).toBeLessThan(1);
        const rowStart = layout.cards[Math.floor(index / columns) * columns]!;
        expect(Math.abs(card.y - rowStart.y), context).toBeLessThan(1);
        if (index >= columns)
          expect(card.y, context).toBeGreaterThan(layout.cards[index - columns]!.y + first.height);
        expect(card.titleFits && card.paragraphFits, context).toBe(true);
        expect(card.textGap, context).toBeGreaterThanOrEqual(6);
        expect(card.baseline, context).toBeLessThan(1);
        expect(card.arrowBottom, context).toBeGreaterThanOrEqual(12);
        expect(card.arrowBottom, context).toBeLessThanOrEqual(18);
        expect(card.arrowEnd, context).toBeGreaterThanOrEqual(12);
        expect(card.arrowEnd, context).toBeLessThanOrEqual(16);
        expect(card.imageFit, context).toBe("cover");
        if (width < 600) expect(card.height, context).toBeLessThanOrEqual(300);
      }
      expect(layout.cards.filter((card) => Math.abs(card.y - first.y) < 1)).toHaveLength(columns);
      if (columns === 1) expect(Math.abs(first.width - layout.width)).toBeLessThan(1);
      if (columns === 2) {
        const last = layout.cards[4]!;
        expect(Math.abs(last.x + last.width / 2 - layout.center)).toBeLessThan(1);
        expect(Math.abs(last.width - layout.width)).toBeLessThan(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
  });

  for (const width of [390, 600, 768, 820, 1024, 1099, 1100, 1440]) {
    test(`${locale} ${width}px: category collections filter, wrap and preserve order for 1–8 and 10 cards`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const response = await page.request.get(`/${locale}`);
      expect(response.ok()).toBe(true);
      const production = await response.text();
      const shell = production.replace(/<script\b[\s\S]*?<\/script>/g, "");
      const categorySection = /<section\b[^>]*id="categories"[^>]*>[\s\S]*?<\/section>/;
      expect(shell).toMatch(categorySection);
      let fixture = "";
      // Preserve the real page shell and font-loading context around the real component.
      // Scripts are omitted to keep React from hydrating these test-only data with live data.
      // No mock route, data switch, or fixture is shipped in the application.
      await page.route(`**/${locale}/__category-grid-fixture__`, (route) =>
        route.fulfill({
          contentType: "text/html",
          body: shell.replace(categorySection, () => fixture),
        }),
      );
      await page.addInitScript(() => {
        const shifts: number[] = [];
        const details: unknown[] = [];
        Reflect.set(window, "categoryLayoutShifts", shifts);
        Reflect.set(window, "categoryShiftDetails", details);
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as PerformanceEntry & {
              value: number;
              sources: {
                node: Element;
                previousRect: DOMRectReadOnly;
                currentRect: DOMRectReadOnly;
              }[];
            };
            shifts.push(shift.value);
            details.push({
              value: shift.value,
              time: shift.startTime,
              fonts: document.fonts.status,
              sources: shift.sources.map((source) => ({
                tag: source.node?.tagName,
                className: source.node?.className,
                text: source.node?.textContent?.slice(0, 80),
                previous: source.previousRect,
                current: source.currentRect,
              })),
            });
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      const messages = locale === "ar" ? ar : en;
      const initial = getLandingCategories(messages.categories);
      let pairedHeight = 0;
      for (const count of [2, 1, 3, 4, 5, 6, 7, 8, 10]) {
        const categories: LandingCategory[] = Array.from({ length: count + 2 }, (_, index) => ({
          ...initial[index % initial.length]!,
          id: `stable-${count + 2 - index}`,
          slug: `design-${index + 1}`,
          title: locale === "ar" ? `الفئة ${index + 1}` : `Category ${index + 1}`,
          published: index !== 1 && index !== count + 1,
        }));
        const visible = categories.filter((category) => category.published);
        fixture = renderToStaticMarkup(
          createElement(CategoryGrid, {
            copy: messages.categories,
            locale,
            categories,
          }),
        );
        await page.goto(`/${locale}/__category-grid-fixture__`);
        await page.evaluate(() => document.fonts.ready);
        const cards = page.locator(".category-grid > .category-card");
        await expect(cards).toHaveCount(count);
        expect(
          await cards.evaluateAll((elements) =>
            elements.map((element) => element.getAttribute("data-category-id")),
          ),
        ).toEqual(visible.map((category) => category.id));
        await expect(page.locator('[data-category-id="' + categories[1]!.id + '"]')).toHaveCount(0);
        const layout = await page.locator(".category-grid").evaluate((grid) => {
          const outer = grid.getBoundingClientRect();
          return {
            width: outer.width,
            x: outer.x,
            cards: [...grid.children].map((card) => {
              const b = card.getBoundingClientRect(),
                arrow = card.querySelector(".category-arrow")!.getBoundingClientRect(),
                p = card.querySelector("p")!.getBoundingClientRect(),
                title = card.querySelector("h3")!.getBoundingClientRect();
              const rtl = getComputedStyle(card).direction === "rtl";
              return {
                width: b.width,
                height: b.height,
                x: b.x,
                y: b.y + scrollY,
                bottom: b.bottom + scrollY,
                imageFit: getComputedStyle(card.querySelector("img")!).objectFit,
                textFits:
                  title.left >= b.left &&
                  title.right <= b.right &&
                  p.top >= title.bottom &&
                  p.bottom <= b.bottom,
                gap: rtl ? p.left - arrow.right : arrow.left - p.right,
                corner: rtl ? arrow.left - b.left : b.right - arrow.right,
                baseline: Math.abs(arrow.bottom - p.bottom),
              };
            }),
          };
        });
        const columns = width < 600 ? 1 : width < 1100 ? 2 : 5;
        if (count === 2) pairedHeight = layout.cards[0]!.height;
        for (const [index, card] of layout.cards.entries()) {
          const label = `${locale}/${width}/${count}, card ${index + 1}`;
          const wide = columns === 2 && count % 2 === 1 && index === count - 1;
          const expectedWidth = wide ? layout.width : (layout.width - (columns - 1) * 16) / columns;
          expect(Math.abs(card.width - expectedWidth), label).toBeLessThan(1);
          expect(Math.abs(card.height - pairedHeight), label).toBeLessThan(1);
          expect(card.textFits, label).toBe(true);
          expect(card.imageFit, label).toBe("cover");
          expect(card.gap, label).toBeGreaterThanOrEqual(6);
          expect(card.corner, label).toBeGreaterThanOrEqual(12);
          expect(card.corner, label).toBeLessThanOrEqual(16);
          expect(card.baseline, label).toBeLessThan(1);
          const rowStart = Math.floor(index / columns) * columns;
          expect(Math.abs(card.y - layout.cards[rowStart]!.y), label).toBeLessThan(1);
          if (index >= columns)
            expect(card.y, label).toBeGreaterThan(layout.cards[index - columns]!.bottom);
          if (index % columns > 0) {
            const previous = layout.cards[index - 1]!;
            expect(locale === "ar" ? card.x < previous.x : card.x > previous.x, label).toBe(true);
          }
          if (wide) expect(Math.abs(card.x - layout.x), label).toBeLessThan(1);
          await expect(cards.nth(index)).toBeVisible();
          await expect(cards.nth(index).locator("h3")).toHaveText(visible[index]!.title);
          await expect(cards.nth(index).locator("a")).toHaveAttribute(
            "href",
            `/${locale}/categories/${visible[index]!.slug}`,
          );
        }
        // Decode lazy images after bringing every card into view; reserved sizes must hold.
        for (const card of await cards.all()) await card.scrollIntoViewIfNeeded();
        await cards
          .locator("img")
          .evaluateAll((images) =>
            Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
          );
        const after = await cards.evaluateAll((elements) =>
          elements.map((element) => ({
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
            x: element.getBoundingClientRect().x,
            y: element.getBoundingClientRect().y + scrollY,
          })),
        );
        for (const [index, box] of after.entries()) {
          expect(Math.abs(box.width - layout.cards[index]!.width)).toBeLessThan(1);
          expect(Math.abs(box.height - layout.cards[index]!.height)).toBeLessThan(1);
          expect(Math.abs(box.x - layout.cards[index]!.x)).toBeLessThan(1);
          expect(Math.abs(box.y - layout.cards[index]!.y)).toBeLessThan(1);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        await testInfo.attach(`layout-shifts-${count}`, {
          body: JSON.stringify(
            await page.evaluate(() => Reflect.get(window, "categoryShiftDetails")),
          ),
          contentType: "application/json",
        });
        expect(
          await page.evaluate(() =>
            (Reflect.get(window, "categoryLayoutShifts") as number[]).reduce(
              (sum, shift) => sum + shift,
              0,
            ),
          ),
        ).toBeLessThan(0.001);
        if (width === 768 && [1, 6, 7].includes(count)) {
          await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          const clip = await page.locator("#categories").evaluate((section) => {
            const box = section.getBoundingClientRect();
            return { x: box.x, y: box.y + scrollY, width: box.width, height: box.height };
          });
          const path = testInfo.outputPath(`categories-${count}.png`);
          await page.screenshot({ path, fullPage: true, clip });
          await testInfo.attach(`categories-${count}`, { path, contentType: "image/png" });
        }
      }
    });
  }
}
