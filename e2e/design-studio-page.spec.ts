import { setStudioTheme } from "./studio-controls";
import { mkdir } from "node:fs/promises";
import { test, expect, type Page } from "./browser-test";
import { studioImagesReady } from "./studio-images";
import en from "../messages/en.json";
import ar from "../messages/ar.json";
import { fixtureStudioCatalog } from "../src/modules/design-studio/catalog/fixtures";

const dictionaries = { en, ar };
const captures = ".cache/phase-03/motion";
async function ready(page: Page) {
  await expect(page.locator(".ds-garments-exit")).toHaveCount(0);
  await studioImagesReady(page, ".ds-page img");
  await expect(page.locator(".ds-viewport")).toHaveAttribute("data-max-zoom", /\d+/);
}
async function contained(page: Page) {
  // Geometry/source assertions describe the settled view. The separate frame
  // regressions inspect both live groups while the local crossfade is running.
  await expect(page.locator(".ds-garments-exit")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const element = document.querySelector<HTMLElement>(".ds-viewport")!;
        const viewport = element.getBoundingClientRect();
        const boxes = [...document.querySelectorAll(".ds-garment")].map((image) =>
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
  const geometry = await page.evaluate(() => {
    const v = document.querySelector(".ds-viewport")!;
    const footer = document.querySelector(".ds-workflow")!.getBoundingClientRect();
    return {
      x: document.documentElement.scrollWidth - innerWidth,
      y: document.documentElement.scrollHeight - innerHeight,
      vx: v.scrollWidth - v.clientWidth,
      vy: v.scrollHeight - v.clientHeight,
      bottom: footer.bottom,
      height: innerHeight,
      footerTop: footer.top,
    };
  });
  await expect(page.locator(".ds-layout")).toHaveCSS("overflow", "visible");
  await expect(page.locator(".ds-page")).toHaveCSS("overflow", "clip");
  for (const value of [geometry.x, geometry.y]) expect(value).toBeLessThanOrEqual(1);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.height + 1);
  expect(geometry.footerTop).toBeGreaterThan(0);
  for (const selector of [".ds-canvas-bottom", ".ds-workflow-actions"])
    await expect(page.locator(selector)).toBeInViewport({ ratio: 1 });
}
async function capture(page: Page, name: string) {
  await ready(page);
  // Finishing CSS animations during a live native snapshot can capture the
  // temporarily hidden source. Wait for the real transition to finish first.
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
    )
    .toBe(0);
  await mkdir(captures, { recursive: true });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: `${captures}/${name}.png`,
    fullPage: true,
    animations: "allow",
  });
}
async function limit(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true });
  for (let i = 0; i < 30 && (await button.isEnabled()); i++) await button.click();
  await expect(button).toBeDisabled();
  await contained(page);
}
async function readablePalette(page: Page) {
  // Conservative backdrops for translucent surfaces: white beneath dark UI,
  // black beneath light UI. This checks the computed text palette, not image pixels.
  const ratios = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(".ds-page")!;
    const base = root.dataset.theme === "dark" ? [255, 255, 255] : [0, 0, 0];
    const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const luminance = (color: number[]) =>
      color
        .slice(0, 3)
        .map((channel) => {
          const c = channel / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
    return [
      ".ds-library > h2",
      ".ds-tool-trigger",
      ".ds-subtle",
      ".ds-layers .ds-empty p",
      ".ds-workflow-product p",
      ".ds-continue",
    ].map((selector) => {
      const element = root.querySelector<HTMLElement>(selector)!;
      const ancestors: HTMLElement[] = [];
      for (
        let current: HTMLElement | null = element;
        current && current !== root;
        current = current.parentElement
      )
        ancestors.unshift(current);
      let bg = base;
      for (const ancestor of ancestors) {
        const style = getComputedStyle(ancestor);
        const gradient = style.backgroundImage.match(/rgba?\([^)]+\)/)?.[0];
        const value = rgba(gradient ?? style.backgroundColor);
        const alpha = value[3] ?? 1;
        bg = bg.map((c, i) => value[i]! * alpha + c * (1 - alpha));
      }
      const foreground = luminance(rgba(getComputedStyle(element).color));
      const background = luminance(bg);
      return {
        selector,
        ratio:
          (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
      };
    });
  });
  for (const { selector, ratio } of ratios) expect(ratio, selector).toBeGreaterThanOrEqual(4.5);
}

