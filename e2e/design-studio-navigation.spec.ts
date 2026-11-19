import { setStudioTheme } from "./studio-controls";
import { mkdir } from "node:fs/promises";
import { test, expect, type Page } from "./browser-test";
import { studioImagesReady } from "./studio-images";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const shots = ".cache/phase-03/advanced";
async function settle(page: Page) {
  await studioImagesReady(page);
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
    )
    .toBe(0);
  // Entrance layout can select a larger responsive source after the first decode.
  await studioImagesReady(page);
}
async function capture(page: Page, name: string) {
  await settle(page);
  await mkdir(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png` });
}
async function camera(page: Page) {
  return page.locator(".ds-viewport").evaluate((el: HTMLElement) => ({
    zoom: Number(el.dataset.zoom),
    x: Number(el.dataset.panX),
    y: Number(el.dataset.panY),
  }));
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(() =>
      Math.max(
        document.documentElement.scrollWidth - innerWidth,
        document.documentElement.scrollHeight - innerHeight,
      ),
    ),
  ).toBeLessThanOrEqual(1);
  await expect(page.locator(".ds-layout")).toHaveCSS("overflow", "visible");
  await expect(page.locator(".ds-page")).toHaveCSS("overflow", "clip");
}
async function drag(page: Page, selector: string, dx: number, dy: number) {
  const b = await page.locator(selector).boundingBox();
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width / 2 + dx, b!.y + b!.height / 2 + dy, { steps: 8 });
  await page.mouse.up();
}
for (const locale of ["en", "ar"] as const) {
  const copy = { en, ar }[locale].designStudio;
  test(`${locale}: camera zooms beyond fit, anchors the pointer and pans both sides without page scroll`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/design-studio`);
    await settle(page);
    const viewport = page.locator(".ds-viewport"),
      box = await viewport.boundingBox();
    const anchor = { x: 60, y: 20 };
    await page.mouse.move(box!.x + box!.width / 2 + anchor.x, box!.y + box!.height / 2 + anchor.y);
    const before = await camera(page);
    await page.mouse.wheel(0, -180);
    await expect.poll(async () => (await camera(page)).zoom).toBeGreaterThan(150);
    const after = await camera(page);
    expect((anchor.x - after.x) / (after.zoom / 100)).toBeCloseTo(
      (anchor.x - before.x) / (before.zoom / 100),
      0,
    );
    await page.locator(".ds-hand").click();
    await expect(viewport).toHaveCSS("cursor", "grab");
    const start = await camera(page);
    await drag(page, ".ds-viewport", 60, 30);
    await expect.poll(async () => (await camera(page)).x).toBeCloseTo(start.x + 60, 0);
    await expect(viewport).toHaveCSS("cursor", "grab");
    await noOverflow(page);
    await setStudioTheme(page, "light");
    expect((await camera(page)).zoom).toBeCloseTo(after.zoom);
    await capture(page, `${locale}-camera-detail-light`);
    await page.locator(".ds-fit").click();
    await expect.poll(() => camera(page)).toEqual({ zoom: 100, x: 0, y: 0 });
    await page.getByRole("button", { name: copy.workspace.both, exact: true }).click();
    await settle(page);
    for (let i = 0; i < 8; i++)
      await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
    await expect(viewport).toHaveAttribute("data-zoom", "300");
    const content = await page.locator(".ds-zoom-content").boundingBox();
    expect(content!.width).toBeGreaterThan(box!.width);
    await drag(page, ".ds-viewport", -100, 40);
    await capture(page, `${locale}-camera-both-300`);
    await noOverflow(page);
    const normal = await camera(page);
    await page.locator("#ds-fullscreen").click();
    await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
    await drag(page, ".ds-viewport", 80, 20);
    await noOverflow(page);
    await page.keyboard.press("Escape");
    await expect.poll(() => camera(page)).toEqual(normal);
    await page.locator(".ds-fit").click();
    await page.locator(".ds-hand").click();
    await expect(viewport).toHaveAttribute("data-hand", "false");
    await drag(page, ".ds-viewport", 40, 20);
    await expect.poll(() => camera(page)).toEqual({ zoom: 100, x: 0, y: 0 });
    // Temporary pan belongs to the canvas; Space on a focused button still activates it.
    await page.locator(".ds-viewport").click();
    await page.keyboard.down("Space");
    await expect(viewport).toHaveAttribute("data-hand", "true");
    await drag(page, ".ds-viewport", 40, 20);
    await page.keyboard.up("Space");
    await expect(viewport).toHaveAttribute("data-hand", "false");
    expect((await camera(page)).x).toBeGreaterThan(30);
    await page.locator(".ds-fit").focus();
    await page.keyboard.press("Space");
    await expect.poll(() => camera(page)).toEqual({ zoom: 100, x: 0, y: 0 });
    await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
  });
  test(`${locale}: panel edges resize with pointer and keyboard, preserve preferences and clamp after reflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/design-studio`);
    await settle(page);
    const left = page.getByRole("separator", { name: copy.resizeLibrary }),
      right = page.getByRole("separator", { name: copy.resizeInspector, exact: true });
    const previous = Number(await right.getAttribute("aria-valuenow"));
    await drag(page, ".ds-library-host > .ds-panel-resizer", 70, 0);
    await expect(left).toHaveAttribute("aria-valuenow", "390");
    expect(Number(await right.getAttribute("aria-valuenow"))).toBe(previous);
    await right.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(right).toHaveAttribute("aria-valuenow", "336");
    await left.focus();
    await page.keyboard.press("Home");
    await expect(left).toHaveAttribute("aria-valuenow", "260");
    await page.keyboard.press("End");
    await expect(left).toHaveAttribute("aria-valuenow", "440");
    await page.locator("#ds-tool-text").click();
    await page.locator("#ds-desktop-library").click();
    await page.locator("#ds-desktop-library").click();
    await expect(left).toHaveAttribute("aria-valuenow", "440");
    await expect(page.locator("#ds-tool-text")).toHaveAttribute("aria-expanded", "true");
    await capture(page, `${locale}-resized-panels`);
    await page.reload();
    await expect(left).toHaveAttribute("aria-valuenow", "440");
    const other = locale === "en" ? "ar" : "en";
    await page.locator(`.ds-header a[lang="${other}"]`).click();
    await expect(page.locator(".ds-library-host > .ds-panel-resizer")).toHaveAttribute(
      "aria-valuenow",
      "440",
    );
    await settle(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await settle(page);
    await expect
      .poll(async () => (await page.locator(".ds-center").boundingBox())!.width)
      .toBeGreaterThanOrEqual(319);
    await noOverflow(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#ds-toggle-library").click();
    await expect(page.locator("#ds-mobile-tools")).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator(".ds-library-host > .ds-panel-resizer")).toHaveAttribute(
      "aria-valuenow",
      "440",
    );
  });
  test(`${locale}: mobile panel drag, size menu, docking, reset, rotation and canvas touch gestures`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/design-studio`);
    await page.locator("#ds-toggle-library").click();
    await settle(page);
    const sheet = page.locator("#ds-mobile-tools"),
      compact = (await sheet.boundingBox())!.height;
    await page.locator(".ds-sheet-settings").click();
    await drag(page, ".ds-sheet-expand", 0, -160);
    await settle(page);
    expect((await sheet.boundingBox())!.height).toBeGreaterThan(compact + 50);
    await page.getByRole("button", { name: copy.mediumSize, exact: true }).click();
    await settle(page);
    const medium = (await sheet.boundingBox())!.height;
    expect(medium).toBeGreaterThan(compact);
    await page.getByRole("button", { name: copy.resetPanel, exact: true }).click();
    await settle(page);
    expect((await sheet.boundingBox())!.height).toBeCloseTo(compact, 0);
    const handle = await page.locator(".ds-sheet-position").boundingBox();
    await drag(page, ".ds-sheet-position", 0, 100 - handle!.y);
    await settle(page);
    await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "top");
    expect((await sheet.boundingBox())!.y).toBeLessThan(
      (await page.locator(".ds-viewport").boundingBox())!.y,
    );
    await capture(page, `${locale}-mobile-top-panel`);
    await page.reload();
    await page.locator("#ds-toggle-library").click();
    await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "top");
    await page.setViewportSize({ width: 844, height: 390 });
    await settle(page);
    const landscape = await sheet.boundingBox();
    expect(landscape!.x).toBeGreaterThanOrEqual(0);
    expect(landscape!.y + landscape!.height).toBeLessThanOrEqual(390);
    expect(landscape!.x + landscape!.width).toBeLessThan(
      (await page.locator(".ds-viewport").boundingBox())!.x,
    );
    await page.getByRole("button", { name: copy.panelPosition, exact: true }).click();
    await page.getByRole("button", { name: copy.dockRight, exact: true }).click();
    await settle(page);
    expect((await sheet.boundingBox())!.x).toBeGreaterThan(
      (await page.locator(".ds-viewport").boundingBox())!.x,
    );
    await expect(page.locator("#ds-panel-options")).toBeHidden();
    await capture(page, `${locale}-mobile-landscape-panel`);
    await noOverflow(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: copy.panelPosition, exact: true }).click();
    await page.getByRole("button", { name: copy.resetPanel, exact: true }).click();
    await settle(page);
    const client = await page.context().newCDPSession(page),
      v = await page.locator(".ds-viewport").boundingBox();
    const cx = v!.x + v!.width / 2,
      cy = v!.y + v!.height / 2;
    const touches = (distance: number, dx = 0) => [
      { x: cx - distance + dx, y: cy, id: 1 },
      { x: cx + distance + dx, y: cy, id: 2 },
    ];
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touches(30) });
    for (const distance of [40, 50, 60, 70])
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: touches(distance, 20),
      });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => (await camera(page)).zoom).toBeGreaterThan(200);
    await expect(sheet).toBeVisible();
    await page.locator(".ds-hand").click();
    const before = await camera(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: cx, y: cy, id: 1 }],
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: cx + 45, y: cy + 20, id: 1 }],
    });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => (await camera(page)).x).toBeGreaterThan(before.x + 30);
    await page.locator(".ds-fit").click();
    await expect.poll(() => camera(page)).toEqual({ zoom: 100, x: 0, y: 0 });
    await noOverflow(page);
    await capture(page, `${locale}-mobile-restored`);
    await client.detach();
  });
}
for (const dpr of [1, 2])
  test(`fullscreen originals at DPR ${dpr} replace decoded previews without blanking and preserve alpha`, async ({
    browser,
    baseURL,
    browserErrors,
  }) => {
    const context = await browser.newContext({
      baseURL,
      deviceScaleFactor: dpr,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => browserErrors.push(error.stack || error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/hoodie-black-back.png", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/en/design-studio");
    await settle(page);
    const image = page.locator(".ds-garment img");
    await expect(image).toHaveAttribute("data-resolution", "preview");
    await page.locator("#ds-fullscreen").click();
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("data-resolution", "preview");
    expect(
      await image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    ).toBe(true);
    release();
    await expect(image).toHaveAttribute("data-resolution", "original");
    await studioImagesReady(page);
    expect(
      await image.evaluate((img: HTMLImageElement) => ({
        width: img.naturalWidth,
        height: img.naturalHeight,
        src: img.currentSrc,
      })),
    ).toMatchObject({ width: 1774, height: 887 });
    await expect(image).toHaveAttribute(
      "src",
      "/images/design-studio/hoodies/hoodie-black-back.png",
    );
    const pixels = await image.evaluate((img: HTMLImageElement) => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return {
        corner: ctx.getImageData(0, 0, 1, 1).data[3],
        middle: ctx.getImageData(887, 443, 1, 1).data[3],
      };
    });
    // The approved originals have alpha 253 at this fabric sample (verified from PNG bytes).
    expect(pixels).toEqual({ corner: 0, middle: 253 });
    await capture(page, `quality-dpr${dpr}-dark-fit`);
    for (let i = 0; i < 8; i++)
      await page
        .getByRole("button", { name: en.designStudio.workspace.zoomIn, exact: true })
        .click();
    await capture(page, `quality-dpr${dpr}-dark-300`);
    await page.keyboard.press("Escape");
    await setStudioTheme(page, "light");
    await page.getByRole("button", { name: en.designStudio.workspace.front, exact: true }).click();
    await settle(page);
    await page.locator("#ds-fullscreen").click();
    await expect(image).toHaveAttribute(
      "src",
      "/images/design-studio/hoodies/hoodie-black-front.png",
    );
    await capture(page, `quality-dpr${dpr}-light-fit`);
    for (let i = 0; i < 8; i++)
      await page
        .getByRole("button", { name: en.designStudio.workspace.zoomIn, exact: true })
        .click();
    await capture(page, `quality-dpr${dpr}-light-300`);
    await page.locator(".ds-fit").click();
    await page.setViewportSize({ width: 390, height: 844 });
    await capture(page, `quality-dpr${dpr}-mobile-fit`);
    expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1774);
    await context.close();
  });
