import { test, expect, type Page } from "./browser-test";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

const ids = ["crown", "space", "nature", "dragon"] as const;
async function openStudio(page: Page, locale = "en") {
  await page.goto(`/${locale}#design-studio`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".studio-artworks").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator(".studio-scene img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
}
async function startClock(page: Page, locale = "en") {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStudio(page, locale);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".studio-scene")).toHaveAttribute("data-demo-eligible", "true");
}
async function hidden(page: Page, value: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
  }, value);
}

for (const [locale, copy] of [
  ["en", en.studio],
  ["ar", ar.studio],
] as const) {
  test(`${locale}: refined toolbar, clean palette, foreground brush and desktop steps`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openStudio(page, locale);
    const scene = page.locator(".studio-scene");
    const heroCursor = page.locator(".hero-copy .designer-cursor");
    const studioCursor = scene.locator(".studio-cursor");
    expect(await studioCursor.locator("svg").evaluate((svg) => svg.outerHTML)).toBe(
      await heroCursor.locator("svg").evaluate((svg) => svg.outerHTML),
    );
    for (const [selector, properties] of [
      ["", ["width", "height", "pointer-events"]],
      ["svg", ["width", "height", "transform"]],
      ["path", ["fill", "stroke", "stroke-width"]],
      ["span", ["width", "height", "left", "top", "border", "background-color", "box-shadow"]],
    ] as const) {
      const styles = async (cursor: typeof studioCursor) =>
        (selector ? cursor.locator(selector) : cursor).evaluate(
          (element, props) =>
            props.map((property) => getComputedStyle(element).getPropertyValue(property)),
          [...properties],
        );
      expect(await styles(studioCursor)).toEqual(await styles(heroCursor));
    }
    const imageTool = scene.getByRole("button", { name: copy.tools.image, exact: true });
    await expect(imageTool).toHaveAttribute("aria-pressed", "true");
    await expect(
      scene.getByRole("button", { name: copy.tools.artwork, exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await imageTool.focus();
    const tooltip = page.locator("#studio-tool-image");
    await expect(tooltip).toBeHidden();
    await imageTool.hover();
    await expect(tooltip).toBeVisible();
    await imageTool.click();
    await page.mouse.move(1, 1);
    await expect(tooltip).toBeHidden();
    await expect(imageTool).toBeFocused();
    await expect(scene).toHaveAttribute("data-active-artwork", "crown");
    await expect(tooltip).toHaveText(copy.tools.image);
    await expect(page.locator(".studio-availability")).toHaveCount(0);
    await expect(page.locator("#design-studio")).not.toContainText(
      locale === "en" ? "Full editor coming soon" : "الاستوديو الكامل قريبًا",
    );
    await expect(scene).not.toContainText(locale === "en" ? "Preview only" : "للمعاينة فقط");
    await expect(scene.locator(".studio-palette [title]")).toHaveCount(0);
    await expect(scene.locator(".studio-palette p")).toHaveCount(0);
    expect(
      await scene
        .locator(".studio-swatch > span")
        .evaluateAll((swatches) =>
          swatches.every((el) => getComputedStyle(el, "::after").content === "none"),
        ),
    ).toBe(true);
    await expect(scene.locator('[data-color="blue"]')).toBeDisabled();
    await expect(scene.locator(".studio-brush-foreground")).toHaveCSS("pointer-events", "none");
    await expect(scene.locator(".studio-brush-foreground")).toHaveCSS("opacity", "1");
    await expect(scene.locator(".studio-brush-foreground img")).toHaveCSS("filter", "none");
    await expect(scene.locator(".studio-brush-foreground img")).toHaveCSS(
      "mix-blend-mode",
      "normal",
    );
    expect(
      await scene.evaluate((element) => {
        const brush = element.querySelector(".studio-brush-foreground")!.getBoundingClientRect();
        const print = element.querySelector(".studio-print-region")!.getBoundingClientRect();
        const hoodie = element.querySelector(".studio-hoodie")!.getBoundingClientRect();
        return (
          brush.top > print.bottom && brush.top < hoodie.bottom && brush.bottom > hoodie.bottom
        );
      }),
    ).toBe(true);
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      const step = page.locator(".studio-steps li").nth(1).locator("p");
      expect(
        await step.evaluate(
          (el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight),
        ),
      ).toBeLessThan(1.1);
    }
    const cta = page.locator(".studio-cta");
    await cta.hover();
    await expect(cta).toHaveCSS("transform", "none");
  });
  test(`${locale}: studio selection, keyboard, rapid changes and honest editor CTA`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openStudio(page, locale);
    const scene = page.locator(".studio-scene");
    await expect(scene).toHaveAttribute("data-active-artwork", "crown");
    for (const id of ids) {
      const button = page.getByRole("button", { name: copy.artworks[id], exact: true });
      await button.focus();
      await page.keyboard.press(id === "space" ? "Space" : "Enter");
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(scene).toHaveAttribute("data-active-artwork", id);
      await expect(scene.locator(`.studio-print[data-artwork="${id}"]`)).toHaveAttribute(
        "data-visible",
        "true",
      );
      await expect(scene.locator("[aria-live]")).toHaveText(
        `${copy.selected}: ${copy.artworks[id]}`,
      );
    }
    await scene.locator("[data-studio-option]").evaluateAll((buttons) => {
      for (const index of [2, 0, 3, 1, 3]) (buttons[index] as HTMLButtonElement).click();
    });
    await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
    await expect(scene.locator('.studio-print[data-visible="true"]')).toHaveCount(1);
    await expect(scene.locator(".studio-cursor")).toBeHidden();
    await expect(scene.locator('[data-color="blue"]')).toBeDisabled();
    await expect(scene.locator('[data-color="navy"]')).toHaveAttribute("aria-pressed", "true");
    await expect(scene.locator(".studio-hoodie")).toHaveAttribute("src", /hoodie-back-navy/);
    await page.locator(".studio-cta").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/${locale}/design-studio$`));
    await expect(page.locator(".ds-canvas")).toBeVisible();
  });

  test(`${locale}: studio cursor loops through measured targets and resumes after keyboard selection`, async ({
    page,
  }) => {
    await startClock(page, locale);
    const scene = page.locator(".studio-scene");
    await page.clock.runFor(4999);
    await expect(scene).toHaveAttribute("data-active-artwork", "crown");
    await page.clock.runFor(1);
    await expect(scene).toHaveAttribute("data-demo-phase", "approach");
    const error = await scene.evaluate((element) => {
      const button = element.querySelector<HTMLElement>('[data-studio-option="1"]')!;
      const cursor = element.querySelector<HTMLElement>(".studio-cursor")!;
      return Math.max(
        Math.abs(
          parseFloat(cursor.style.left) +
            (element.getAttribute("data-locale") === "ar" ? 23 : 2) -
            button.offsetLeft -
            button.offsetWidth / 2,
        ),
        Math.abs(parseFloat(cursor.style.top) + 2 - button.offsetTop - button.offsetHeight / 2),
      );
    });
    expect(error).toBeLessThan(1);
    await page.clock.runFor(960);
    await expect(scene).toHaveAttribute("data-demo-phase", "click");
    await expect(scene).toHaveAttribute("data-active-artwork", "space");
    expect(
      await scene.evaluate((element) => {
        const cursor = element.querySelector(".studio-cursor")!.getBoundingClientRect();
        const button = element.querySelector('[data-studio-option="1"]')!.getBoundingClientRect();
        return Math.max(
          Math.abs(
            cursor.x +
              (element.getAttribute("data-locale") === "ar" ? 23 : 2) -
              button.x -
              button.width / 2,
          ),
          Math.abs(cursor.y + 2 - button.y - button.height / 2),
        );
      }),
    ).toBeLessThan(1);
    await expect(scene.locator("[aria-live]")).toBeEmpty();
    const pulse = await scene.locator(".studio-cursor > span").evaluate((ring) => {
      const animation = ring.getAnimations()[0]!;
      animation.pause();
      animation.currentTime = 105;
      const style = getComputedStyle(ring);
      return {
        duration: animation.effect!.getTiming().duration,
        opacity: Number(style.opacity),
        scale: new DOMMatrixReadOnly(style.transform).m11,
      };
    });
    expect(pulse.duration).toBe(210);
    expect(pulse.opacity).toBeCloseTo(0.375, 2);
    expect(pulse.scale).toBeCloseTo(0.925, 2);
    for (const id of ["nature", "dragon", "crown"]) {
      await page.clock.runFor(6180);
      await expect(scene).toHaveAttribute("data-active-artwork", id);
    }
    const nature = scene.locator('[data-studio-option="2"]');
    await nature.focus();
    await page.keyboard.press("Enter");
    await expect(scene).toHaveAttribute("data-active-artwork", "nature");
    await page.clock.runFor(4999);
    await expect(scene).toHaveAttribute("data-demo-phase", "idle");
    await page.clock.runFor(961);
    await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
    await expect(nature).toBeFocused();
    await expect(scene.locator("[aria-live]")).toHaveText(
      `${copy.selected}: ${copy.artworks.nature}`,
    );
    await hidden(page, true);
    await page.clock.runFor(20_000);
    await hidden(page, false);
    await page.clock.runFor(4999);
    await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
    await expect(scene).toHaveAttribute("data-demo-phase", "idle");
    await page.clock.runFor(961);
    await expect(scene).toHaveAttribute("data-active-artwork", "crown");
  });

  test(`${locale}: studio geometry remains anchored across mobile, tablet, desktop and zoom layouts`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openStudio(page, locale);
    for (const [width, height] of [
      [320, 780],
      [390, 844],
      [600, 900],
      [768, 1000],
      [844, 390],
      [1024, 900],
      [1199, 900],
      [1280, 900],
      [1440, 1000],
      [1920, 1080],
      [720, 500],
    ]) {
      await page.setViewportSize({ width: width!, height: height! });
      await page.locator(".studio-artworks").scrollIntoViewIfNeeded();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      ).toBeLessThanOrEqual(1);
      const scene = page.locator(".studio-scene");
      const offer = (await page.locator("#offers .offer-frame").boundingBox())!;
      const studio = (await page.locator(".studio-panel").boundingBox())!;
      expect(Math.abs(studio.x - offer.x), `${locale} ${width}px left edge`).toBeLessThan(1);
      expect(
        Math.abs(studio.x + studio.width - offer.x - offer.width),
        `${locale} ${width}px right edge`,
      ).toBeLessThan(1);
      await expect(scene.locator(".studio-brush-foreground")).toHaveCSS("opacity", "1");
      if (width! > 600 && width! < 1024) {
        const brush = (await scene.locator(".studio-brush-foreground").boundingBox())!;
        const steps = (await page.locator(".studio-steps").boundingBox())!;
        expect(brush.y + brush.height).toBeLessThan(steps.y);
      }
      const hoodie = await scene.locator(".studio-hoodie").boundingBox();
      const region = await scene.locator(".studio-print-region").boundingBox();
      expect(Math.abs((region!.x - hoodie!.x) / hoodie!.width - 0.34)).toBeLessThan(0.002);
      expect(Math.abs((region!.y - hoodie!.y) / hoodie!.height - 0.31)).toBeLessThan(0.002);
      const selector = (await scene.locator(".studio-artworks").boundingBox())!;
      const overlapX = Math.max(
        0,
        Math.min(region!.x + region!.width, selector.x + selector.width) -
          Math.max(region!.x, selector.x),
      );
      const overlapY = Math.max(
        0,
        Math.min(region!.y + region!.height, selector.y + selector.height) -
          Math.max(region!.y, selector.y),
      );
      expect(
        overlapX * overlapY,
        `selector must not cover the print at ${width}px`,
      ).toBeLessThanOrEqual(1);
      for (const button of await scene.locator("[data-studio-option]").all()) {
        const box = (await button.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width!);
        expect(
          await button.evaluate((element) => {
            const r = element.getBoundingClientRect();
            return element.contains(
              document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
            );
          }),
        ).toBe(true);
      }
      await expect(scene.locator(".studio-hoodie")).toHaveCSS("transform", "none");
      if ([320, 390, 768, 1024, 1440, 1920].includes(width!)) {
        await page.locator("#design-studio").screenshot({
          path: testInfo.outputPath(`${locale}-${width}.png`),
          style: ".site-header, .site-header *, .skip-link { visibility: hidden !important; }",
        });
      }
    }
  });
}

test("only selector hover hides the cursor and prevents conflicting automatic clicks", async ({
  page,
}) => {
  await startClock(page);
  const scene = page.locator(".studio-scene");
  const cursor = scene.locator(".studio-cursor");
  const selector = scene.locator(".studio-selector-label");
  await expect(cursor).toHaveCSS("opacity", "1");
  await page.clock.runFor(5100);
  await expect(scene).toHaveAttribute("data-demo-phase", "approach");
  await selector.hover({ force: true });
  await expect(scene).toHaveAttribute("data-demo-hovered", "true");
  await expect(cursor).toHaveCSS("opacity", "0");
  await expect(scene).toHaveAttribute("data-demo-phase", "idle");
  await page.clock.runFor(20_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "crown");
  await scene.locator('[data-studio-option="2"]').click({ force: true });
  await page.clock.runFor(1000);
  await page.mouse.move(1, 1);
  await expect(cursor).toHaveCSS("opacity", "1");
  await page.clock.runFor(3999);
  await expect(scene).toHaveAttribute("data-active-artwork", "nature");
  await expect(scene).toHaveAttribute("data-demo-phase", "idle");
  await page.clock.runFor(1);
  await expect(scene).toHaveAttribute("data-demo-phase", "approach");
  await page.clock.runFor(960);
  await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
  for (const element of [".studio-hoodie", ".studio-tools", ".studio-palette", ".studio-cta"]) {
    await page.locator(element).hover({ force: true });
    await expect(scene).toHaveAttribute("data-demo-eligible", "true");
    await expect(scene).not.toHaveAttribute("data-demo-hovered", "true");
    await expect(cursor).toHaveCSS("opacity", "1");
  }
  await page.clock.runFor(6179);
  await expect(scene).toHaveAttribute("data-demo-phase", "hover");
  await selector.hover({ force: true });
  await page.clock.runFor(20_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
  for (let index = 0; index < 3; index++) {
    await page.mouse.move(1, 1);
    await page.clock.runFor(0);
    await expect(scene).toHaveAttribute("data-demo-phase", "approach");
    await selector.hover({ force: true });
    await page.clock.runFor(1000);
    await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
  }
  await page.mouse.move(1, 1);
  await page.clock.runFor(720);
  await expect(scene).toHaveAttribute("data-demo-phase", "hover");
  await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
  await page.clock.runFor(240);
  await expect(scene).toHaveAttribute("data-active-artwork", "crown");
});

test("studio pauses for global pause, document visibility, offscreen, reduced motion and resize", async ({
  page,
}) => {
  await startClock(page);
  const scene = page.locator(".studio-scene");
  await page.clock.runFor(5100);
  await hidden(page, true);
  await expect(scene).toHaveAttribute("data-demo-eligible", "false");
  await expect(scene).toHaveAttribute("data-demo-phase", "idle");
  await page.clock.runFor(30_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "crown");
  await hidden(page, false);
  await expect(scene).toHaveAttribute("data-demo-eligible", "true");
  await page.clock.runFor(5100);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(scene).toHaveAttribute("data-demo-phase", "idle");
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(scene).toHaveAttribute("data-demo-eligible", "false");
  await page.clock.runFor(30_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "crown");
  await page.locator(".studio-artworks").scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-demo-eligible", "true");
  // Real site-wide button, without scrolling the scene out of view to reach the footer.
  await page.locator(".motion-toggle").evaluate((button: HTMLButtonElement) => button.click());
  await expect(scene).toHaveAttribute("data-demo-eligible", "false");
  expect(
    await scene
      .locator("[data-float]")
      .evaluateAll((layers) =>
        layers.every((layer) => layer.getAnimations().every((a) => a.playState === "paused")),
      ),
  ).toBe(true);
  await page.clock.runFor(30_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "crown");
  await page.locator(".motion-toggle").evaluate((button: HTMLButtonElement) => button.click());
  await expect(scene).toHaveAttribute("data-demo-eligible", "true");
  await page.clock.runFor(5960);
  await expect(scene).toHaveAttribute("data-active-artwork", "space");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveAttribute("data-demo-eligible", "false");
  await page.clock.runFor(30_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "space");
  expect(
    await scene
      .locator("[data-float]")
      .evaluateAll((layers) => layers.every((layer) => layer.getAnimations().length === 0)),
  ).toBe(true);
});

test("touch selection restarts the demo without creating a sticky hover", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await startClock(page, "ar");
  const scene = page.locator(".studio-scene");
  await expect(scene).toHaveAttribute("data-demo-eligible", "true");
  for (const [index, id] of ids.entries()) {
    await scene.locator(`[data-studio-option="${index}"]`).tap();
    await expect(scene).toHaveAttribute("data-active-artwork", id);
  }
  await expect(scene).not.toHaveAttribute("data-demo-hovered", "true");
  await page.clock.runFor(4999);
  await expect(scene).toHaveAttribute("data-active-artwork", "dragon");
  await expect(scene).toHaveAttribute("data-demo-phase", "idle");
  await page.clock.runFor(961);
  await expect(scene).toHaveAttribute("data-active-artwork", "crown");
  await expect(scene.locator(".studio-cursor")).toHaveCSS("pointer-events", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await scene.locator('[data-studio-option="2"]').tap();
  await page.clock.runFor(30_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "nature");
  expect(errors).toEqual([]);
  await context.close();
});

test("studio crossfades survive rapid input and the print follows the floating garment", async ({
  page,
}, testInfo) => {
  await startClock(page);
  const scene = page.locator(".studio-scene");
  const garment = scene.locator(".studio-garment");
  await expect
    .poll(() => garment.evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe("running");
  const initialTransform = await garment.evaluate((el) => getComputedStyle(el).transform);
  await expect
    .poll(() => garment.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(initialTransform);
  for (const id of ids) {
    await scene.locator(`[data-studio-option="${ids.indexOf(id)}"]`).click({ force: true });
    const print = scene.locator(`.studio-print[data-artwork="${id}"]`);
    await expect(print).toHaveCSS("opacity", "0.93");
    expect(
      await print.evaluate((element) => {
        const region = element.parentElement!.getBoundingClientRect();
        const image = element.querySelector("img")!.getBoundingClientRect();
        return Math.max(
          region.left - image.left,
          region.top - image.top,
          image.right - region.right,
          image.bottom - region.bottom,
        );
      }),
      `${id} must stay inside the print region`,
    ).toBeLessThanOrEqual(1);
    await expect(scene.locator('.studio-print[data-visible="false"]').first()).toHaveCSS(
      "opacity",
      "0",
    );
    await scene.screenshot({
      path: testInfo.outputPath(`artwork-${id}.png`),
      style: ".site-header, .skip-link { visibility: hidden !important; }",
    });
  }
  await scene.locator("[data-studio-option]").evaluateAll((buttons) => {
    for (const index of [2, 1, 0, 3, 1]) (buttons[index] as HTMLButtonElement).click();
  });
  await expect(scene.locator('[data-artwork="space"]')).toHaveCSS("opacity", "0.93");
  for (const id of ["crown", "nature", "dragon"])
    await expect(scene.locator(`[data-artwork="${id}"]`)).toHaveCSS("opacity", "0");
  const hoodie = (await scene.locator(".studio-hoodie").boundingBox())!;
  const region = (await scene.locator(".studio-print-region").boundingBox())!;
  expect(Math.abs((region.y - hoodie.y) / hoodie.height - 0.31)).toBeLessThan(0.002);
  await page.clock.runFor(30_000);
  await expect(scene).toHaveAttribute("data-active-artwork", "space");
  await expect(scene).toHaveAttribute("data-demo-hovered", "true");
  await page.mouse.move(1, 1);
  await page.clock.runFor(960);
  await expect(scene).toHaveAttribute("data-active-artwork", "nature");
});

test("foreground brush stays fixed through two float cycles while garment, print and panels move", async ({
  page,
}) => {
  await startClock(page);
  const scene = page.locator(".studio-scene");
  await expect
    .poll(() => scene.locator(".studio-garment").evaluate((el) => el.getAnimations()[0]?.playState))
    .toBe("running");
  // Complete reveal once, then inspect two full native float cycles without scrolling.
  const samples = await scene.evaluate((root) => {
    const brush = root.querySelector<HTMLElement>(".studio-brush-foreground")!;
    const garment = root.querySelector<HTMLElement>(".studio-garment")!;
    const frame = root.querySelector<HTMLElement>(".studio-selection")!;
    const print = root.querySelector<HTMLElement>('.studio-print[data-visible="true"]')!;
    const panels = [...root.querySelectorAll<HTMLElement>('[data-float="studio-panel"]')];
    root
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((el) => el.getAnimations().forEach((a) => a.finish()));
    const moving = [garment, ...panels].map((el) => el.getAnimations()[0]!);
    moving.forEach((a) => a.pause());
    const result = [];
    for (const time of [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000]) {
      moving.forEach((a) => {
        a.currentTime = time;
      });
      const b = brush.getBoundingClientRect();
      result.push({
        brush: [b.x, b.y, b.width, b.height],
        garment: garment.getBoundingClientRect().y,
        frame: frame.getBoundingClientRect().y,
        print: print.getBoundingClientRect().y,
        panels: panels.map((el) => el.getBoundingClientRect().y),
        animatedBrushAncestor: !!brush.closest("[data-float], [data-reveal]"),
        brushAnimations: brush.getAnimations().length,
        transform: getComputedStyle(brush).transform,
      });
    }
    moving.forEach((a) => a.play());
    return result;
  });
  const first = samples[0]!;
  expect(samples[2]!.garment - first.garment).toBeCloseTo(-9, 1);
  for (const sample of samples) {
    expect(sample.brush).toEqual(first.brush);
    expect(sample.animatedBrushAncestor).toBe(false);
    expect(sample.brushAnimations).toBe(0);
    expect(sample.transform).toBe("none");
    const delta = sample.garment - first.garment;
    expect(sample.frame - first.frame).toBeCloseTo(delta, 1);
    expect(sample.print - first.print).toBeCloseTo(delta, 1);
    for (const [index, amplitude] of [4, 3, 5].entries())
      expect(sample.panels[index]! - first.panels[index]!).toBeCloseTo((-delta / 9) * amplitude, 1);
  }
  await page.locator(".motion-toggle").evaluate((button: HTMLButtonElement) => button.click());
  const paused = await scene.locator(".studio-brush-foreground").boundingBox();
  expect([paused!.x, paused!.y, paused!.width, paused!.height]).toEqual(first.brush);
});

test("studio float keeps opposite phase and atmosphere follows lifecycle", async ({ page }) => {
  await startClock(page);
  const scene = page.locator(".studio-scene");
  const panel = page.locator(".studio-panel");
  await expect(panel).toHaveAttribute("data-studio-motion", "running");
  await expect
    .poll(() =>
      scene
        .locator(".studio-garment")
        .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42),
    )
    .toBeLessThan(-3);
  const sample = async () =>
    scene.evaluate((element) => {
      const garment = element.querySelector<HTMLElement>(".studio-garment")!;
      const gy = new DOMMatrixReadOnly(getComputedStyle(garment).transform).m42;
      const time = Number(garment.getAnimations()[0]!.currentTime);
      return [...element.querySelectorAll<HTMLElement>('[data-float="studio-panel"]')].map(
        (panel) => ({
          phaseError: Math.abs(
            new DOMMatrixReadOnly(getComputedStyle(panel).transform).m42 /
              Number(panel.dataset.studioTravel) +
              gy / 9,
          ),
          clockError: Math.abs(Number(panel.getAnimations()[0]!.currentTime) - time),
        }),
      );
    });
  for (const item of await sample()) {
    expect(item.phaseError).toBeLessThan(0.015);
    expect(item.clockError).toBeLessThan(20);
  }
  await page.clock.runFor(5720);
  await expect(scene).toHaveAttribute("data-demo-phase", "hover");
  await scene.locator(".studio-cursor").evaluate((el) => el.getAnimations()[0]?.finish());
  expect(
    await scene.evaluate((element) => {
      const cursor = element.querySelector(".studio-cursor")!.getBoundingClientRect();
      const button = element.querySelector('[data-studio-option="1"]')!.getBoundingClientRect();
      return Math.max(
        Math.abs(cursor.x + 2 - button.x - button.width / 2),
        Math.abs(cursor.y + 2 - button.y - button.height / 2),
      );
    }),
  ).toBeLessThan(1);
  await page.locator(".motion-toggle").evaluate((button: HTMLButtonElement) => button.click());
  await expect(panel).toHaveAttribute("data-studio-motion", "paused");
  await expect
    .poll(() =>
      page
        .locator(".studio-atmosphere")
        .evaluate((el) => getComputedStyle(el, "::before").animationPlayState),
    )
    .toBe("paused");
  await page.locator(".motion-toggle").evaluate((button: HTMLButtonElement) => button.click());
  for (const item of await sample()) expect(item.phaseError).toBeLessThan(0.015);
  await hidden(page, true);
  await expect(panel).toHaveAttribute("data-studio-motion", "paused");
  await hidden(page, false);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect(panel).toHaveAttribute("data-studio-motion", "paused");
  await scene.scrollIntoViewIfNeeded();
  await expect(panel).toHaveAttribute("data-studio-motion", "running");
  for (const item of await sample()) expect(item.phaseError).toBeLessThan(0.015);
  const cta = page.locator(".studio-cta");
  await cta.hover();
  await expect(cta).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -3)");
  await expect(cta.locator(".studio-cta-arrow")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 4, -2)",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(panel).not.toHaveAttribute("data-studio-motion");
  await expect
    .poll(() =>
      page
        .locator(".studio-atmosphere")
        .evaluate((el) => getComputedStyle(el, "::before").animationName),
    )
    .toBe("none");
});
