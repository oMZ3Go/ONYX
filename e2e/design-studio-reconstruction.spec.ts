import { createHash } from "node:crypto";
import { resolve } from "node:path";
import sharp from "sharp";
import { expect, test, type Page } from "./browser-test";
import manifest from "../src/modules/design-studio/catalog/artwork-manifest.json";
import { parseEditorProject } from "../src/modules/design-studio/editor/validation";

let bundle: string;

// Playwright serves the fixture itself. It mounts the shipping surface without adding a Studio
// route, persistence API or test-only data injection hook to the application.
test.beforeAll(async () => {
  const { build } = await import("vite");
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: "error",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      write: false,
      lib: {
        entry: resolve("e2e/fixtures/reconstructed-surface.tsx"),
        formats: ["iife"],
        name: "ReconstructedSurface",
      },
    },
  });
  const chunk = (Array.isArray(result) ? result : [result])
    .flatMap((r) => ("output" in r ? r.output : []))
    .find((entry) => entry.type === "chunk" && entry.isEntry);
  if (chunk?.type !== "chunk") throw new Error("Missing reconstruction fixture bundle");
  bundle = chunk.code;
});

async function renderedProject(page: Page) {
  const original = page.waitForResponse((response) => response.url().endsWith(manifest.crown.src));
  await page.goto("/__e2e/reconstructed-surface");
  const source = await (await original).body();
  const serialized = await page.locator("#result").textContent();
  const project = parseEditorProject(JSON.parse(serialized!));
  const side = project.sides.back;
  const object = side.objectsById[side.layerOrder[0]!]!;
  if (object.kind !== "artwork") throw new Error("Expected a reconstructed catalog artwork");
  expect(object.transform.width).toBe(162.5);
  expect(object.transform.rotationDeg).toBe(17);
  const asset = project.assets[object.assetId]!;
  const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
  const metadata = await sharp(source).metadata();
  expect(asset).toMatchObject({
    sha256: digest(source),
    byteLength: source.length,
    pixels: { width: metadata.width, height: metadata.height },
    source: { kind: "catalog", ref: { id: "crown", revision: project.catalogRevision } },
  });
  await expect(page.locator("[data-object-id]")).toHaveAttribute(
    "data-transform",
    JSON.stringify(object.transform),
  );
  const canvas = page.locator("canvas");
  await expect
    .poll(() =>
      canvas.evaluate((c: HTMLCanvasElement) => {
        const pixels = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
        return pixels.some((value, index) => index % 4 === 3 && value > 0);
      }),
    )
    .toBe(true);
  const dataURL = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  const png = Buffer.from(dataURL.split(",")[1]!, "base64");
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(data.some((value, index) => index % 4 === 3 && value > 0 && value < 255)).toBe(true);
  return {
    serialized: serialized!,
    asset,
    transform: object.transform,
    png,
    rgba: digest(data),
    width: info.width,
    height: info.height,
  };
}

for (const dpr of [1, 2]) {
  test.describe(`serialized v2 at DPR ${dpr}`, () => {
    test.use({ deviceScaleFactor: dpr });
    test("fresh controller and fresh decoder reproduce the resized original pixel for pixel", async ({
      page,
    }, info) => {
      let seed = "";
      await page.route("**/__e2e/surface.js", (route) =>
        route.fulfill({
          contentType: "text/javascript",
          body: bundle,
        }),
      );
      await page.route("**/__e2e/reconstructed-surface", (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,">
          <style>.ds-editor-surface{width:640px;height:320px}</style><div id="root"></div>
          <script type="application/json" id="seed">${seed.replaceAll("<", "\\u003c")}</script>
          <script type="application/json" id="result"></script><script src="/__e2e/surface.js"></script>`,
        }),
      );
      const before = await renderedProject(page);
      seed = before.serialized;
      const after = await renderedProject(page);
      expect(after.serialized).toBe(before.serialized);
      expect(after.asset).toEqual(before.asset);
      expect(after.transform).toEqual(before.transform);
      expect([before.width, before.height]).toEqual([640 * dpr, 320 * dpr]);
      expect([after.width, after.height, after.rgba]).toEqual([
        before.width,
        before.height,
        before.rgba,
      ]);
      await info.attach("reconstruction-measurements", {
        contentType: "application/json",
        body: JSON.stringify(
          {
            dpr,
            canvas: [after.width, after.height],
            rgbaSha256Before: before.rgba,
            rgbaSha256After: after.rgba,
            asset: after.asset,
            transform: after.transform,
          },
          null,
          2,
        ),
      });
      for (const [label, result] of Object.entries({ before, after })) {
        await info.attach(`${label}-reconstruction`, {
          body: result.png,
          contentType: "image/png",
        });
      }
    });
  });
}
