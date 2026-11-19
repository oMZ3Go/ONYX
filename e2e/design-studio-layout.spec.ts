import { setStudioTheme } from "./studio-controls";
import { mkdir, writeFile } from "node:fs/promises";
import { test, expect, type Page } from "./browser-test";
import { studioImagesReady } from "./studio-images";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const captures = ".cache/phase-03/layout";
async function settled(page: Page) {
  await studioImagesReady(page);
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
    )
    .toBe(0);
}
async function capture(page: Page, name: string) {
  await settled(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await mkdir(captures, { recursive: true });
  await page.screenshot({ path: `${captures}/${name}.png`, animations: "allow" });
}
async function contained(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const element = document.querySelector<HTMLElement>(".ds-viewport")!;
        const viewport = element.getBoundingClientRect();
        const boxes = [...document.querySelectorAll(".ds-garment img")].map((image) =>
          image.getBoundingClientRect(),
        );
        // Fit still contains every garment. Inspection zoom intentionally clips
        // content; assert visibility and clipping at the workspace perimeter.
        if (
          Number(element.dataset.zoom) <= 100 &&
          Number(element.dataset.panX) === 0 &&
          Number(element.dataset.panY) === 0
        )
          return boxes.every(
            (b) =>
              b.width > 0 &&
              b.height > 0 &&
              b.left >= viewport.left - 1 &&
              b.right <= viewport.right + 1 &&
              b.top >= viewport.top - 1 &&
              b.bottom <= viewport.bottom + 1,
          );
        return (
          getComputedStyle(element).overflow === "visible" &&
          getComputedStyle(document.querySelector(".ds-layout")!).overflow === "visible" &&
          getComputedStyle(document.querySelector(".ds-page")!).overflow === "clip" &&
          boxes.some(
            (b) =>
              b.right > viewport.left &&
              b.left < viewport.right &&
              b.bottom > viewport.top &&
              b.top < viewport.bottom,
          )
        );
      }),
    )
    .toBe(true);
  expect(
    await page.evaluate(() =>
      Math.max(
        document.documentElement.scrollWidth - innerWidth,
        document.documentElement.scrollHeight - innerHeight,
      ),
    ),
  ).toBeLessThanOrEqual(1);
}
async function garment(page: Page) {
  return page
    .locator(".ds-garment img")
    .first()
    .evaluate((image: HTMLImageElement) => {
      const b = image.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = canvas.width,
        right = 0,
        top = canvas.height,
        bottom = 0;
      for (let y = 0; y < canvas.height; y++)
        for (let x = 0; x < canvas.width; x++) {
          if (pixels[(y * canvas.width + x) * 4 + 3]! < 16) continue;
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      return {
        image: { width: b.width, height: b.height },
        silhouette: {
          width: (b.width * (right - left + 1)) / canvas.width,
          height: (b.height * (bottom - top + 1)) / canvas.height,
        },
      };
    });
}
for (const locale of ["en", "ar"] as const) {
  const copy = { en, ar }[locale].designStudio;
  test(`${locale}: independent desktop and tablet panels preserve content and release width`, async ({
    page,
  }) => {
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width === 1024 ? 768 : 900 });
      await page.goto(`/${locale}/design-studio`);
      await settled(page);
      await capture(page, `${locale}-${width}-both-panels`);
      const before = await page.locator(".ds-center").boundingBox();
      await page.locator("#ds-tool-text").click();
      await page.locator("#ds-desktop-library").click();
      await settled(page);
      expect((await page.locator(".ds-center").boundingBox())!.width).toBeGreaterThan(
        before!.width + 180,
      );
      await expect(page.locator("#ds-library-panel")).toHaveAttribute("inert", "");
      await expect(page.locator("#ds-desktop-inspector")).toHaveAttribute("aria-expanded", "true");
      await capture(page, `${locale}-${width}-left-collapsed`);
      await page.locator("#ds-desktop-inspector").click();
      await capture(page, `${locale}-${width}-both-collapsed`);
      await contained(page);
      await page.locator("#ds-desktop-library").click();
      await expect(page.locator("#ds-tool-text")).toHaveAttribute("aria-expanded", "true");
      await capture(page, `${locale}-${width}-right-collapsed`);
      await page.locator("#ds-desktop-inspector").click();
      await settled(page);
      expect((await page.locator(".ds-center").boundingBox())!.width).toBeCloseTo(before!.width, 0);
      await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
      await contained(page);
    }
  });
  test(`${locale}: fullscreen preserves every view, appearance and layout with working zoom and keyboard exit`, async ({
    page,
  }) => {
    test.setTimeout(90000);
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.goto(`/${locale}/design-studio`);
      await setStudioTheme(page, "light");
      await page.locator(".ds-grid-toggle").click();
      if (width! >= 1000) await page.locator("#ds-desktop-library").click();
      else await page.locator("#ds-toggle-inspector").click();
      for (const view of ["front", "back", "both"] as const) {
        await page.getByRole("button", { name: copy.workspace[view], exact: true }).click();
        await settled(page);
        await page.locator("#ds-fullscreen").click();
        await expect(page.locator(".ds-page")).toHaveAttribute("data-focus", "true");
        await expect(page.locator("#ds-fullscreen")).toBeFocused();
        await expect(page.locator(".ds-header")).toBeHidden();
        await expect(page.locator(".ds-workflow")).toBeHidden();
        await expect(page.locator(".ds-garments")).toHaveAttribute("data-view", view);
        await expect(page.locator(".ds-garment img")).toHaveCount(view === "both" ? 2 : 1);
        await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "light");
        await expect(page.locator(".ds-center")).toHaveAttribute("aria-modal", "true");
        await settled(page);
        const zoom = page.locator(".ds-zoom output");
        await expect(zoom).toHaveText("100%");
        await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
        expect(parseInt(await zoom.innerText())).toBeGreaterThan(100);
        await contained(page);
        await page.getByRole("button", { name: copy.workspace.zoomOut, exact: true }).click();
        expect(parseInt(await zoom.innerText())).toBe(100);
        await page.getByRole("button", { name: copy.workspace.fit, exact: true }).click();
        await expect(zoom).toHaveText("100%");
        await capture(page, `${locale}-${width}-fullscreen-${view}`);
        await contained(page);
        await page.locator("#ds-fullscreen").focus();
        await page.keyboard.press("Tab");
        expect(
          await page
            .locator(".ds-canvas-bottom")
            .evaluate((el) => el.contains(document.activeElement)),
        ).toBe(true);
        if (view === "back")
          await page.getByRole("button", { name: copy.exitFullscreen, exact: true }).click();
        else await page.keyboard.press("Escape");
        await expect(page.locator(".ds-page")).toHaveAttribute("data-focus", "false");
        await expect(page.locator("#ds-fullscreen")).toBeFocused();
        await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
        await expect(page.locator(".ds-grid-toggle")).toHaveAttribute("aria-pressed", "true");
        if (width! >= 1000)
          await expect(page.locator("#ds-desktop-library")).toHaveAttribute(
            "aria-expanded",
            "false",
          );
        else await expect(page.locator("#ds-mobile-tools")).toBeVisible();
        await contained(page);
      }
    }
  });
  test(`${locale}: mobile header, measured garment, reversible sheet motion and rapid tools`, async ({
    page,
  }) => {
    const measurements = [];
    for (const [width, height] of [
      [320, 568],
      [390, 844],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.goto(`/${locale}/design-studio`);
      await settled(page);
      const boxes = await page.evaluate(() =>
        [
          ".ds-brand h1",
          ".ds-save-status",
          ".ds-brand a",
          ".ds-title-status",
          ".language-switcher",
        ].map((s) => {
          const b = document.querySelector(s)!.getBoundingClientRect();
          return { x: b.x, y: b.y, w: b.width, h: b.height };
        }),
      );
      const [title, status, logo, group, language] = boxes;
      expect(locale === "en" ? title!.x : title!.x + title!.w).toBeCloseTo(
        locale === "en" ? status!.x : status!.x + status!.w,
        0,
      );
      expect(logo!.y + logo!.h / 2).toBeCloseTo(group!.y + group!.h / 2, 0);
      expect(
        locale === "en"
          ? group!.x + group!.w <= language!.x
          : language!.x + language!.w <= group!.x,
      ).toBe(true);
      await capture(page, `${locale}-${width}-normal`);
      const closed = await garment(page);
      await page.locator("#ds-toggle-library").click();
      await expect
        .poll(() =>
          page
            .locator("#ds-mobile-tools")
            .evaluate((el) =>
              el.getAnimations().some((a) => a.effect?.getTiming().duration === 240),
            ),
        )
        .toBe(true);
      await capture(page, `${locale}-${width}-library`);
      const open = await garment(page);
      expect(open.image.height).toBeGreaterThanOrEqual(width === 320 ? 140 : 178);
      expect(open.silhouette.height).toBeGreaterThanOrEqual(width === 320 ? 135 : 168);
      measurements.push({ locale, width, height, closed, open });
      const sheet = page.locator("#ds-mobile-tools");
      await sheet.evaluate((el) => el.setAttribute("data-retained", "yes"));
      for (const tool of ["text", "upload", "shapes", "saved", "artwork", "text", "artwork"])
        await page.locator(`#ds-tool-${tool}`).evaluate((el: HTMLButtonElement) => el.click());
      await expect(page.locator("#ds-tool-artwork")).toHaveAttribute("aria-expanded", "true");
      await expect(sheet).toHaveAttribute("data-retained", "yes");
      await expect(page.locator("dialog[open]")).toHaveCount(1);
      await settled(page);
      const original = await sheet.boundingBox();
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.expandedSize, exact: true }).click();
      await settled(page);
      expect((await sheet.boundingBox())!.height).toBeGreaterThan(original!.height);
      await contained(page);
      await page.getByRole("button", { name: copy.compactSize, exact: true }).click();
      await settled(page);
      await page.locator(".ds-sheet-settings").click();
      await page.locator(".ds-library-tools").evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      expect(
        await page.locator(".ds-library-tools").evaluate((el) => el.scrollTop),
      ).toBeGreaterThan(0);
      await page.locator("#ds-toggle-inspector").click();
      await expect(sheet).toHaveAttribute("data-retained", "yes");
      await capture(page, `${locale}-${width}-properties`);
      await expect(page.locator(".ds-workflow-actions")).toBeInViewport({ ratio: 1 });
      await page.getByRole("button", { name: copy.closePanel, exact: true }).click();
      await expect
        .poll(() =>
          sheet.evaluate((el) => el.getAnimations().some((a) => a.playState === "running")),
        )
        .toBe(true);
      await expect(sheet).toBeHidden();
      await expect(page.locator("#ds-toggle-inspector")).toBeFocused();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.locator("#ds-toggle-library").click();
      await settled(page);
      expect(
        await sheet.evaluate(
          (el) => el.getAnimations().filter((a) => a.playState === "running").length,
        ),
      ).toBe(0);
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
    await writeFile(
      `${captures}/${locale}-measurements.json`,
      JSON.stringify(measurements, null, 2),
    );
  });
}
