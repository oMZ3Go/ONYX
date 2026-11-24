import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { test, expect, type Page } from "./browser-test";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const copies = { en: en.designStudio, ar: ar.designStudio };
async function settled(page: Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}
async function numeric(page: Page, label: string, value: number) {
  const input = page.getByRole("spinbutton", { name: label, exact: true });
  await input.fill(String(value));
  await input.press("Enter");
  await settled(page);
}
async function bitmap(page: Page) {
  await settled(page);
  return page.locator(".ds-garments canvas").evaluate((node) => {
    const c = node as HTMLCanvasElement,
      ctx = c.getContext("2d")!;
    return {
      png: c.toDataURL(),
      width: c.width,
      height: c.height,
      cssWidth: c.getBoundingClientRect().width,
      cssHeight: c.getBoundingClientRect().height,
      smoothing: ctx.imageSmoothingEnabled,
      quality: ctx.imageSmoothingQuality,
    };
  });
}
async function cropWhitePixels(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
  name: string,
) {
  const screenshot = await page.screenshot({
    clip,
    scale: "css",
    style: ".ds-selection-box,.ds-object-hit,.ds-context-toolbar{visibility:hidden!important}",
  });
  await test.info().attach(name, { body: screenshot, contentType: "image/png" });
  const { data, info } = await sharp(screenshot).raw().toBuffer({ resolveWithObject: true });
  let white = 0;
  for (let i = 0; i < data.length; i += info.channels)
    if (data[i]! > 180 && data[i + 1]! > 180 && data[i + 2]! > 180) white++;
  return white;
}
const hash = (png: string) =>
  createHash("sha256")
    .update(Buffer.from(png.split(",")[1]!, "base64"))
    .digest("hex");
