import { setStudioTheme } from "./studio-controls";
import { mkdir } from "node:fs/promises";
import { test, expect, type Page } from "./browser-test";
import { studioImagesReady } from "./studio-images";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

test.use({ hasTouch: true });
const shots = ".cache/phase-03/refinements";
async function settle(page: Page) {
  await studioImagesReady(page);
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
    )
    .toBe(0);
}
async function capture(page: Page, name: string) {
  await mkdir(shots, { recursive: true });
  await page.screenshot({ path: `${shots}/${name}.png`, animations: "allow" });
}
async function drag(page: Page, selector: string, dx: number, dy: number) {
  const box = (await page.locator(selector).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 8 });
  await page.mouse.up();
}

async function clickVisibleGarment(page: Page) {
  const point = await page
    .locator(".ds-garments img")
    .first()
    .evaluate((img) => {
      const box = img.getBoundingClientRect();
      for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
          const x = box.x + box.width * fx,
            y = box.y + box.height * fy;
          if (document.elementFromPoint(x, y) === img) return { x, y };
        }
      }
      return null;
    });
  expect(point, "A visible garment pixel must be reachable outside the panel").not.toBeNull();
  await page.mouse.click(point!.x, point!.y);
}

async function headerAlignment(page: Page, locale: "en" | "ar") {
  const buttons = page.locator(".ds-compact-panel-heading button");
  await expect(buttons).toHaveCount(6);
  const boxes = await buttons.evaluateAll((els) =>
    els.map((el) => {
      const b = el.getBoundingClientRect(),
        s = getComputedStyle(el);
      const icon = el.querySelector("svg")!.getBoundingClientRect();
      return {
        x: b.x,
        y: b.y,
        w: b.width,
        h: b.height,
        radius: s.borderRadius,
        padding: s.padding,
        iw: icon.width,
        ih: icon.height,
        ic: icon.y + icon.height / 2,
        name: el.getAttribute("aria-label"),
      };
    }),
  );
  const header = (await page.locator(".ds-compact-panel-heading").boundingBox())!;
  for (const [index, b] of boxes.entries()) {
    expect(b.w).toBe(44);
    expect(b.h).toBe(44);
    expect(b.y).toBe(boxes[0]!.y);
    expect(b.radius).toBe(boxes[0]!.radius);
    expect(b.padding).toBe(boxes[0]!.padding);
    expect(b.iw).toBe(18);
    expect(b.ih).toBe(18);
    expect(b.ic).toBe(b.y + b.h / 2);
    expect(b.name?.trim().length).toBeGreaterThan(0);
    expect(b.x).toBeGreaterThanOrEqual(header.x);
    expect(b.x + b.w).toBeLessThanOrEqual(header.x + header.width);
    if (index) {
      const previous = boxes[index - 1]!;
      expect(
        locale === "en" ? b.x - previous.x - previous.w : previous.x - b.x - b.w,
      ).toBeGreaterThanOrEqual(0);
    }
  }
}

