import { setStudioTheme } from "./studio-controls";
import { mkdir } from "node:fs/promises";
import { test, expect, type Page } from "./browser-test";
import { studioImagesReady } from "./studio-images";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

test.use({ hasTouch: true });
const shots = ".cache/phase-03/final";
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
  await mkdir(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png` });
}
async function bounds(page: Page) {
  expect(
    await page.evaluate(() =>
      Math.max(
        document.documentElement.scrollWidth - innerWidth,
        document.documentElement.scrollHeight - innerHeight,
      ),
    ),
  ).toBeLessThanOrEqual(1);
  const panel = (await page.locator("#ds-mobile-tools").count())
    ? await page.locator("#ds-mobile-tools").boundingBox()
    : null;
  if (panel) {
    const main = await page.locator(".ds-layout").boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(main!.x);
    expect(panel.y).toBeGreaterThanOrEqual(main!.y);
    expect(panel.x + panel.width).toBeLessThanOrEqual(main!.x + main!.width + 1);
    expect(panel.y + panel.height).toBeLessThanOrEqual(main!.y + main!.height + 1);
  }
}
async function drag(page: Page, selector: string, dx: number, dy: number) {
  const box = await page.locator(selector).boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + dx, box!.y + box!.height / 2 + dy, { steps: 8 });
  await page.mouse.up();
}
for (const locale of ["en", "ar"] as const) {
  const copy = { en, ar }[locale].designStudio;
  test(`${locale}: continuous garment under glass, toolbar groups and accessible inspector split`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/design-studio`);
    await settled(page);
    for (const zoom of [150, 200, 300]) {
      while (Number(await page.locator(".ds-viewport").getAttribute("data-zoom")) < zoom)
        await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
      const image = await page.locator(".ds-garment img").boundingBox();
      const center = await page.locator(".ds-viewport").boundingBox();
      expect(image!.x).toBeLessThan(center!.x);
      expect(image!.x + image!.width).toBeGreaterThan(center!.x + center!.width);
      await expect(page.locator(".ds-viewport")).toHaveCSS("overflow", "visible");
      await expect(page.locator(".ds-layout")).toHaveCSS("overflow", "visible");
      await expect(page.locator(".ds-page")).toHaveCSS("overflow", "clip");
      await expect(page.locator(".ds-garment img")).toHaveCount(1);
      await expect(page.locator(".ds-garment img")).toHaveCSS("filter", "none");
      expect(
        await page
          .locator(".ds-library.ds-surface")
          .evaluate((el) => getComputedStyle(el).backdropFilter),
      ).toContain("blur");
      // Real pointer hits on panels must win over the garment underneath.
      await page.locator("#ds-tool-text").click();
      await page.locator("#ds-tool-artwork").click();
      await capture(page, `${locale}-overlap-${zoom}`);
    }
    await setStudioTheme(page, "light");
    await capture(page, `${locale}-overlap-light`);
    const split = page.getByRole("separator", { name: copy.resizeSplit, exact: true });
    const initial = Number(await split.getAttribute("aria-valuenow"));
    await drag(page, ".ds-inspector-divider", 0, -80);
    await expect
      .poll(async () => Number(await split.getAttribute("aria-valuenow")))
      .toBeLessThan(initial);
    await split.focus();
    await page.keyboard.press("End");
    await expect
      .poll(async () => split.getAttribute("aria-valuenow"))
      .toBe(await split.getAttribute("aria-valuemax"));
    await page.keyboard.press("Home");
    await expect
      .poll(async () => split.getAttribute("aria-valuenow"))
      .toBe(await split.getAttribute("aria-valuemin"));
    await page.keyboard.press("ArrowDown");
    const ratio = await split.getAttribute("aria-valuenow");
    await page.locator("#ds-desktop-inspector").click();
    await page.locator("#ds-desktop-inspector").click();
    await expect(split).toHaveAttribute("aria-valuenow", ratio!);
    await capture(page, `${locale}-inspector-split`);
    await expect(page.locator(".ds-camera-controls .ds-fit")).toBeVisible();
    await expect(page.locator(".ds-canvas-tools .ds-hand")).toBeVisible();
    await expect(page.locator(".ds-canvas-tools .ds-history button").first()).toBeDisabled();
    expect((await page.locator("#ds-workflow-note").boundingBox())!.height).toBeLessThanOrEqual(1);
    await expect(page.locator(".ds-save")).toBeDisabled();
    await expect(page.locator(".ds-continue")).toBeDisabled();
    await expect(page.locator(".ds-save")).toHaveAccessibleDescription(copy.deferred.workflow);
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 768 });
      await page.locator(".ds-fit").click();
      await page.getByRole("button", { name: copy.workspace.both, exact: true }).click();
      await settled(page);
      const buttons = await page.locator(".ds-view-control button").evaluateAll((els) =>
        els.map((el) => ({
          height: el.getBoundingClientRect().height,
          overflow: el.scrollWidth - el.clientWidth,
        })),
      );
      expect(new Set(buttons.map((b) => b.height)).size).toBe(1);
      expect(buttons.every((b) => b.overflow <= 1)).toBe(true);
      for (const selector of [".ds-properties", ".ds-layers"]) {
        expect((await page.locator(selector).boundingBox())!.height).toBeGreaterThanOrEqual(139);
        await expect(page.locator(selector)).toHaveCSS("overflow-y", "auto");
      }
      await bounds(page);
      await capture(page, `${locale}-${width}-both`);
    }
  });
  test(`${locale}: floating panels stay bounded and upper tool tabs work with mouse and touch`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [768, 1024],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.goto(`/${locale}/design-studio`);
      await page.locator("#ds-toggle-library").click();
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.dockTop, exact: true }).click();
      await expect(page.locator("#ds-panel-options")).toBeHidden();
      for (const section of ["text", "upload", "shapes", "saved", "artwork", "text", "artwork"]) {
        const tab = page.locator(`#ds-tool-${section}`);
        await tab.tap();
        await expect(tab).toHaveAttribute("aria-expanded", "true");
        const box = await tab.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        await expect(page.locator("#ds-mobile-tools")).toBeVisible();
      }
      await capture(page, `${locale}-${width}-above`);
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.floating, exact: true }).click();
      await expect(page.locator("#ds-mobile-tools")).toHaveAttribute("data-floating", "true");
      await settled(page);
      await bounds(page);
      const before = await page.locator("#ds-mobile-tools").boundingBox();
      await drag(page, ".ds-sheet-position", -50, -90);
      await settled(page);
      expect((await page.locator("#ds-mobile-tools").boundingBox())!.y).toBeLessThan(
        before!.y - 40,
      );
      await page.locator(".ds-sheet-position").focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowUp");
      await bounds(page);
      await capture(page, `${locale}-${width}-floating`);
      await page.locator("#ds-tool-upload").click();
      await page.locator("#ds-tool-artwork").click();
      await page.setViewportSize({ width: 844, height: 390 });
      await settled(page);
      await bounds(page);
      await page.setViewportSize({ width: width!, height: height! });
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.dockTop, exact: true }).click();
      await page.locator("#ds-tool-text").tap();
      await page.locator("#ds-tool-artwork").tap();
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.dockBottom, exact: true }).click();
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.resetPanel, exact: true }).click();
      await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "bottom");
      await bounds(page);
      await capture(page, `${locale}-${width}-below`);
      await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
    }
  });
}