for (const dpr of [1, 2])
  test.describe(`DPR ${dpr}`, () => {
    test.use({ deviceScaleFactor: dpr, reducedMotion: "reduce" });
    for (const locale of ["en", "ar"] as const) {
      test(`${locale}: original quality survives resizing, release, history, zoom and reconstruction`, async ({
        page,
      }, info) => {
        const copy = copies[locale],
          requests: string[] = [];
        page.on("request", (r) => {
          if (r.url().includes("print-crown")) requests.push(r.url());
        });
        await page.goto(`/${locale}/design-studio`);
        await page.locator(".ds-artwork").first().click();
        await page.getByRole("button", { name: copy.properties.add, exact: true }).click();
        await expect(page.locator(".ds-garments canvas")).toHaveCount(1);
        await expect.poll(async () => (await bitmap(page)).quality).toBe("high");
        await numeric(page, copy.editor.width, 300);
        const large = await bitmap(page);
        const hit = page.locator(".ds-garments .ds-object-hit");
        const beforeResize = (await hit.boundingBox())!;
        const handle = (await page.locator('[data-handle="se"]').boundingBox())!;
        await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
        await page.mouse.down();
        await page.mouse.move(handle.x + handle.width / 2 - 15, handle.y + handle.height / 2 - 15, {
          steps: 8,
        });
        const during = await bitmap(page);
        const live = (await hit.boundingBox())!;
        expect(live.width).toBeLessThan(beforeResize.width - 5);
        expect(live.width / live.height).toBeCloseTo(beforeResize.width / beforeResize.height, 2);
        expect(hash(during.png)).not.toBe(hash(large.png));
        await page.mouse.up();
        const released = await bitmap(page);
        expect((await hit.boundingBox())!.width).toBeCloseTo(live.width, 2);
        expect(hash(released.png)).toBe(hash(during.png));
        await numeric(page, copy.editor.width, 100);
        const small = await bitmap(page);
        expect(hash(small.png)).not.toBe(hash(released.png));
        await page.getByRole("button", { name: copy.workspace.undo, exact: true }).click();
        expect(hash((await bitmap(page)).png)).toBe(hash(released.png));
        await page.getByRole("button", { name: copy.workspace.redo, exact: true }).click();
        expect(hash((await bitmap(page)).png)).toBe(hash(small.png));
        await numeric(page, copy.editor.width, 250);
        const stable = await bitmap(page);
        for (const width of [90, 350, 110, 300, 250]) await numeric(page, copy.editor.width, width);
        expect(hash((await bitmap(page)).png)).toBe(hash(stable.png));
        await page.locator(".ds-view-control button").nth(0).click();
        await settled(page);
        await page.locator(".ds-view-control button").nth(1).click();
        await expect.poll(async () => hash((await bitmap(page)).png)).toBe(hash(stable.png));
        for (let i = 0; i < 4; i++)
          await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
        const zoomed = await bitmap(page);
        expect(zoomed.width / zoomed.cssWidth).toBeCloseTo(dpr, 1);
        expect(zoomed.width * zoomed.height).toBeLessThanOrEqual(4 * 1024 * 1024);
        expect(zoomed.quality).toBe("high");
        expect(zoomed.smoothing).toBe(true);
        await page.getByRole("button", { name: copy.fullscreen, exact: true }).click();
        await settled(page);
        const fullscreen = await bitmap(page);
        expect(fullscreen.width * fullscreen.height).toBeLessThanOrEqual(4 * 1024 * 1024);
        await page.getByRole("button", { name: copy.exitFullscreen, exact: true }).click();
        await page.getByRole("button", { name: copy.workspace.fit, exact: true }).click();
        await expect.poll(async () => hash((await bitmap(page)).png)).toBe(hash(stable.png));
        expect(
          requests.some((url) =>
            url.endsWith("/images/landing/design-studio/prints/print-crown.png"),
          ),
        ).toBe(true);
        expect(requests.filter((url) => url.endsWith("print-crown.png"))).toHaveLength(1);
        const folder = `.cache/phase-03/editor-quality/dpr-${dpr}-${locale}`;
        await mkdir(folder, { recursive: true });
        for (const [name, result] of Object.entries({
          large,
          during,
          released,
          small,
          stable,
          zoomed,
        }))
          await writeFile(
            `${folder}/${name}.png`,
            Buffer.from(result.png.split(",")[1]!, "base64"),
          );
        await writeFile(
          `${folder}/measurements.json`,
          JSON.stringify(
            {
              dpr,
              locale,
              requests,
              frames: Object.fromEntries(
                Object.entries({ large, during, released, small, stable, zoomed }).map(
                  ([name, { png, ...values }]) => [name, { ...values, sha256: hash(png) }],
                ),
              ),
            },
            null,
            2,
          ),
        );
        await page.screenshot({ path: `${folder}/screen.png` });
        await info.attach("rendering-measurements", {
          path: `${folder}/measurements.json`,
          contentType: "application/json",
        });
      });
      test(`${locale}: alpha silhouette clipping preserves editing, camera and history`, async ({
        page,
      }) => {
        const copy = copies[locale];
        await page.goto(`/${locale}/design-studio`);
        await page.locator(".ds-artwork").first().click();
        await page.getByRole("button", { name: copy.properties.add, exact: true }).click();
        await numeric(page, copy.editor.width, 250);
        await numeric(page, copy.editor.centerX, 150);
        await numeric(page, copy.editor.centerY, 120);
        const clip = page.getByRole("button", { name: copy.editor.clip, exact: true });
        await expect(clip).toHaveAttribute("aria-pressed", "true");
        const revision = await page.locator(".ds-page").getAttribute("data-document-revision"),
          undo = await page.locator(".ds-page").getAttribute("data-undo-count");
        const image = page.locator(".ds-garments .ds-garment-image");
        const white = async () => {
          const png = await image.screenshot({
            style:
              ".ds-selection-box,.ds-object-hit,.ds-context-toolbar{visibility:hidden !important}",
          });
          const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
          let count = 0;
          for (let y = 0; y < info.height * 0.35; y++)
            for (let x = 0; x < info.width * 0.2; x++) {
              const i = (y * info.width + x) * info.channels;
              if (data[i]! > 180 && data[i + 1]! > 180 && data[i + 2]! > 180) count++;
            }
          return count;
        };
        const clipped = await white();
        await clip.focus();
        await page.keyboard.press("Space");
        const unclipped = await white();
        expect(unclipped - clipped).toBeGreaterThan(20);
        expect(clipped).toBe(0);
        await expect(page.locator(".ds-page")).toHaveAttribute("data-document-revision", revision!);
        await expect(page.locator(".ds-page")).toHaveAttribute("data-undo-count", undo!);
        await clip.click();
        await expect(page.locator(".ds-garments .ds-object-hit")).toHaveCount(1);
        await page.getByRole("button", { name: copy.workspace.undo, exact: true }).click();
        await expect(clip).toHaveAttribute("aria-pressed", "true");
        await page.getByRole("button", { name: copy.workspace.redo, exact: true }).click();
        await numeric(page, copy.editor.centerX, 887);
        await numeric(page, copy.editor.centerY, 0);
        // This crop lies entirely above the PNG rectangle. It exposes a second,
        // accidental crop if disabling the silhouette keeps a garment-sized canvas.
        await clip.click();
        await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
        const viewport = page.locator(".ds-viewport");
        const view = (await viewport.boundingBox())!;
        const panDistance = Math.round(view.height / 5);
        await page.getByRole("button", { name: copy.hand, exact: true }).click();
        await page.mouse.move(view.x + 15, view.y + view.height / 2);
        await page.mouse.down();
        await page.mouse.move(view.x + 35, view.y + view.height / 2 + panDistance);
        await page.mouse.up();
        await expect
          .poll(async () => Number(await viewport.getAttribute("data-pan-y")))
          .toBeCloseTo(panDistance, 0);
        await settled(page);
        const unmaskedCanvas = (await image.locator("canvas").boundingBox())!;
        expect(unmaskedCanvas.x).toBeCloseTo(view.x, 0);
        expect(unmaskedCanvas.y).toBeCloseTo(view.y, 0);
        expect(unmaskedCanvas.width).toBeCloseTo(view.width, 0);
        await page.getByRole("button", { name: copy.hand, exact: true }).click();
        const garment = (await image.boundingBox())!;
        const hit = (await image.locator(".ds-object-hit").boundingBox())!;
        const top = Math.ceil(Math.max(view.y + 1, hit.y));
        const bottom = Math.floor(Math.min(view.y + view.height, garment.y - 1));
        expect(bottom - top).toBeGreaterThan(6);
        const crop = { x: hit.x, y: top, width: hit.width, height: bottom - top };
        const exposed = await cropWhitePixels(page, crop, "outside-garment-clip-off");
        await clip.click();
        expect(
          exposed - (await cropWhitePixels(page, crop, "outside-garment-clip-on")),
        ).toBeGreaterThan(20);
        await page.locator(".ds-view-control button").nth(2).click();
        await settled(page);
        for (const side of ["front", "back"])
          await expect(
            page.locator(`.ds-garments [data-editor-side="${side}"] .ds-artwork-render`),
          ).toHaveCSS("mask-image", new RegExp(`hoodie-black-${side}.png`));
        await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
        await settled(page);
        await expect(
          page.locator('.ds-garments [data-editor-side="back"] .ds-artwork-render'),
        ).toHaveCSS("mask-size", "100% 100%");
        await expect(page.locator(".ds-context-toolbar")).toBeVisible();
      });
    }
  });

