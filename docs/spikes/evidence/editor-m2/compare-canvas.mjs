import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import sharp from "sharp";

// Run from the repository root. A single blank Chromium page uses only the local PNG.
const browserCache = resolve(".cache/ms-playwright");
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && existsSync(browserCache))
  process.env.PLAYWRIGHT_BROWSERS_PATH = browserCache;
const { chromium } = await import("@playwright/test");
const source = "public/images/landing/design-studio/prints/print-crown.png";
const bytes = await readFile(source);
const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
const output = ".cache/phase-03/editor-quality/controlled-canvas";
await mkdir(output, { recursive: true });

async function compare(name, first, second) {
  const decode = (png) => sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [a, b] = await Promise.all([decode(first.png), decode(second.png)]);
  const { width, height, channels } = a.info;
  if (width !== b.info.width || height !== b.info.height || channels !== 4 || b.info.channels !== 4)
    throw new Error("Expected same-size RGBA captures");
  let rgbaChanged = 0,
    alphaChanged = 0,
    alphaDelta16OrMore = 0,
    totalAlphaDelta = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const delta = Math.abs(a.data[i + 3] - b.data[i + 3]);
    if (
      delta ||
      a.data[i] !== b.data[i] ||
      a.data[i + 1] !== b.data[i + 1] ||
      a.data[i + 2] !== b.data[i + 2]
    )
      rgbaChanged++;
    if (delta) alphaChanged++;
    if (delta >= 16) alphaDelta16OrMore++;
    totalAlphaDelta += delta;
  }
  async function save({ label, png }) {
    const path = output + "/" + name + "-" + label + ".png";
    await writeFile(path, png);
    return { path, sha256: digest(png) };
  }
  return {
    width,
    height,
    totalPixels: width * height,
    rgbaChanged,
    alphaChanged,
    alphaDelta16OrMore,
    meanAbsoluteAlphaDelta: Number((totalAlphaDelta / (width * height)).toFixed(3)),
    first: await save(first),
    second: await save(second),
  };
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    deviceScaleFactor: 2,
    viewport: { width: 400, height: 400 },
  });
  await page.setContent(
    "<style>* {margin:0}canvas {display:block;width:91px;height:92px;transform-origin:0 0;transform:scale(2)}</style><canvas></canvas>",
  );
  const image = await page.evaluateHandle(
    async (url) => {
      const original = new globalThis.Image();
      original.src = url;
      await original.decode();
      return original;
    },
    "data:image/png;base64," + bytes.toString("base64"),
  );
  const canvas = page.locator("canvas");
  async function paint(width, height, quality) {
    await canvas.evaluate(
      (node, { image, width, height, quality }) => {
        node.width = width;
        node.height = height;
        const context = node.getContext("2d");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = quality;
        context.drawImage(image, 0, 0, width, height);
      },
      { image, width, height, quality },
    );
  }
  async function downsample(quality) {
    await paint(91, 92, quality);
    const url = await canvas.evaluate((node) => node.toDataURL("image/png"));
    return { label: quality, png: Buffer.from(url.split(",")[1], "base64") };
  }
  async function captureZoom(label, width, height) {
    await paint(width, height, "high");
    return { label, png: await canvas.screenshot({ omitBackground: true, scale: "device" }) };
  }
  const fixed = await captureZoom("fixed", 182, 184);
  const zoomAware = await captureZoom("zoom-aware", 364, 368);
  const { width, height } = await sharp(bytes).metadata();
  const sourceAlpha = await sharp(bytes).extractChannel("alpha").raw().toBuffer();
  async function changedSourceAlpha(capture) {
    const alpha = await sharp(capture.png).extractChannel("alpha").raw().toBuffer();
    if (alpha.length !== sourceAlpha.length) throw new Error("Expected source-sized zoom capture");
    return alpha.reduce((count, value, i) => count + Number(value !== sourceAlpha[i]), 0);
  }
  const result = {
    scope: "Isolated Chromium Canvas 2D comparison of the source PNG on a blank page.",
    reproduce:
      "From the repository root, run node docs/spikes/evidence/editor-m2/compare-canvas.mjs",
    chromium: browser.version(),
    dpr: await page.evaluate(() => globalThis.devicePixelRatio),
    source: { path: source, sha256: digest(bytes), width, height },
    interpolation: {
      method:
        "Draw the same original directly to a 91 × 92 transparent canvas. Compare lossless canvas PNGs from low and high image smoothing.",
      ...(await compare("smoothing", await downsample("low"), await downsample("high"))),
    },
    cameraZoom: {
      method:
        "At DPR 2, transform a 91 × 92 CSS pixel canvas to 200%. Compare transparent compositor screenshots. The fixed backing is 182 × 184. The zoom-aware backing is 364 × 368. Both draw the original with high smoothing.",
      ...(await compare("zoom", fixed, zoomAware)),
      changedAlphaPixelsVsOriginalPNG: {
        fixedBacking: await changedSourceAlpha(fixed),
        zoomAwareBacking: await changedSourceAlpha(zoomAware),
      },
    },
  };
  await writeFile(
    "docs/spikes/evidence/editor-m2/controlled-canvas.json",
    JSON.stringify(result, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