async function readableHeader(page: Page) {
  // The header is transparent: sample the real supplied background under each
  // text box, composited against the root, instead of assuming an opaque bar.
  const ratios = await page.evaluate(async () => {
    const root = document.querySelector<HTMLElement>(".ds-page")!;
    const background = root.querySelector<HTMLImageElement>(
      `.ds-environment-${root.dataset.theme}`,
    )!;
    await background.decode();
    const canvas = document.createElement("canvas");
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = getComputedStyle(root).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = Number(getComputedStyle(background).opacity);
    const scale = Math.max(
      innerWidth / background.naturalWidth,
      innerHeight / background.naturalHeight,
    );
    const w = background.naturalWidth * scale,
      h = background.naturalHeight * scale;
    ctx.drawImage(background, (innerWidth - w) / 2, (innerHeight - h) / 2, w, h);
    const style = getComputedStyle(root);
    const fade = ctx.createLinearGradient(
      0,
      0,
      0,
      parseFloat(style.getPropertyValue("--ds-header-fade")),
    );
    const rgb = style.backgroundColor
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .join(",");
    fade.addColorStop(
      0,
      `rgba(${rgb},${parseFloat(style.getPropertyValue("--ds-header-shade")) / 100})`,
    );
    fade.addColorStop(1, `rgba(${rgb},0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    const luminance = (rgb: number[]) =>
      rgb
        .map((c) => {
          const v = c / 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0);
    return [".ds-save-status", ".ds-brand h1"].map((selector) => {
      const el = root.querySelector(selector)!;
      const b = el.getBoundingClientRect();
      const fg = luminance(
        getComputedStyle(el)
          .color.match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number),
      );
      const pixels = ctx.getImageData(
        Math.floor(b.x),
        Math.floor(b.y),
        Math.ceil(b.width),
        Math.ceil(b.height),
      ).data;
      let ratio = 21;
      for (let i = 0; i < pixels.length; i += 4) {
        const bg = luminance([pixels[i]!, pixels[i + 1]!, pixels[i + 2]!]);
        ratio = Math.min(ratio, (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05));
      }
      return { selector, ratio };
    });
  });
  for (const { selector, ratio } of ratios) expect(ratio, selector).toBeGreaterThanOrEqual(4.5);
}
for (const locale of ["ar", "en"] as const) {
  const copy = dictionaries[locale].designStudio;
  test(`${locale}: full-page themes, grid, bounded centered zoom and fit`, async ({ page }) => {
    await page.goto(`/${locale}/design-studio`);
    await ready(page);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    const garment = page.locator(".ds-garment img");
    await expect(garment).toHaveAttribute("src", /hoodie-black-back/);
    const grid = page.getByRole("button", { name: copy.workspace.grid, exact: true });
    await expect(grid).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: copy.workspace.front, exact: true }).click();
    await ready(page);
    await expect(garment).toHaveAttribute("src", /hoodie-black-front/);
    await page.getByRole("button", { name: copy.workspace.both, exact: true }).click();
    await expect(garment).toHaveCount(2);
    const sources = await garment.evaluateAll((images) =>
      images.map((img) => img.getAttribute("src")),
    );
    const surfaceColors = () =>
      page.locator(".ds-surface, .ds-workflow, .ds-view-control").evaluateAll((elements) =>
        elements.map((el) => ({
          color: getComputedStyle(el).color,
          bg: getComputedStyle(el).backgroundColor,
        })),
      );
    const dark = await surfaceColors();
    await readablePalette(page);
    await expect(page.locator(".ds-header")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(page.locator(".ds-header")).toHaveCSS("backdrop-filter", "none");
    await setStudioTheme(page, "light");
    await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", "light");
    await expect(page.locator(".ds-environment-light")).toHaveCSS("opacity", "0.75");
    const light = await surfaceColors();
    await readablePalette(page);
    expect(
      light.every(
        (entry, index) => entry.color !== dark[index]!.color && entry.bg !== dark[index]!.bg,
      ),
    ).toBe(true);
    expect(
      await garment.evaluateAll((images) => images.map((img) => img.getAttribute("src"))),
    ).toEqual(sources);
    await grid.click();
    await expect(grid).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".ds-position-grid")).toHaveCSS("pointer-events", "none");
    await expect(page.locator(".ds-position-grid")).toHaveCSS("opacity", "1");
    const before = await page.locator(".ds-zoom-content").boundingBox();
    await limit(page, copy.workspace.zoomIn);
    const after = await page.locator(".ds-zoom-content").boundingBox();
    expect(after!.width).toBeGreaterThan(before!.width);
    expect(after!.x + after!.width / 2).toBeCloseTo(before!.x + before!.width / 2, 0);
    expect(after!.y + after!.height / 2).toBeCloseTo(before!.y + before!.height / 2, 0);
    const zoom = Number(await page.locator(".ds-viewport").getAttribute("data-zoom"));
    const gridSize = await page
      .locator(".ds-position-grid")
      .evaluate((el) => parseFloat(getComputedStyle(el).backgroundSize));
    expect(gridSize).toBeCloseTo((32 * zoom) / 100);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect
      .poll(async () =>
        page
          .locator(".ds-viewport")
          .evaluate(
            (el) =>
              Number(el.getAttribute("data-zoom")) <= Number(el.getAttribute("data-max-zoom")),
          ),
      )
      .toBe(true);
    await contained(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: copy.workspace.fit, exact: true }).click();
    await expect(page.locator(".ds-zoom output")).toHaveText("100%");
    await expect
      .poll(async () => (await page.locator(".ds-zoom-content").boundingBox())!.width)
      .toBeCloseTo(before!.width, 0);
    await limit(page, copy.workspace.zoomOut);
    await page.getByRole("button", { name: copy.workspace.fit, exact: true }).click();
    await grid.click();
    await expect(page.locator(".ds-position-grid")).toHaveCSS("opacity", "0");
    for (const img of await garment.all()) {
      const bounds = await img.boundingBox();
      expect(bounds!.width / bounds!.height).toBeCloseTo(2, 1);
      await expect(img).toHaveCSS("filter", "none");
    }
    await expect(page.locator(".ds-save-status")).toHaveText(copy.notSaved);
    await expect(page.locator(".ds-layers")).toContainText("(0)");
    await contained(page);
  });

  test(`${locale}: exclusive library, catalog integrity and honest unavailable actions`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/design-studio`);
    await expect(page.locator(".ds-variants button")).toHaveCount(1);
    await page.locator(".ds-variants button").click();
    await expect(page.locator(".ds-variants button")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".ds-artwork")).toHaveCount(fixtureStudioCatalog.artworks.length);
    const dragon = fixtureStudioCatalog.artworks.find((art) => art.id.includes("dragon"))!;
    await page
      .getByRole("button", { name: `${copy.library.inspect}: ${dragon.name[locale]}`, exact: true })
      .click();
    await expect(page.locator(".ds-artwork-detail")).toContainText(copy.properties.provisional);
    await expect(page.locator(".ds-artwork-detail")).toContainText("1122 × 1402 px");
    await expect(
      page.getByRole("button", { name: copy.properties.add, exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: locale === "ar" ? "مجردة" : "Abstract", exact: true })
      .click();
    await expect(page.locator(".ds-library-content")).toContainText(copy.library.empty);
    const panelBefore = await page.locator(".ds-library").boundingBox();
    for (const section of ["text", "upload", "shapes", "saved"] as const) {
      await page.locator(`#ds-tool-${section}`).click();
      await expect(page.locator(".ds-tool-trigger[aria-expanded=true]")).toHaveCount(1);
      await expect(page.locator(`#ds-tool-content-${section}`)).toBeVisible();
      for (const closed of await page.locator('.ds-tool-content[aria-hidden="true"]').all()) {
        await expect(closed).toBeHidden();
        await expect(closed).toHaveAttribute("inert", "");
      }
      await expect(page.locator(".ds-tool-content:visible")).toHaveCount(1);
      await expect(page.locator(".ds-tool-content:visible")).toContainText(copy.deferred[section]);
      await expect.poll(() => page.locator(".ds-library").boundingBox()).toEqual(panelBefore);
      await contained(page);
    }
    await page.locator("#ds-tool-artwork").click();
    await expect(page.locator(".ds-category-tabs button[aria-pressed=true]")).toHaveText(
      locale === "ar" ? "مجردة" : "Abstract",
    );
    for (const name of [
      copy.workflow.save,
      copy.workflow.continue,
      copy.workspace.undo,
      copy.workspace.redo,
    ])
      await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
    await expect(page.locator(".ds-workflow")).toContainText(copy.workflow.priceUnavailable);
    await expect(page.locator(".ds-save-status")).toHaveText(copy.notSaved);
    expect(await page.evaluate(() => Object.keys(localStorage))).toHaveLength(0);
  });

  test(`${locale}: viewport matrix, short screens, both modes and visual captures`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    // 1800×1125 and 1152×720 represent the CSS space of a 1440×900 window at 80% / 125%.
    // These are reflow checks, not claims of native browser-toolbar zoom testing.
    const sizes = [
      [320, 568],
      [390, 844],
      [768, 1024],
      [1024, 768],
      [1280, 600],
      [1440, 900],
      [1920, 1080],
      [1024, 576],
      [1800, 1125],
      [1152, 720],
    ];
    await page.goto(`/${locale}/design-studio`);
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width: width!, height: height! });
      await ready(page);
      for (const theme of ["dark", "light"] as const) {
        await setStudioTheme(page, theme);
        await expect(page.locator(`.ds-environment-${theme}`)).toHaveCSS(
          "opacity",
          theme === "light" ? "0.75" : "0.45",
        );
        await page
          .getByRole("button", {
            name: copy.workspace[theme === "dark" ? "back" : "front"],
            exact: true,
          })
          .click();
        await contained(page);
        await readableHeader(page);
        expect(
          (await page.locator(".ds-garment img").boundingBox())!.height,
        ).toBeGreaterThanOrEqual(64);
        await capture(page, `${locale}-${theme}-${width}x${height}`);
        await page.getByRole("button", { name: copy.workspace.both, exact: true }).click();
        await limit(page, copy.workspace.zoomIn);
        await page.getByRole("button", { name: copy.workspace.fit, exact: true }).click();
        const grid = page.getByRole("button", { name: copy.workspace.grid, exact: true });
        await grid.click();
        await capture(page, `${locale}-${theme}-both-grid-${width}x${height}`);
        await grid.click();
      }
      if (width! < 1000) {
        await page.getByRole("button", { name: copy.workspace.back, exact: true }).click();
        await page.locator("#ds-toggle-library").click();
        await expect(page.locator("#ds-sheet-heading")).toBeFocused();
        await expect(page.locator("#ds-mobile-tools")).toHaveAttribute("open", "");
        await page.locator("#ds-tool-text").click();
        await contained(page);
        expect(
          (await page.locator(".ds-garment img").boundingBox())!.height,
        ).toBeGreaterThanOrEqual(64);
        const sheet = await page.locator("dialog[open]").boundingBox();
        const preview = await page.locator(".ds-viewport").boundingBox();
        expect(
          preview!.y + preview!.height <= sheet!.y || preview!.x + preview!.width <= sheet!.x,
        ).toBe(true);
        await expect(page.locator("dialog[open]")).toHaveAttribute("aria-modal", "false");
        await capture(page, `${locale}-light-text-${width}x${height}`);
        await page.keyboard.press("Tab");
        expect(
          await page.locator("dialog[open]").evaluate((el) => el.contains(document.activeElement)),
        ).toBe(true);
        await page.keyboard.press("Escape");
        await expect(page.locator("#ds-toggle-library")).toBeFocused();
        await expect(page.locator(".ds-library-host")).toBeHidden();
        await page.locator("#ds-toggle-library").click();
        await page.locator("#ds-tool-artwork").click();
        await page.locator(".ds-artwork").first().click();
        await expect(page.locator("#ds-sheet-heading")).toBeFocused();
        await expect(page.locator(".ds-library-host")).toBeHidden();
        await expect(page.locator(".ds-artwork-detail")).toBeVisible();
        await page.locator("dialog[open]").getByRole("button", { name: copy.closePanel }).click();
        await expect(page.locator("#ds-toggle-inspector")).toBeFocused();
      } else {
        await page.locator("#ds-tool-text").click();
        await contained(page);
        await capture(page, `${locale}-light-text-${width}x${height}`);
        await page.locator("#ds-tool-artwork").click();
      }
      await contained(page);
      for (const selector of [
        ".ds-view-control button",
        ".ds-appearance-toggle",
        ".ds-zoom button",
      ]) {
        for (const button of await page.locator(selector).all()) {
          const b = await button.boundingBox();
          expect(b!.width).toBeGreaterThanOrEqual(43);
          expect(b!.height).toBeGreaterThanOrEqual(43);
        }
      }
    }
  });

  test(`${locale}: section-scroll entry, localized studio route and centered home link`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    for (const selector of [".header-cta", ".hero-cta"])
      await expect(page.locator(selector)).toHaveAttribute("href", "#design-studio");
    await page.locator(".header-cta").click();
    await expect(page).toHaveURL(new RegExp(`/${locale}#design-studio$`));
    await expect(page.locator("#studio-title")).toBeInViewport();
    await page.locator(".studio-cta").click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/design-studio$`));
    const home = page.getByRole("link", { name: copy.backHome, exact: true });
    await expect(home).toHaveAttribute("href", `/${locale}`);
    const box = await home.boundingBox();
    expect(box!.x + box!.width / 2).toBeCloseTo(page.viewportSize()!.width / 2, 0);
    const other = locale === "ar" ? "en" : "ar";
    await page.locator(`.ds-header a[lang="${other}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${other}/design-studio$`));
    await page
      .getByRole("link", { name: dictionaries[other].designStudio.backHome, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${other}$`));
    await expect(page.locator(".studio-scene")).toHaveCount(1);
  });
}

test("studio keyboard focus and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/design-studio");
  const front = page.getByRole("button", { name: "Front", exact: true });
  await front.focus();
  await page.keyboard.press("Space");
  await expect(front).toHaveAttribute("aria-pressed", "true");
  await expect(front).toBeFocused();
  await expect(front).toHaveCSS("outline-style", "solid");
  await page.locator("#ds-tool-text").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ds-tool-text")).toHaveAttribute("aria-expanded", "true");
  expect(
    await page.locator(".ds-page").evaluate((root) => root.getAnimations({ subtree: true }).length),
  ).toBe(0);
});

for (const locale of ["en", "ar"] as const) {
  test(`${locale}: theme preference survives locale navigation, reload and history without saving`, async ({
    page,
    context,
  }) => {
    const copy = dictionaries[locale].designStudio;
    const other = locale === "en" ? "ar" : "en";
    await page.goto(`/${locale}/design-studio`);
    for (const theme of ["light", "dark"] as const) {
      await setStudioTheme(page, theme);
      await expect(page.locator(".ds-appearance-toggle")).toHaveCount(1);
      await expect(page.locator(".ds-appearance-toggle")).toHaveAccessibleName(
        copy.workspace[theme === "light" ? "switchToDark" : "switchToLight"],
      );
      await page.locator(`.language-switcher a[lang="${other}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${other}/design-studio$`));
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", theme);
      // First server paint already has the preference (no client-only correction).
      const response = await context.request.get(`/${other}/design-studio`);
      expect(await response.text()).toContain(`data-theme="${theme}"`);
      await page.reload();
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", theme);
      await expect(page.locator(".ds-appearance-toggle")).toHaveAccessibleName(
        dictionaries[other].designStudio.workspace[
          theme === "light" ? "switchToDark" : "switchToLight"
        ],
      );
      await expect(page.locator(".ds-save-status")).toHaveText(
        dictionaries[other].designStudio.notSaved,
      );
      await page.goBack();
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", theme);
    }
  });

  test(`${locale}: rapid garment switching settles on the real view and preserves zoom`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/design-studio`);
    await ready(page);
    await page
      .getByRole("button", {
        name: dictionaries[locale].designStudio.workspace.zoomOut,
        exact: true,
      })
      .click();
    const zoom = await page.locator(".ds-zoom output").textContent();
    for (const final of ["front", "back", "both"] as const) {
      await page.evaluate(async (last) => {
        const buttons = [
          ...document.querySelectorAll<HTMLButtonElement>(".ds-view-control button"),
        ];
        for (const index of [0, 1, 2, 1, 0, 2, 1, ["front", "back", "both"].indexOf(last)]) {
          buttons[index]!.click();
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }, final);
      await expect(page.locator(".ds-garments")).toHaveAttribute("data-view", final);
      await expect(page.locator(".ds-view-control button[aria-pressed=true]")).toHaveCount(1);
      await expect(
        page.getByRole("button", {
          name: dictionaries[locale].designStudio.workspace[final],
          exact: true,
        }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect
        .poll(() =>
          page.evaluate(
            () => document.getAnimations().filter((a) => a.playState === "running").length,
          ),
        )
        .toBe(0);
      await expect(page.locator(".ds-garment img")).toHaveCount(final === "both" ? 2 : 1);
      if (final !== "both")
        await expect(page.locator(".ds-garment img")).toHaveAttribute(
          "src",
          new RegExp(`hoodie-black-${final}`),
        );
      await expect(page.locator(".ds-zoom output")).toHaveText(zoom!);
      const button = await page.locator(".ds-view-control button[aria-pressed=true]").boundingBox();
      const indicator = await page.locator(".ds-view-indicator").boundingBox();
      expect(indicator!.x).toBeCloseTo(button!.x, 0);
      expect(indicator!.width).toBeCloseTo(button!.width, 0);
      await contained(page);
    }
  });

  test(`${locale}: mobile tools keep the hoodie and controls reachable with one-tap replacement`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/design-studio`);
    const copy = dictionaries[locale].designStudio;
    await page
      .locator(".ds-panel-toggles")
      .getByRole("button", { name: copy.tools.text, exact: true })
      .click();
    await expect(page.locator("#ds-tool-text")).toHaveAttribute("aria-expanded", "true");
    await page.locator("#ds-tool-upload").click();
    await expect(page.locator("#ds-tool-upload")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await page.getByRole("button", { name: copy.workspace.front, exact: true }).click();
    // Click the changing SVG itself: its old node detaches during React's handler.
    // The outside-dismiss listener must still recognize the original button path.
    for (const theme of ["light", "dark", "light"] as const) {
      await page.locator(".ds-appearance-toggle svg").click();
      await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", theme);
      await expect(page.locator(".ds-page")).toHaveAttribute("data-panel-open", "true");
      await expect(page.locator(".ds-sheet-pin")).toHaveAttribute("aria-pressed", "false");
    }
    await page.locator(".ds-grid-toggle").click();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await ready(page);
    await expect(page.locator(".ds-garment img")).toHaveAttribute("src", /hoodie-black-front/);
    await page.locator("#ds-toggle-inspector").click();
    await page.locator(".ds-layers-tab").click();
    await expect(page.locator(".ds-layers")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#ds-toggle-inspector")).toBeFocused();
    await page.locator("#ds-toggle-library").click();
    await page.locator(".ds-viewport").click({ position: { x: 4, y: 4 } });
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await page.locator("#ds-toggle-library").click();
    await page.locator("dialog[open]").getByRole("button", { name: copy.closePanel }).click();
    await expect(page.locator("#ds-toggle-library")).toBeFocused();
    await contained(page);
    const title = await page.locator(".ds-brand h1").boundingBox();
    const status = await page.locator(".ds-save-status").boundingBox();
    expect(locale === "en" ? title!.x : title!.x + title!.width).toBeCloseTo(
      locale === "en" ? status!.x : status!.x + status!.width,
      0,
    );
    const save = await page.locator(".ds-save").boundingBox();
    const next = await page.locator(".ds-continue").boundingBox();
    expect(save!.y).toEqual(next!.y);
    expect(save!.height).toEqual(next!.height);
    await expect(page.locator(".ds-save")).toBeDisabled();
    await expect(page.locator(".ds-continue")).toBeDisabled();
    await expect(page.locator(".ds-save")).toHaveAccessibleDescription(copy.deferred.workflow);
    expect((await page.locator("#ds-workflow-note").boundingBox())!.height).toBeLessThanOrEqual(1);
  });
}

test("studio logo reuses the landing paint and keyboard focus behavior", async ({ page }) => {
  await page.goto("/en/design-studio");
  const logo = page.locator(".ds-brand .brand-logo");
  await expect(logo).toHaveAttribute("href", "/en");
  await logo.hover();
  await expect
    .poll(() =>
      logo.evaluate((el) =>
        el.getAnimations({ subtree: true }).some((a) => a.effect?.getTiming().duration === 1100),
      ),
    )
    .toBe(true);
  await page.mouse.move(500, 500);
  await page.keyboard.press("Tab");
  await logo.focus();
  await expect(logo).toBeFocused();
  await expect(logo).toHaveCSS("outline-style", "solid");
  await expect
    .poll(() =>
      logo.evaluate((el) =>
        el.getAnimations({ subtree: true }).some((a) => a.effect?.getTiming().duration === 1100),
      ),
    )
    .toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => logo.evaluate((el) => el.getAnimations({ subtree: true }).length))
    .toBe(0);
});

test("reduced-motion entry and back/forward navigation remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en#design-studio");
  await page.locator(".studio-cta").click();
  await expect(page).toHaveURL(/\/en\/design-studio$/);
  await ready(page);
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
    )
    .toBe(0);
  await page.goBack();
  await expect(page.locator(".studio-cta")).toBeVisible();
  await page.goForward();
  await expect(page.locator(".ds-viewport")).toBeVisible();
  await page.getByRole("button", { name: "Front", exact: true }).click();
  await expect(page.locator(".ds-garment img")).toHaveAttribute("src", /hoodie-black-front/);
  await contained(page);
});