test("Both view keeps unclipped artwork visible over the neighboring mockup", async ({ page }) => {
  const copy = copies.en;
  await page.goto("/en/design-studio");
  await page.locator(".ds-view-control button").nth(0).click();
  await page.locator(".ds-artwork").first().click();
  await page.getByRole("button", { name: copy.properties.add, exact: true }).click();
  await page.locator(".ds-view-control button").nth(2).click();
  await settled(page);
  const sides = page.locator(".ds-garments .ds-garment-image");
  const front = (await sides.nth(0).boundingBox())!;
  const back = (await sides.nth(1).boundingBox())!;
  const backCenterInFrontSpace = ((back.x + back.width / 2 - front.x) * 1774) / front.width;
  await numeric(page, copy.editor.width, 450);
  await numeric(page, copy.editor.centerX, Math.round(backCenterInFrontSpace));
  const crop = (await sides.nth(0).locator(".ds-object-hit").boundingBox())!;
  expect(crop.x).toBeGreaterThan(back.x);
  const clipped = await cropWhitePixels(page, crop, "both-sides-clip-on");
  await page.getByRole("button", { name: copy.editor.clip, exact: true }).click();
  const shown = await cropWhitePixels(page, crop, "both-sides-clip-off");
  expect(shown - clipped).toBeGreaterThan(20);
  await expect(sides.nth(1).locator(".ds-object-hit")).toHaveCount(0);
});