for (const locale of ["en", "ar"] as const) {
  const copy = { en, ar }[locale].designStudio;
  test(`${locale}: universal mobile Pin survives docking, heights and unified header navigation`, async ({
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
      await page.context().clearCookies();
      await page.goto(`/${locale}/design-studio`);
      await page.locator("#ds-toggle-library").click();
      const panel = page.locator("#ds-mobile-tools"),
        pin = page.locator(".ds-sheet-pin");
      await settle(page);
      await expect(pin).toHaveAttribute("aria-pressed", "false");
      await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", "bottom");
      await headerAlignment(page, locale);
      await capture(page, `${locale}-${width}-library-unpinned`);
      // Native tab order follows the same two groups in both reading directions.
      await page.locator("#ds-sheet-heading").focus();
      for (const selector of [
        "#ds-toggle-library",
        "#ds-toggle-inspector",
        ".ds-sheet-pin",
        ".ds-sheet-position",
        ".ds-sheet-settings",
        ".ds-sheet-close",
      ]) {
        await page.keyboard.press("Tab");
        await expect(page.locator(selector)).toBeFocused();
      }
      await page.locator("#ds-toggle-inspector").click();
      await expect(page.locator("#ds-toggle-inspector")).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("#ds-toggle-library")).toHaveAttribute("aria-pressed", "false");
      await page.locator("#ds-toggle-inspector").click();
      await expect(panel).toBeVisible();
      await settle(page);
      await capture(page, `${locale}-${width}-properties-unpinned`);
      await page.locator("#ds-toggle-library").click();
      const beforePin = await panel.boundingBox();
      const cameraBefore = await page
        .locator(".ds-viewport")
        .evaluate((el) => [
          el.getAttribute("data-zoom"),
          el.getAttribute("data-pan-x"),
          el.getAttribute("data-pan-y"),
        ]);
      await pin.click();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      expect(await panel.boundingBox()).toEqual(beforePin);
      await clickVisibleGarment(page);
      await expect(panel).toBeVisible();
      await capture(page, `${locale}-${width}-below-pinned`);
      await page.locator("#ds-toggle-inspector").click();
      await page.locator(".ds-layers-tab").click();
      await expect(page.locator(".ds-layers")).toBeVisible();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      await headerAlignment(page, locale);
      await settle(page);
      await capture(page, `${locale}-${width}-properties-pinned`);
      await page.locator("#ds-toggle-library").click();
      expect(
        await page
          .locator(".ds-viewport")
          .evaluate((el) => [
            el.getAttribute("data-zoom"),
            el.getAttribute("data-pan-x"),
            el.getAttribute("data-pan-y"),
          ]),
      ).toEqual(cameraBefore);
      await capture(page, `${locale}-${width}-library-pinned`);
      for (const dock of ["top", "floating"] as const) {
        await page.locator(".ds-sheet-settings").click();
        await page
          .getByRole("button", { name: dock === "top" ? copy.dockTop : copy.floating, exact: true })
          .click();
        await settle(page);
        await expect(pin).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-dock", dock);
        await clickVisibleGarment(page);
        await expect(panel).toBeVisible();
        await headerAlignment(page, locale);
        await capture(page, `${locale}-${width}-${dock}-pinned`);
      }
      await drag(page, ".ds-sheet-position", -20, -35);
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      await capture(page, `${locale}-${width}-floating-after-drag`);
      await page.locator(".ds-sheet-settings").click();
      const compact = (await panel.boundingBox())!.height;
      await drag(page, ".ds-sheet-expand", 0, -70);
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      let previous = 0;
      for (const size of ["compact", "medium", "expanded"] as const) {
        await page.getByRole("button", { name: copy[`${size}Size`], exact: true }).click();
        await settle(page);
        const actual = (await panel.boundingBox())!.height;
        expect(actual).toBeGreaterThan(previous);
        previous = actual;
        if (size === "compact") expect(actual).toBeCloseTo(compact, 0);
        await expect(pin).toHaveAttribute("aria-pressed", "true");
      }
      await page.getByRole("button", { name: copy.compactSize, exact: true }).click();
      await page.locator(".ds-sheet-settings").click();
      await page.setViewportSize({ width: 844, height: 390 });
      for (const side of ["Left", "Right"] as const) {
        await page.locator(".ds-sheet-settings").click();
        await page.getByRole("button", { name: copy[`dock${side}`], exact: true }).click();
        await settle(page);
        await expect(pin).toHaveAttribute("aria-pressed", "true");
        await clickVisibleGarment(page);
        await expect(panel).toBeVisible();
        await headerAlignment(page, locale);
        expect(
          (await page.locator(".ds-garments img").first().boundingBox())!.height,
        ).toBeGreaterThanOrEqual(90);
        await capture(page, `${locale}-${width}-landscape-${side.toLowerCase()}-pinned`);
      }
      await page.setViewportSize({ width: width!, height: height! });
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.resetPanel, exact: true }).click();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      await setStudioTheme(page, "light");
      await settle(page);
      await headerAlignment(page, locale);
      await capture(page, `${locale}-${width}-below-pinned-light`);
      const beforeUnpin = await panel.boundingBox();
      await pin.click();
      await expect(pin).toHaveAttribute("aria-pressed", "false");
      expect(await panel.boundingBox()).toEqual(beforeUnpin);
      await clickVisibleGarment(page);
      await expect(panel).toBeHidden();
      await page.locator("#ds-toggle-library").click();
      await expect(pin).toHaveAttribute("aria-pressed", "false");
      await pin.click();
      await page.locator(".ds-sheet-close").click();
      await expect(panel).toBeHidden();
      await page.locator("#ds-toggle-library").click();
      await expect(pin).toHaveAttribute("aria-pressed", "false");
      await pin.click();
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await expect(page.locator("#ds-toggle-library")).toBeFocused();
      await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
      expect(
        await page.evaluate(() =>
          Math.max(
            document.documentElement.scrollWidth - innerWidth,
            document.documentElement.scrollHeight - innerHeight,
          ),
        ),
      ).toBeLessThanOrEqual(1);
    }
  });
  test(`${locale}: transition frames stay below glass and header through rapid high-zoom view changes`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/design-studio`);
    await settle(page);
    while (Number(await page.locator(".ds-viewport").getAttribute("data-zoom")) < 300)
      await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
    await page.locator(".ds-hand").click();
    await drag(page, ".ds-viewport", 0, -180);
    await settle(page);
    expect((await page.locator(".ds-garments img").first().boundingBox())!.y).toBeLessThan(
      (await page.locator(".ds-header").boundingBox())!.height,
    );
    await capture(page, `${locale}-desktop-under-header`);
    for (const theme of ["dark", "light"]) {
      await setStudioTheme(page, theme);
      for (const collapsed of [false, true]) {
        if (collapsed) await page.locator("#ds-desktop-library").click();
        await page.getByRole("button", { name: copy.workspace.front, exact: true }).click();
        await settle(page);
        for (const view of ["back", "both", "front"] as const) {
          // Pause the actual running crossfade on its first frame, never a
          // recreated mock. Screenshots below sample its real compositor state.
          await page.evaluate(async (index) => {
            document.querySelectorAll<HTMLButtonElement>(".ds-view-control button")[index]!.click();
            await new Promise<void>((resolve) => {
              const pause = () => {
                const animations = document
                  .querySelector(".ds-garment-scene")!
                  .getAnimations({ subtree: true });
                if (animations.length < 2) {
                  requestAnimationFrame(pause);
                  return;
                }
                animations.forEach((a) => {
                  a.pause();
                  a.currentTime = 0;
                });
                resolve();
              };
              requestAnimationFrame(pause);
            });
          }, ["front", "back", "both"].indexOf(view));
          for (const time of [40, 120, 200]) {
            await page.locator(".ds-garment-scene").evaluate(
              (el, t) =>
                el.getAnimations({ subtree: true }).forEach((a) => {
                  a.currentTime = t;
                }),
              time,
            );
            const layers = await page.evaluate(() => {
              const opacity = getComputedStyle(document.querySelector(".ds-garments")!).opacity;
              const panels = [...document.querySelectorAll(".ds-panel-host")].map((el) => {
                const b = el.getBoundingClientRect();
                return !!document
                  .elementFromPoint(b.x + b.width / 2, b.y + 24)
                  ?.closest(".ds-panel-host");
              });
              const header = document.querySelector(".ds-header")!;
              const h = header.getBoundingClientRect();
              return {
                opacity: Number(opacity),
                panels,
                header: !!document
                  .elementFromPoint(h.width / 2, h.height / 2)
                  ?.closest(".ds-header"),
                native: document
                  .getAnimations()
                  .some(
                    (a) =>
                      !!(a.effect as KeyframeEffect).pseudoElement?.includes("view-transition"),
                  ),
                blur: getComputedStyle(document.querySelector(".ds-properties")!).backdropFilter,
              };
            });
            expect(layers.opacity).toBeGreaterThan(0);
            expect(layers.opacity).toBeLessThan(1);
            expect(layers.panels).toEqual([true, true]);
            expect(layers.header).toBe(true);
            expect(layers.native).toBe(false);
            expect(layers.blur).toContain("blur");
            await capture(
              page,
              `${locale}-${theme}-${collapsed ? "collapsed" : "panels"}-${view}-${time}ms`,
            );
          }
          await page
            .locator(".ds-garment-scene")
            .evaluate((el) => el.getAnimations({ subtree: true }).forEach((a) => a.finish()));
          await expect(page.locator(".ds-garments-exit")).toHaveCount(0);
        }
        if (collapsed) await page.locator("#ds-desktop-library").click();
      }
    }
    await page.evaluate(async () => {
      for (const index of [0, 2, 1, 2, 0, 1, 2]) {
        document.querySelectorAll<HTMLButtonElement>(".ds-view-control button")[index]!.click();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (document.querySelectorAll(".ds-garments-exit").length > 1)
          throw new Error("Stale outgoing scene");
      }
    });
    await settle(page);
    await expect(page.locator(".ds-garments")).toHaveAttribute("data-view", "both");
    await expect(page.locator(".ds-garment img")).toHaveCount(2);
    await expect(page.locator(".ds-garments-exit")).toHaveCount(0);
    await expect(page.locator(".ds-header a").first()).toBeInViewport();
    expect(
      await page.evaluate(() =>
        Math.max(
          document.documentElement.scrollWidth - innerWidth,
          document.documentElement.scrollHeight - innerHeight,
        ),
      ),
    ).toBeLessThanOrEqual(1);
  });
  test(`${locale}: scoped selection and reduced-motion keyboard controls`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/design-studio`);
    await page.locator("#ds-toggle-library").click();
    await page.locator(".ds-sheet-settings").click();
    await page.getByRole("button", { name: copy.floating, exact: true }).click();
    await page.locator(".ds-sheet-pin").focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".ds-sheet-pin")).toHaveCSS("outline-style", "solid");
    await page.getByRole("button", { name: copy.workspace.front, exact: true }).click();
    await settle(page);
    await expect(page.locator(".ds-garments-exit")).toHaveCount(0);
    await expect(page.locator(".ds-view-indicator")).toHaveCSS("transition-duration", "0s");
    for (const selector of [
      ".ds-header h1",
      ".ds-view-control button",
      ".ds-zoom output",
      ".ds-sheet-position",
      ".ds-workflow",
    ])
      await expect(page.locator(selector).first()).toHaveCSS("user-select", "none");
    // Test-only editable fixtures verify the scope without shipping deferred tools.
    await page.evaluate(() => {
      const holder = document.createElement("div");
      holder.id = "selection-fixtures";
      holder.style.cssText =
        "position:fixed;top:120px;left:12px;z-index:10;background:white;color:black";
      holder.innerHTML =
        '<input aria-label="Selection input" value="select this text"><textarea aria-label="Selection textarea">select this text</textarea><div contenteditable="true" role="textbox" aria-label="Editable text"><span>select this text</span></div><p data-copyable>copy this data</p>';
      document.querySelector(".ds-page")!.append(holder);
    });
    for (const selector of ["input", "textarea", "[contenteditable] span", "[data-copyable]"])
      await expect(page.locator(`#selection-fixtures ${selector}`)).toHaveCSS(
        "user-select",
        "text",
      );
    for (const label of ["Selection input", "Selection textarea"]) {
      const input = page.getByRole("textbox", { name: label, exact: true });
      await input.focus();
      await page.keyboard.press("ControlOrMeta+A");
      expect(
        await input.evaluate((el: HTMLInputElement) => el.selectionEnd! - el.selectionStart!),
      ).toBe(16);
    }
    await page.getByRole("textbox", { name: "Editable text", exact: true }).focus();
    await page.keyboard.press("ControlOrMeta+A");
    expect(await page.evaluate(() => getSelection()?.toString())).toBe("select this text");
    await page.locator("#selection-fixtures").evaluate((el) => el.remove());
    await page.locator(".ds-sheet-settings").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".ds-sheet-settings")).toBeFocused();
    await expect(page.locator("#ds-mobile-tools")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#ds-mobile-tools")).toBeHidden();
  });
  test(`${locale}: pin lifecycle, touch cancellation, layout controls and reachable mobile tools`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => localStorage.removeItem("onyx-studio-panels-v1"));
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [768, 1024],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.context().clearCookies();
      await page.goto(`/${locale}/design-studio`);
      await page.locator("#ds-toggle-library").click();
      await settle(page);
      await capture(page, `${locale}-${width}-docked`);
      await page.locator(".ds-sheet-settings").click();
      await capture(page, `${locale}-${width}-settings`);
      await page.getByRole("button", { name: copy.floating, exact: true }).click();
      const panel = page.locator("#ds-mobile-tools");
      const pin = page.locator(".ds-sheet-pin");
      await expect(pin).toHaveAttribute("aria-pressed", "false");
      await expect(pin).toHaveAccessibleName(copy.pinPanel);
      await settle(page);
      await capture(page, `${locale}-${width}-floating`);
      await drag(page, ".ds-sheet-position", -30, -50);
      await expect(panel).toBeVisible();
      const unpinnedHandle = (await page.locator(".ds-sheet-position").boundingBox())!;
      const unpinnedPanel = (await panel.boundingBox())!;
      const unpinnedTouch = await page.context().newCDPSession(page);
      await unpinnedTouch.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: unpinnedHandle.x + 22, y: unpinnedHandle.y + 22, id: 1 }],
      });
      for (const dy of [-10, -20, -30])
        await unpinnedTouch.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: unpinnedHandle.x + 22, y: unpinnedHandle.y + 22 + dy, id: 1 }],
        });
      await unpinnedTouch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await unpinnedTouch.detach();
      await expect(panel).toBeVisible();
      expect((await panel.boundingBox())!.y).toBeLessThan(unpinnedPanel.y - 20);
      await expect(pin).toHaveAttribute("aria-pressed", "false");
      await pin.click();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      await expect(pin).toHaveAccessibleName(copy.unpinPanel);
      // Restore a low position so actual canvas pixels remain exposed above it.
      await page.locator(".ds-sheet-position").focus();
      await page.keyboard.press("Home");
      await page.keyboard.press("ArrowDown");
      await settle(page);
      const v = (await page.locator(".ds-viewport").boundingBox())!;
      const p = (await panel.boundingBox())!;
      const point = { x: v.x + v.width / 2, y: Math.min(p.y - 12, v.y + v.height / 2) };
      expect(
        await page.evaluate(
          ({ x, y }) => !!document.elementFromPoint(x, y)?.closest(".ds-viewport"),
          point,
        ),
      ).toBe(true);
      await page.mouse.click(point.x, point.y);
      await page.getByRole("button", { name: copy.workspace.zoomIn, exact: true }).click();
      await page.mouse.move(point.x, point.y);
      await page.mouse.wheel(0, -130);
      await expect
        .poll(async () => Number(await page.locator(".ds-viewport").getAttribute("data-zoom")))
        .toBeGreaterThan(125);
      await page.locator(".ds-hand").click();
      const pan = Number(await page.locator(".ds-viewport").getAttribute("data-pan-x"));
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await page.mouse.move(point.x + 25, point.y - 15, { steps: 5 });
      await page.mouse.up();
      await expect
        .poll(async () => Number(await page.locator(".ds-viewport").getAttribute("data-pan-x")))
        .not.toBe(pan);
      expect(await page.evaluate(() => getSelection()?.toString())).toBe("");
      for (const view of ["front", "back", "both"] as const) {
        await page.getByRole("button", { name: copy.workspace[view], exact: true }).click();
        await expect(panel).toBeVisible();
      }
      await setStudioTheme(page, "light");
      for (const tool of ["text", "upload", "shapes", "saved", "artwork"]) {
        await page.locator(`#ds-tool-${tool}`).tap();
        await expect(page.locator(`#ds-tool-${tool}`)).toHaveAttribute("aria-expanded", "true");
        await expect(pin).toHaveAttribute("aria-pressed", "true");
      }
      await page.locator("#ds-toggle-inspector").click();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      await page.locator("#ds-toggle-library").click();
      await page.locator(".ds-sheet-settings").click();
      await drag(page, ".ds-sheet-expand", 0, -60);
      await page.locator(".ds-sheet-settings").click();
      await drag(page, ".ds-sheet-position", 20, 35);
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      const beforeCancel = (await panel.boundingBox())!;
      const handle = (await page.locator(".ds-sheet-position").boundingBox())!;
      await page.locator(".ds-sheet-position").evaluate((el) => {
        el.addEventListener(
          "pointerdown",
          (event) => {
            if (event instanceof PointerEvent) el.dataset.testPointerId = String(event.pointerId);
          },
          { once: true },
        );
      });
      const client = await page.context().newCDPSession(page);
      const touch = (dy: number) => [{ x: handle.x + 22, y: handle.y + 22 + dy, id: 1 }];
      await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch(0) });
      await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touch(-35) });
      await expect(page.locator(".ds-page")).toHaveAttribute("data-resizing", "true");
      await client.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
      await expect(page.locator(".ds-page")).toHaveAttribute("data-resizing", "false");
      expect((await panel.boundingBox())!.y).toBeCloseTo(beforeCancel.y, 0);
      expect(
        await page
          .locator(".ds-sheet-position")
          .evaluate((el) => el.hasPointerCapture(Number(el.dataset.testPointerId))),
      ).toBe(false);
      // A second real touch drag commits its position after cancellation.
      await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touch(0) });
      for (const dy of [-10, -20, -30, -40])
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: touch(dy),
        });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await client.detach();
      await expect(panel).toBeVisible();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      const afterTouch = (await panel.boundingBox())!;
      expect(afterTouch.y).toBeLessThan(beforeCancel.y - 20);
      await settle(page);
      await capture(page, `${locale}-${width}-pinned-light`);
      const controls = await page
        .locator(".ds-compact-panel-heading button:visible, .ds-mobile-tabs button")
        .evaluateAll((els) =>
          els.map((el) => {
            const b = el.getBoundingClientRect();
            return { x: b.x, y: b.y, width: b.width, height: b.height };
          }),
        );
      for (const b of controls) {
        expect(b.width).toBeGreaterThanOrEqual(44);
        expect(b.height).toBeGreaterThanOrEqual(44);
        expect(b.x).toBeGreaterThanOrEqual(afterTouch.x);
        expect(b.x + b.width).toBeLessThanOrEqual(afterTouch.x + afterTouch.width);
      }
      for (let i = 0; i < controls.length; i++)
        for (let j = i + 1; j < controls.length; j++) {
          const a = controls[i]!,
            b = controls[j]!;
          expect(
            Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
              Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1,
          ).toBe(false);
        }
      await pin.click();
      await expect(pin).toHaveAttribute("aria-pressed", "false");
      expect((await panel.boundingBox())!.y).toBeCloseTo(afterTouch.y, 0);
      await page.mouse.click(v.x + 12, v.y + 12);
      await expect(panel).toBeHidden();
      await page.locator("#ds-toggle-library").click();
      await pin.click();
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.dockTop, exact: true }).click();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      await page.locator(".ds-sheet-settings").click();
      await page.getByRole("button", { name: copy.floating, exact: true }).click();
      await expect(pin).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: copy.closePanel, exact: true }).click();
      await expect(panel).toBeHidden();
      await page.locator("#ds-toggle-library").click();
      await pin.click();
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
      await expect(page.locator("#ds-toggle-library")).toBeFocused();
      await expect(page.locator(".ds-save-status")).toContainText(copy.notSaved);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
    }
  });
  test(`${locale}: floating drag release rejects delayed retargeted clicks`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/design-studio`);
    await page.locator("#ds-toggle-library").click();
    await page.locator(".ds-sheet-settings").click();
    await page.getByRole("button", { name: copy.floating, exact: true }).click();
    await settle(page);
    const before = (await page.locator("#ds-mobile-tools").boundingBox())!;
    // Real captured mouse gesture; replay the compatibility click after the
    // release task on the exposed canvas to deterministically exercise the race.
    await page.evaluate(() => {
      document.addEventListener(
        "click",
        function delay(event) {
          if (!event.isTrusted) return;
          document.removeEventListener("click", delay, true);
          event.stopImmediatePropagation();
          setTimeout(
            () =>
              document
                .querySelector(".ds-viewport")!
                .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 })),
            30,
          );
        },
        true,
      );
    });
    await drag(page, ".ds-sheet-position", -35, -80);
    await page.waitForTimeout(100);
    await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-open", "true");
    expect((await page.locator("#ds-mobile-tools").boundingBox())!.y).toBeLessThan(before.y - 40);
    await page.locator("#ds-tool-text").click();
    await expect(page.locator("#ds-tool-text")).toHaveAttribute("aria-expanded", "true");
    const viewport = (await page.locator(".ds-viewport").boundingBox())!;
    await page.mouse.click(viewport.x + 10, viewport.y + 10);
    await expect(page.locator("#ds-mobile-tools")).toBeHidden();
  });
}
