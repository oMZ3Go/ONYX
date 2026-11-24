import { test, expect, type Page, type Locator } from "./browser-test";
import en from "../messages/en.json";
import ar from "../messages/ar.json";
import type { Transform } from "../src/modules/design-studio/editor/document";
import { setStudioTheme } from "./studio-controls";
import { mkdir } from "node:fs/promises";

const copies = { en: en.designStudio, ar: ar.designStudio };
const hit = (page: Page) => page.locator(".ds-garments .ds-object-hit");
async function transform(locator: Locator): Promise<Transform> {
  return JSON.parse((await locator.getAttribute("data-transform"))!);
}

test.describe("mobile artwork", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
  for (const locale of ["en", "ar"] as const) {
    test(`${locale}: touch editing, pinch cancellation, dock navigation and stacked Both`, async ({
      page,
      context,
    }) => {
      test.setTimeout(120000);
      const copy = copies[locale];
      await page.goto(`/${locale}/design-studio`);
      await add(page, locale, true);
      const clip = page.getByRole("button", { name: copy.editor.clip, exact: true });
      const revisionBeforeClip = await page
        .locator(".ds-page")
        .getAttribute("data-document-revision");
      await clip.click();
      await expect(clip).toHaveAttribute("aria-pressed", "false");
      await clip.click();
      await expect(clip).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".ds-page")).toHaveAttribute(
        "data-document-revision",
        revisionBeforeClip!,
      );
      await page.locator(".ds-sheet-close").click();
      // A layout change cancels a gesture by contract. Start after the panel settles.
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
      const client = await context.newCDPSession(page);
      const touch = async (
        type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
        points: { x: number; y: number; id: number }[],
      ) => client.send("Input.dispatchTouchEvent", { type, touchPoints: points });
      let b = (await hit(page).boundingBox())!;
      const point = { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 1 };
      const original = await transform(hit(page));
      await touch("touchStart", [point]);
      await touch("touchMove", [{ ...point, x: point.x + 20, y: point.y + 10 }]);
      await touch("touchEnd", []);
      await expect
        .poll(async () => (await transform(hit(page))).centerX)
        .toBeGreaterThan(original.centerX);
      await expect(page.locator(".ds-page")).toHaveAttribute("data-undo-count", "2");
      const moved = await transform(hit(page));
      b = (await hit(page).boundingBox())!;
      const p = { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 1 };
      await touch("touchStart", [p]);
      await touch("touchMove", [{ ...p, x: p.x + 8 }]);
      await touch("touchStart", [
        { ...p, x: p.x + 8 },
        { ...p, id: 2, x: p.x + 60 },
      ]);
      for (let step = 1; step <= 4; step++)
        await touch("touchMove", [
          { ...p, x: p.x + 8 - step * 5 },
          { ...p, id: 2, x: p.x + 60 + step * 5 },
        ]);
      await touch("touchEnd", []);
      expect(await transform(hit(page))).toEqual(moved);
      await expect(page.locator(".ds-page")).toHaveAttribute("data-undo-count", "2");
      await expect
        .poll(async () => Number(await page.locator(".ds-viewport").getAttribute("data-zoom")))
        .toBeGreaterThan(100);
      await page.getByRole("button", { name: copy.workspace.fit, exact: true }).click();
      await page.locator("#ds-toggle-inspector").click();
      await number(page, copy.editor.rotationDeg, 20);
      const edited = await transform(hit(page));
      for (const [dock, label] of [
        ["left", copy.dockLeft],
        ["right", copy.dockRight],
        ["top", copy.dockTop],
        ["floating", copy.floating],
        ["bottom", copy.dockBottom],
      ]) {
        await page.locator(".ds-sheet-settings").click();
        await page.getByRole("button", { name: label!, exact: true }).click();
        await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", dock!);
        expect(await transform(hit(page))).toEqual(edited);
      }
      await page.locator(".ds-sheet-close").click();
      await page.locator(".ds-view-control button").nth(2).click();
      await page.getByRole("button", { name: copy.fullscreen, exact: true }).click();
      await expect(page.locator(".ds-garments")).toHaveAttribute("data-stacked", "true");
      await expect(hit(page)).toHaveCount(1);
      expect(await transform(hit(page))).toEqual(edited);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await client.detach();
    });
  }
});
async function move(page: Page, locator: Locator, dx: number, dy: number, finish = true) {
  const b = (await locator.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, { steps: 8 });
  if (finish) await page.mouse.up();
}
async function add(page: Page, locale: "en" | "ar", mobile = false) {
  const copy = copies[locale];
  if (mobile) await page.locator("#ds-toggle-library").click();
  await page.locator(".ds-artwork").first().click();
  await expect(hit(page)).toHaveCount(0);
  await page.getByRole("button", { name: copy.properties.add, exact: true }).click();
  await expect(hit(page)).toHaveCount(1);
  await expect(page.locator(".ds-garments .ds-artwork-render canvas")).toHaveCount(1);
  await expect
    .poll(() =>
      page.locator(".ds-garments .ds-artwork-render canvas").evaluate((canvas) => {
        const c = canvas as HTMLCanvasElement,
          data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        let colored = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i]! > 0) colored++;
        return colored;
      }),
    )
    .toBeGreaterThan(100);
  await mkdir(".cache/phase-03/editor", { recursive: true });
  await page.screenshot({
    path: `.cache/phase-03/editor/${locale}-${mobile ? "mobile" : "desktop"}.png`,
  });
}
async function number(page: Page, label: string, value: number) {
  const input = page.getByRole("spinbutton", { name: label, exact: true });
  await input.fill(String(value));
  await input.press("Enter");
}