for (const locale of ["en", "ar"] as const)
  test(`${locale}: contextual icons use document commands and remain on screen`, async ({
    page,
  }) => {
    const copy = copies[locale];
    await page.goto(`/${locale}/design-studio`);
    await expect(page.locator(".ds-context-toolbar")).toHaveCount(0);
    await page.locator(".ds-artwork").first().click();
    await page.getByRole("button", { name: copy.properties.add, exact: true }).click();
    const toolbar = page.getByRole("toolbar", { name: copy.editor.contextActions });
    await expect(toolbar.getByRole("button")).toHaveCount(7);
    await page.locator(".ds-viewport").click({ position: { x: 5, y: 5 } });
    await expect(toolbar).toHaveCount(0);
    await page.locator(".ds-garments .ds-object-hit").click();
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveText("");
    expect((await toolbar.boundingBox())!.height).toBeLessThan(60);
    await expect(
      toolbar.getByRole("button", { name: copy.editor.forward, exact: true }),
    ).toBeDisabled();
    await numeric(page, copy.editor.centerX, 50);
    await toolbar.getByRole("button", { name: copy.editor.center, exact: true }).click();
    await expect(
      page.getByRole("spinbutton", { name: copy.editor.centerX, exact: true }),
    ).toHaveValue("887");
    await toolbar.getByRole("button", { name: copy.editor.duplicate, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".ds-garments .ds-object-hit")).toHaveCount(2);
    await toolbar.getByRole("button", { name: copy.editor.backward, exact: true }).click();
    await toolbar.getByRole("button", { name: copy.editor.lock, exact: true }).click();
    await expect(
      toolbar.getByRole("button", { name: copy.editor.delete, exact: true }),
    ).toBeDisabled();
    await toolbar.getByRole("button", { name: copy.editor.unlock, exact: true }).click();
    await page.getByRole("button", { name: copy.hand, exact: true }).click();
    await expect(toolbar).toHaveCount(0);
    await page.getByRole("button", { name: copy.hand, exact: true }).click();
    await expect(toolbar).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await settled(page);
    const a = (await toolbar.boundingBox())!,
      v = (await page.locator(".ds-viewport").boundingBox())!;
    expect(a.x).toBeGreaterThanOrEqual(v.x);
    expect(a.x + a.width).toBeLessThanOrEqual(v.x + v.width + 1);
    expect(a.y).toBeGreaterThanOrEqual(v.y);
    expect(a.y + a.height).toBeLessThanOrEqual(v.y + v.height + 1);
    await toolbar.getByRole("button", { name: copy.editor.delete, exact: true }).click();
    await expect(page.locator(".ds-garments .ds-object-hit")).toHaveCount(1);
  });
