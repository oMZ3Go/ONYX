import { mkdir } from "node:fs/promises";
import { test, expect, type Page } from "./browser-test";
import { studioImagesReady } from "./studio-images";
import { setStudioTheme } from "./studio-controls";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const shots = ".cache/phase-03/scrollbars";
test.use({
  hasTouch: true,
  // Headless Chromium otherwise suppresses the very scrollbar being reviewed.
  launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] },
});

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
async function swipe(page: Page, selector: string) {
  const box = (await page.locator(selector).boundingBox())!;
  const client = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2;
  const y = box.y + box.height - 12;
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  for (let step = 1; step <= 8; step++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - step * 10, id: 1 }],
    });
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
const camera = (page: Page) =>
  page
    .locator(".ds-viewport")
    .evaluate((el) => [
      el.getAttribute("data-zoom"),
      el.getAttribute("data-pan-x"),
      el.getAttribute("data-pan-y"),
    ]);

for (const locale of ["en", "ar"] as const) {
  const copy = { en, ar }[locale].designStudio;
  test(`${locale}: native panel scrollbars adapt themes, preserve offsets and fit every dock`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => localStorage.removeItem("onyx-studio-panels-v1"));
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [768, 1024],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.goto(`/${locale}/design-studio`);
      await page.locator("#ds-toggle-library").click();
      await page.locator(".ds-sheet-settings").click();
      const settings = page.locator("#ds-panel-options");
      const retained = await settings.elementHandle();
      let previousColor = "";
      for (const theme of ["dark", "light"] as const) {
        await settings.evaluate((el) => (el.scrollTop = (el.scrollHeight - el.clientHeight) / 2));
        const offset = await settings.evaluate((el) => el.scrollTop);
        const contentWidth = await settings.evaluate((el) => el.clientWidth);
        await setStudioTheme(page, theme);
        await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-open", "true");
        expect(
          await retained!.evaluate((el) => el === document.querySelector("#ds-panel-options")),
        ).toBe(true);
        expect(await settings.evaluate((el) => el.scrollTop)).toBeCloseTo(offset, 0);
        expect(await settings.evaluate((el) => el.clientWidth)).toBe(contentWidth);
        await settle(page);
        const layout = await settings.evaluate((el) => {
          const style = getComputedStyle(el),
            r = el.getBoundingClientRect();
          const left = r.left + el.clientLeft + parseFloat(style.paddingLeft);
          const right = r.left + el.clientLeft + el.clientWidth - parseFloat(style.paddingRight);
          const controls = [...el.querySelectorAll("button, input")].filter(
            (n) => n.getClientRects().length,
          );
          return {
            color: style.scrollbarColor,
            thickness: style.scrollbarWidth,
            direction: style.direction,
            overflow: el.scrollWidth - el.clientWidth,
            scrollable: el.scrollHeight > el.clientHeight,
            inset: r.x - el.parentElement!.getBoundingClientRect().x,
            controlsFit: controls.every((n) => {
              const b = n.getBoundingClientRect();
              return b.left >= left - 1 && b.right <= right + 1;
            }),
          };
        });
        expect(layout.thickness).toBe("thin");
        expect(layout.color).not.toBe("auto");
        expect(layout.color).not.toBe(previousColor);
        previousColor = layout.color;
        expect(layout.direction).toBe(locale === "ar" ? "rtl" : "ltr");
        expect(layout.inset).toBeGreaterThanOrEqual(4);
        expect(layout.overflow).toBeLessThanOrEqual(1);
        expect(layout.controlsFit).toBe(true);
        expect(layout.scrollable).toBe(true);
        expect(offset).toBeGreaterThan(0);
        await settings.evaluate((el) => (el.scrollTop = 0));
        await capture(page, `${locale}-${width}-${theme}-settings-top`);
        await settings.evaluate((el, value) => (el.scrollTop = value), offset);
        await capture(page, `${locale}-${width}-${theme}-settings-middle`);
        await settings.evaluate((el) => (el.scrollTop = el.scrollHeight));
        await expect(
          settings.getByRole("button", { name: copy.resetPanel, exact: true }),
        ).toBeInViewport();
        await capture(page, `${locale}-${width}-${theme}-settings-bottom`);
      }
      if (width === 390) {
        for (const [dock, label] of [
          ["top", copy.dockTop],
          ["left", copy.dockLeft],
          ["right", copy.dockRight],
          ["floating", copy.floating],
        ] as const) {
          await settings.getByRole("button", { name: label, exact: true }).click();
          await page.locator(".ds-sheet-settings").click();
          await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", dock);
          await settings.evaluate((el) => (el.scrollTop = (el.scrollHeight - el.clientHeight) / 2));
          await settle(page);
          await capture(page, `${locale}-390-light-${dock}-settings`);
          await setStudioTheme(page, "dark");
          await settle(page);
          await capture(page, `${locale}-390-dark-${dock}-settings`);
          await setStudioTheme(page, "light");
          expect(
            await settings.evaluate((el) => el.scrollWidth - el.clientWidth),
          ).toBeLessThanOrEqual(1);
        }
      }
      if (width === 768) {
        await settings.getByRole("button", { name: copy.expandedSize, exact: true }).click();
        await settle(page);
        expect(await settings.evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
        await expect(settings).toHaveCSS("overflow-y", "auto");
        await capture(page, `${locale}-768-settings-content-fits`);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
    for (const [width, height] of [
      [1024, 768],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.goto(`/${locale}/design-studio`);
      for (const theme of ["dark", "light"] as const) {
        await setStudioTheme(page, theme);
        await settle(page);
        await capture(page, `${locale}-${width}-${theme}-desktop`);
      }
    }
  });

  test(`${locale}: native panel scrolling stays separate from touch dragging and tool replacement`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/design-studio`);
    await page.locator("#ds-toggle-library").click();
    await page.locator(".ds-sheet-pin").click();
    await page.locator(".ds-sheet-settings").click();
    await page.getByRole("button", { name: copy.floating, exact: true }).click();
    await page.locator(".ds-sheet-settings").click();
    await settle(page);
    const panel = page.locator("#ds-mobile-tools");
    const before = (await panel.boundingBox())!;
    const originalCamera = await camera(page);
    const settings = page.locator("#ds-panel-options");
    await settings.evaluate((el) => (el.scrollTop = 0));
    await swipe(page, "#ds-panel-options");
    await expect.poll(() => settings.evaluate((el) => el.scrollTop)).toBeGreaterThan(20);
    expect((await panel.boundingBox())!.x).toBe(before.x);
    expect((await panel.boundingBox())!.y).toBe(before.y);
    expect(await camera(page)).toEqual(originalCamera);
    await expect(page.locator(".ds-page")).toHaveAttribute("data-resizing", "false");
    await page.locator(".ds-sheet-settings").click();
    await settle(page);
    const library = page.locator(".ds-panel-dialog .ds-library-tools");
    await library.evaluate((el) => (el.scrollTop = 0));
    await swipe(page, ".ds-panel-dialog .ds-library-tools");
    await expect.poll(() => library.evaluate((el) => el.scrollTop)).toBeGreaterThan(10);
    expect((await panel.boundingBox())!.y).toBe(before.y);
    for (const theme of ["dark", "light"] as const) {
      await setStudioTheme(page, theme);
      await settle(page);
      await expect(library).toHaveCSS("scrollbar-width", "thin");
      await capture(page, `${locale}-390-${theme}-library-scrolled`);
    }
    for (const tool of ["upload", "text", "shapes", "saved", "artwork"] as const) {
      await page.locator(`#ds-tool-${tool}`).click();
      await expect(page.locator(`#ds-tool-${tool}`)).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(`#ds-tool-content-${tool}`)).toHaveAttribute(
        "aria-hidden",
        "false",
      );
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "floating");
      expect(await camera(page)).toEqual(originalCamera);
      expect(await panel.evaluate((el) => el.getAnimations().length)).toBe(0);
      await settle(page);
      expect(
        await page.locator(".ds-mobile-body:not([hidden])").evaluate(
          (el) =>
            [...el.querySelectorAll("*")].filter((n) => {
              const s = getComputedStyle(n);
              return (
                s.visibility !== "hidden" &&
                n.getClientRects().length &&
                /auto|scroll/.test(s.overflowY) &&
                n.scrollHeight > n.clientHeight + 1
              );
            }).length,
        ),
      ).toBeLessThanOrEqual(1);
    }
    await page.locator(".ds-artwork").first().click();
    const inspector = page.locator(".ds-panel-dialog .ds-inspector");
    await inspector.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(inspector).toHaveCSS("scrollbar-width", "thin");
    await capture(page, `${locale}-390-light-properties-scrolled`);
    await page.locator(".ds-layers-tab").click();
    await settle(page);
    await capture(page, `${locale}-390-light-layers`);
    const handle = (await page.locator(".ds-sheet-position").boundingBox())!;
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2 - 60, {
      steps: 5,
    });
    await page.mouse.up();
    expect((await panel.boundingBox())!.y).toBeLessThan(before.y - 40);
    await expect(panel).toBeVisible();
    await page.locator(".ds-sheet-pin").click();
    await page.locator(".ds-viewport").click({ position: { x: 4, y: 4 } });
    await expect(panel).toBeHidden();
  });
}
