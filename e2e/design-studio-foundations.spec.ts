import { mkdir, writeFile } from "node:fs/promises";
import { test, expect, type Page } from "./browser-test";
import { studioImagesReady } from "./studio-images";
import { setStudioTheme } from "./studio-controls";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const shots = ".cache/phase-03/foundations";
test.use({ hasTouch: true });
async function settle(page: Page) {
  await studioImagesReady(page);
  await expect(page.locator(".ds-garments-exit")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
    )
    .toBe(0);
}
async function capture(page: Page, name: string) {
  await mkdir(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png` });
}

for (const locale of ["en", "ar"] as const) {
  const copy = { en, ar }[locale].designStudio;
  test(`${locale}: five mobile docks preserve Pin, tools and camera with bounded width and useful previews`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => localStorage.removeItem("onyx-studio-panels-v1"));
    const measurements = [];
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [768, 1024],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.goto(`/${locale}/design-studio`);
      await page.locator("#ds-toggle-library").click();
      await page.locator(".ds-sheet-pin").click();
      await page.getByRole("button", { name: copy.workspace.front, exact: true }).click();
      const appearance = await page.locator(".ds-page").getAttribute("data-theme");
      const panel = page.locator("#ds-mobile-tools");
      for (const dock of ["left", "right", "top", "floating", "left", "bottom"] as const) {
        await page.locator(".ds-sheet-settings").click();
        const label = {
          left: copy.dockLeft,
          right: copy.dockRight,
          top: copy.dockTop,
          floating: copy.floating,
          bottom: copy.dockBottom,
        }[dock];
        await page.getByRole("button", { name: label, exact: true }).click();
        await settle(page);
        await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", dock);
        await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", appearance!);
        await expect(page.locator(".ds-garments")).toHaveAttribute("data-view", "front");
        await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
        const box = (await panel.boundingBox())!;
        const img = (await page.locator(".ds-garments img").first().boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width!);
        const viewport = (await page.locator(".ds-viewport").boundingBox())!;
        expect(viewport.x).toBeGreaterThanOrEqual(0);
        expect(viewport.x + viewport.width).toBeLessThanOrEqual(width!);
        expect(img.height).toBeGreaterThanOrEqual(90);
        const visible = await page
          .locator(".ds-garments img")
          .first()
          .evaluate((el) => {
            const r = el.getBoundingClientRect();
            const points = [];
            for (let iy = 1; iy <= 9; iy++)
              for (let ix = 1; ix <= 9; ix++) {
                const x = r.x + (r.width * ix) / 10,
                  y = r.y + (r.height * iy) / 10;
                if (document.elementFromPoint(x, y) === el) points.push({ x, y });
              }
            return points;
          });
        expect(visible.length).toBeGreaterThanOrEqual(dock === "floating" ? 36 : 81);
        const point = visible[Math.floor(visible.length / 2)]!;
        await page.mouse.click(point.x, point.y);
        await expect(panel).toBeVisible();
        expect(await page.locator(".ds-viewport").getAttribute("data-zoom")).toBe("100");
        measurements.push({
          width,
          height,
          dock,
          panel: box,
          garment: img,
          reachableSamples: visible.length,
        });
        await capture(page, `${locale}-${width}-${dock}-pinned`);
        if ((dock === "left" || dock === "right") && width! < 700) {
          await expect(panel).toHaveAttribute("data-rail", "true");
          expect(box.width).toBe(56);
          await page.locator(".ds-side-reveal").click();
          await settle(page);
          await expect(panel).toHaveAttribute("data-rail", "false");
          await expect(page.locator("#ds-tool-artwork")).toBeVisible();
          expect(
            (await page.locator(".ds-garments img").first().boundingBox())!.height,
          ).toBeGreaterThanOrEqual(90);
          await capture(page, `${locale}-${width}-${dock}-expanded`);
          await page.locator(".ds-sheet-settings").click();
          const sizing = page.locator(".ds-panel-sizing-row button");
          await expect(sizing).toHaveCount(2);
          const boxes = await sizing.evaluateAll((els) =>
            els.map((el) => el.getBoundingClientRect().toJSON()),
          );
          expect(boxes[0]!.y).toBe(boxes[1]!.y);
          expect(boxes[0]!.height).toBeGreaterThanOrEqual(44);
          await page.locator(".ds-sheet-width").click();
          const slider = page.getByRole("slider", { name: copy.panelWidth });
          await slider.focus();
          await page.keyboard.press("Home");
          await settle(page);
          const minimum = (await panel.boundingBox())!.width;
          await page.keyboard.press("End");
          await settle(page);
          const maximum = (await panel.boundingBox())!.width;
          expect(minimum).toBeGreaterThanOrEqual(284);
          expect(maximum).toBeGreaterThan(minimum);
          expect(maximum).toBeLessThanOrEqual(width! - 16);
          await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
          await capture(page, `${locale}-${width}-layout-width`);
          await page.locator(".ds-sheet-expand").click();
          let previous = 0;
          for (const size of ["compact", "medium", "expanded"] as const) {
            await page.getByRole("button", { name: copy[`${size}Size`], exact: true }).click();
            await settle(page);
            const h = (await panel.boundingBox())!.height;
            expect(h).toBeGreaterThan(previous);
            previous = h;
            await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
          }
          await page.getByRole("button", { name: copy.compactSize, exact: true }).click();
          await page.locator(".ds-sheet-settings").click();
          await page.locator("#ds-tool-text").click();
          await page.locator("#ds-toggle-inspector").click();
          await page.locator(".ds-layers-tab").click();
          await page.locator("#ds-toggle-library").click();
          await expect(page.locator("#ds-tool-text")).toHaveAttribute("aria-expanded", "true");
          await page.locator("#ds-tool-artwork").click();
          await page.locator(".ds-side-reveal").click();
        }
      }
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.dockLeft, exact: true }).click();
      await page.setViewportSize({ width: 844, height: 390 });
      await settle(page);
      await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "left");
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
      expect(
        (await page.locator(".ds-garments img").first().boundingBox())!.height,
      ).toBeGreaterThanOrEqual(90);
      await page.locator(".ds-sheet-settings").click();
      await page.locator(".ds-sheet-width").click();
      const slider = page.getByRole("slider", { name: copy.panelWidth });
      await slider.focus();
      await page.keyboard.press("Home");
      await settle(page);
      const minimum = (await panel.boundingBox())!.width;
      await page.keyboard.press("End");
      await settle(page);
      expect((await panel.boundingBox())!.width).toBeGreaterThan(minimum + 100);
      await page.locator(".ds-sheet-settings").click();
      await capture(page, `${locale}-${width}-landscape-left`);
      await page.setViewportSize({ width: width!, height: height! });
      await settle(page);
      await page.locator("#ds-fullscreen").click();
      await expect(page.locator(".ds-page")).toHaveAttribute("data-focus", "true");
      await page.keyboard.press("Escape");
      await expect(page.locator(".ds-page")).toHaveAttribute("data-focus", "false");
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", appearance!);
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
      await setStudioTheme(page, "light");
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
      await settle(page);
      await capture(page, `${locale}-${width}-left-light`);
      await page.locator(".ds-sheet-pin").click();
      await expect(panel).toBeVisible();
      await page.locator(".ds-garments img").first().click();
      await expect(panel).toBeHidden();
      await page.locator("#ds-toggle-library").click();
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "false");
      await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "left");
      await page.locator(".ds-sheet-pin").click();
      await page.locator(".ds-sheet-close").click();
      await expect(panel).toBeHidden();
      await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    await writeFile(
      `${shots}/${locale}-dock-measurements.json`,
      JSON.stringify(measurements, null, 2),
    );
  });
  test(`${locale}: Top Bar appearance and distinct view controls reclaim preview space`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const measurements = [];
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [768, 1024],
      [1024, 768],
      [1440, 900],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.context().clearCookies();
      await page.goto(`/${locale}/design-studio`);
      await settle(page);
      await expect(
        page.locator(".ds-canvas .ds-background-control, .ds-canvas .ds-appearance-controls"),
      ).toHaveCount(0);
      await expect(page.locator(".ds-header .ds-appearance-toggle")).toBeVisible();
      await expect(page.locator(".ds-header")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(page.locator(".ds-header")).toHaveCSS("backdrop-filter", "none");
      const geometry = await page.evaluate(() => {
        const controls = [
          ...document.querySelectorAll<HTMLElement>(
            ".ds-header a, .ds-appearance-toggle, .ds-header h1, .ds-save-status",
          ),
        ]
          .filter((el) => el.getClientRects().length)
          .map((el) => {
            const b = el.getBoundingClientRect();
            return { x: b.x, y: b.y, w: b.width, h: b.height };
          });
        const viewport = document.querySelector(".ds-viewport")!.getBoundingClientRect();
        return {
          controls,
          header: document.querySelector(".ds-header")!.getBoundingClientRect().height,
          viewport: viewport.height,
          viewRow: document.querySelector(".ds-canvas-controls")!.getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(geometry.viewRow).toBeLessThanOrEqual(52);
      expect(geometry.overflow).toBeLessThanOrEqual(1);
      if (width! < 700) expect(geometry.header).toBeLessThanOrEqual(60);
      if (width === 320) expect(geometry.viewport).toBeGreaterThanOrEqual(240);
      for (const [i, a] of geometry.controls.entries()) {
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.x + a.w).toBeLessThanOrEqual(width!);
        for (const b of geometry.controls.slice(i + 1))
          expect(
            Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 1 &&
              Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 1,
          ).toBe(false);
      }
      measurements.push({ width, height, ...geometry });
      const paths = await page
        .locator(".ds-view-control svg path")
        .evaluateAll((els) => els.map((el) => el.getAttribute("d")));
      expect(new Set(paths).size).toBe(3);
      await capture(page, `${locale}-${width}-dark-back`);
      const toggle = page.locator(".ds-appearance-toggle");
      await expect(toggle).toHaveCount(1);
      await expect(toggle).toHaveAccessibleName(copy.workspace.switchToLight);
      await expect(toggle.locator("svg")).toHaveAttribute("data-theme-icon", "sun");
      expect(await toggle.getAttribute("aria-pressed")).toBeNull();
      expect(await toggle.getAttribute("aria-expanded")).toBeNull();
      const previewState = () =>
        page.evaluate(() => {
          const viewport = document.querySelector(".ds-viewport")!;
          return {
            zoom: viewport.getAttribute("data-zoom"),
            x: viewport.getAttribute("data-pan-x"),
            y: viewport.getAttribute("data-pan-y"),
            view: document.querySelector(".ds-garments")!.getAttribute("data-view"),
            source: document.querySelector(".ds-garments img")!.getAttribute("src"),
          };
        });
      const before = await previewState();
      await toggle.click();
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "light");
      await expect(toggle).toHaveAccessibleName(copy.workspace.switchToDark);
      await expect(toggle.locator("svg")).toHaveAttribute("data-theme-icon", "moon");
      expect(await previewState()).toEqual(before);
      await expect(
        page.locator(".ds-theme-options, .ds-appearance [role=group], .ds-appearance [role=menu]"),
      ).toHaveCount(0);
      await toggle.click();
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "dark");
      await expect(toggle).toHaveAccessibleName(copy.workspace.switchToLight);
      await toggle.focus();
      await page.keyboard.press("Space");
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "light");
      await expect(toggle).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "dark");
      await expect(toggle).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(page.locator(".ds-header .language-switcher a:visible").first()).toBeFocused();
      await setStudioTheme(page, "light");
      await settle(page);
      await capture(page, `${locale}-${width}-light-topbar`);
      for (const view of ["front", "both"] as const) {
        await page.getByRole("button", { name: copy.workspace[view], exact: true }).click();
        await settle(page);
        await expect(page.locator(".ds-garments")).toHaveAttribute("data-view", view);
        await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "light");
        const buttons = await page.locator(".ds-view-control button").evaluateAll((els) =>
          els.map((el) => {
            const b = el.getBoundingClientRect(),
              icon = el.querySelector("svg")!.getBoundingClientRect();
            const label = [...el.querySelectorAll("span")].find((s) => s.getClientRects().length)!;
            return {
              height: b.height,
              y: b.y,
              width: b.width,
              icon: icon.height,
              lines:
                label.getBoundingClientRect().height /
                parseFloat(getComputedStyle(label).lineHeight),
            };
          }),
        );
        for (const b of buttons) {
          expect(b.height).toBeGreaterThanOrEqual(44);
          expect(b.y).toBe(buttons[0]!.y);
          expect(b.icon).toBe(20);
          expect(b.lines).toBeLessThanOrEqual(1.1);
        }
        await capture(page, `${locale}-${width}-light-${view}`);
      }
      await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".ds-appearance-toggle").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".ds-appearance-toggle svg")).toHaveCSS("animation-name", "none");
    await expect(page.locator(".ds-environment-light")).toHaveCSS("transition-duration", "0s");
    await writeFile(
      `${shots}/${locale}-preview-measurements.json`,
      JSON.stringify(measurements, null, 2),
    );
  });
  test(`${locale}: side width touch cancellation, outside dismissal and locale persistence`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/design-studio`);
    await page.locator("#ds-toggle-library").click();
    await page.locator(".ds-artwork-grid button").first().click();
    const inspected = await page.locator(".ds-artwork-detail h3").textContent();
    await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
    await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
    const camera = () =>
      page
        .locator(".ds-viewport")
        .evaluate((el) => [
          el.getAttribute("data-zoom"),
          el.getAttribute("data-pan-x"),
          el.getAttribute("data-pan-y"),
        ]);
    const originalCamera = await camera();
    for (const side of ["left", "right"] as const) {
      await page.locator(".ds-sheet-settings").click();
      await page
        .getByRole("button", {
          name: side === "left" ? copy.dockLeft : copy.dockRight,
          exact: true,
        })
        .click();
      await settle(page);
      expect(await camera()).toEqual(originalCamera);
      await page.locator(".ds-side-reveal").click();
      await expect(page.locator(".ds-artwork-detail h3")).toHaveText(inspected!);
      await page.locator(".ds-sheet-settings").click();
      await page.locator(".ds-sheet-width").click();
      await page.getByRole("slider", { name: copy.panelWidth }).focus();
      await page.keyboard.press("Home");
      await settle(page);
      const panel = page.locator("#ds-mobile-tools");
      const before = (await panel.boundingBox())!.width;
      const handle = (await page.locator(".ds-sheet-width").boundingBox())!;
      const x = handle.x + handle.width / 2,
        y = handle.y + handle.height / 2;
      const client = await page.context().newCDPSession(page);
      const touches = (dx: number) => [{ x: x + dx * (side === "left" ? 1 : -1), y, id: 1 }];
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: touches(0),
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: touches(45),
      });
      await expect(page.locator(".ds-page")).toHaveAttribute("data-resizing", "true");
      expect((await panel.boundingBox())!.width).toBeGreaterThan(before + 30);
      await client.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
      await expect(page.locator(".ds-page")).toHaveAttribute("data-resizing", "false");
      expect((await panel.boundingBox())!.width).toBeCloseTo(before, 0);
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: touches(0),
      });
      for (const dx of [10, 20, 30, 40])
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: touches(dx),
        });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await client.detach();
      await expect(panel).toBeVisible();
      expect((await panel.boundingBox())!.width).toBeCloseTo(before + 40, 0);
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "false");
      expect(await camera()).toEqual(originalCamera);
      await page.locator(".ds-sheet-settings").click();
      await page.locator(".ds-side-reveal").click();
      await settle(page);
      await capture(page, `${locale}-390-${side}-unpinned`);
      const point = await page
        .locator(".ds-garments img")
        .first()
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        });
      await page.mouse.click(point.x, point.y);
      await expect(panel).toBeHidden();
      await page.locator("#ds-toggle-inspector").click();
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "false");
      await page.locator(".ds-side-reveal").click();
      await expect(page.locator(".ds-artwork-detail h3")).toHaveText(inspected!);
      await page.locator(".ds-sheet-pin").click();
      await page.locator(".ds-sheet-close").click();
      await page.locator("#ds-toggle-inspector").click();
    }
    await page.locator(".ds-sheet-close").click();
    await setStudioTheme(page, "light");
    const other = locale === "en" ? "ar" : "en";
    await page.locator(`.ds-header .language-switcher a[lang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/design-studio$`));
    await page.locator("#ds-toggle-library").click();
    await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "right");
    await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "light");
    await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "false");
    await page.locator(".ds-side-reveal").click();
    await settle(page);
    expect((await page.locator("#ds-mobile-tools").boundingBox())!.width).toBeCloseTo(324, 0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    ).toBeLessThanOrEqual(1);
  });
}