for (const locale of ["en", "ar"] as const) {
  const copy = copies[locale];
  test(`${locale}: editor mouse placement, transforms, history and keyboard alternatives`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/design-studio`);
    await add(page, locale);
    const original = await transform(hit(page));
    const sizeInput = page.getByRole("spinbutton", { name: copy.editor.width, exact: true });
    await sizeInput.focus();
    await sizeInput.press("Tab");
    expect(await transform(hit(page))).toEqual(original);
    await expect(page.locator(".ds-page")).toHaveAttribute("data-undo-count", "1");
    await move(page, hit(page), 30, 15);
    await expect(hit(page)).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(async () => (await transform(hit(page))).centerX)
      .toBeGreaterThan(original.centerX);
    await expect(page.locator(".ds-page")).toHaveAttribute("data-undo-count", "2");
    await page.getByRole("button", { name: copy.workspace.undo, exact: true }).click();
    await expect.poll(() => transform(hit(page))).toEqual(original);
    await page.getByRole("button", { name: copy.workspace.redo, exact: true }).click();
    const moved = await transform(hit(page));
    await move(page, page.locator('[data-handle="se"]'), 18, 12);
    const resized = await transform(hit(page));
    expect(resized.width).toBeGreaterThan(moved.width);
    expect(resized.width / resized.height).toBeCloseTo(original.width / original.height);
    await move(page, page.locator('[data-handle="rotate"]'), 25, 15);
    await expect.poll(async () => (await transform(hit(page))).rotationDeg).not.toBe(0);
    await number(page, copy.editor.centerX, 900);
    await number(page, copy.editor.width, 250);
    await number(page, copy.editor.rotationDeg, 35);
    expect(await transform(hit(page))).toMatchObject({ centerX: 900, width: 250, rotationDeg: 35 });
    await hit(page).focus();
    await page.keyboard.down("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.up("ArrowRight");
    expect((await transform(hit(page))).centerX).toBeGreaterThan(900);
    await page
      .locator(".ds-transform-controls")
      .getByRole("button", { name: copy.editor.duplicate, exact: true })
      .click();
    await expect(hit(page)).toHaveCount(2);
    await page
      .locator(".ds-transform-controls")
      .getByRole("button", { name: copy.editor.delete, exact: true })
      .click();
    await expect(hit(page)).toHaveCount(1);
    await expect(page.locator(".ds-save-status")).toHaveText(copy.notSaved);
    expect(
      await page.evaluate(() =>
        Object.keys(localStorage).filter((key) => /project|artwork|history/i.test(key)),
      ),
    ).toEqual([]);
  });
  test(`${locale}: editor side isolation, layers, lock, visibility, alignment and locale navigation`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/design-studio`);
    await add(page, locale);
    const back = await transform(hit(page));
    await page.locator(".ds-view-control button").nth(0).click();
    await expect(hit(page)).toHaveCount(0);
    await page.getByRole("button", { name: copy.properties.add, exact: true }).click();
    await expect(hit(page)).toHaveCount(1);
    await number(page, copy.editor.centerX, 1000);
    await page.locator(".ds-view-control button").nth(2).click();
    await expect(hit(page)).toHaveCount(2);
    await expect(page.locator(".ds-garments-exit")).toHaveCount(0);
    expect(
      await transform(page.locator('.ds-garments [data-editor-side="back"] .ds-object-hit')),
    ).toEqual(back);
    await page
      .locator(".ds-transform-controls")
      .getByRole("button", { name: copy.editor.duplicate, exact: true })
      .click();
    await page.locator(".ds-editor-layer input").last().check();
    await page
      .locator(".ds-transform-controls")
      .getByRole("button", { name: copy.editor.center, exact: true })
      .click();
    const front = page.locator('.ds-garments [data-editor-side="front"] .ds-object-hit');
    expect((await transform(front.first())).centerX).toBe((await transform(front.last())).centerX);
    await page.getByRole("button", { name: copy.editor.sendBack, exact: true }).click();
    await page.locator(".ds-editor-layer button").first().click();
    await expect(page.locator('.ds-editor-layer[data-locked="true"]')).toHaveCount(1);
    await page.locator('.ds-editor-layer[data-locked="true"] button').first().click();
    await page.locator(".ds-editor-layer button").nth(1).click();
    await expect(page.locator('.ds-editor-layer[data-visible="false"]')).toHaveCount(1);
    await page.locator('.ds-editor-layer[data-visible="false"] button').nth(1).click();
    const geometry = await front.evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("data-transform")),
    );
    await setStudioTheme(page, "light");
    expect(
      await front.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-transform"))),
    ).toEqual(geometry);
    const other = locale === "en" ? "ar" : "en";
    await page.locator(`.language-switcher a[lang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/design-studio`));
    await expect(hit(page)).toHaveCount(3);
    expect(
      await front.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-transform"))),
    ).toEqual(geometry);
  });
  test(`${locale}: editor cancellation, one transaction, camera independence and redo branching`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/design-studio`);
    await add(page, locale);
    const original = await transform(hit(page));
    await move(page, hit(page), 20, 10, false);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    expect(await transform(hit(page))).toEqual(original);
    await expect(page.locator(".ds-page")).toHaveAttribute("data-undo-count", "1");
    await move(page, hit(page), 20, 10, false);
    await page
      .locator(".ds-garments .ds-editor-surface")
      .dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
    expect(await transform(hit(page))).toEqual(original);
    await move(page, hit(page), 20, 10, false);
    await page.locator(".ds-garments .ds-editor-surface").evaluate((el) => {
      if (el.hasPointerCapture(1)) el.releasePointerCapture(1);
    });
    await page.mouse.up();
    expect(await transform(hit(page))).toEqual(original);
    await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
    await page.getByRole("button", { name: copy.hand, exact: true }).click();
    await move(page, page.locator(".ds-viewport"), 50, 20);
    await expect(
      page.getByRole("spinbutton", { name: copy.editor.centerX, exact: true }),
    ).toHaveValue(String(original.centerX));
    await page.getByRole("button", { name: copy.workspace.fit, exact: true }).click();
    await page.getByRole("button", { name: copy.hand, exact: true }).click();
    expect(await transform(hit(page))).toEqual(original);
    await number(page, copy.editor.centerX, 950);
    await page.getByRole("button", { name: copy.workspace.undo, exact: true }).click();
    await number(page, copy.editor.centerX, 850);
    await expect(
      page.getByRole("button", { name: copy.workspace.redo, exact: true }),
    ).toBeDisabled();
  });
}
