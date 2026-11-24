import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import os from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../../.cache/canvas-engine/results/", import.meta.url));
await mkdir(output, { recursive: true });
process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(
  new URL("../../.cache/ms-playwright/", import.meta.url),
);
const { chromium } = await import("@playwright/test");
const browser = await chromium.launch({ headless: true });
const report = {
  date: new Date().toISOString(),
  os: `${os.type()} ${os.release()} ${os.arch()}`,
  cpu: os.cpus()[0].model,
  logicalCores: os.cpus().length,
  ramBytes: os.totalmem(),
  node: process.version,
  browser: browser.version(),
  assetHashes: JSON.parse(
    await readFile(new URL("../../.cache/canvas-engine/asset-hashes.json", import.meta.url)),
  ),
  fixtureHash: createHash("sha256")
    .update(await readFile(new URL("./app/fixtures.js", import.meta.url)))
    .digest("hex"),
  engines: {},
};
const duration = Number(process.env.ONYX_SPIKE_DURATION_MS || 30000);
try {
  for (const engine of ["konva", "fabric", "svg"]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1000 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    const scripts = new Map();
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", async (r) => {
      if (r.url().includes(".js")) {
        try {
          scripts.set(r.url(), (await r.body()).length);
        } catch {
          /* navigation may cancel preloads */
        }
      }
    });
    const start = Date.now();
    await page.goto(`http://127.0.0.1:3032/?engine=${engine}`);
    await page.waitForFunction(() => window.spike || window.spikeError);
    const failure = await page.evaluate(() => window.spikeError);
    if (failure) throw new Error(failure);
    const result = (report.engines[engine] = {
      readyMs: Date.now() - start,
      scripts: {},
      errors,
      timings: {},
      exports: [],
      checks: {},
    });
    await page.screenshot({ path: `${output}/${engine}-text.png`, fullPage: true });
    result.checks.textSource = await page.evaluate(() =>
      window.spike.nodes.slice(0, 6).map((n) => n.text),
    );
    await page.getByRole("textbox", { name: "Arabic text" }).fill("مرحبا أونيكس");
    await page.getByRole("textbox", { name: "Arabic text" }).press("Home");
    await page.getByRole("textbox", { name: "Arabic text" }).press("ArrowRight");
    await page.keyboard.insertText("مُ");
    result.checks.domTextEdit = await page.evaluate(() => ({
      input: document.querySelector("textarea").value,
      canonical: window.spike.nodes[0].text,
      start: document.querySelector("textarea").selectionStart,
    }));
    await page.getByRole("spinbutton", { name: "X", exact: true }).fill("125");
    result.checks.numericKeyboardX = await page.evaluate(() => window.spike.nodes[7].x);
    await page.evaluate(() => {
      window.spike.reset();
      window.spike.select("object-7");
    });
    const box = await page.locator("#surface").boundingBox();
    const node = await page.evaluate(() => window.spike.nodes[7]);
    await page.mouse.move(box.x + node.x * 2, box.y + node.y * 2);
    await page.mouse.down();
    await page.mouse.move(box.x + node.x * 2 + 40, box.y + node.y * 2 + 20, { steps: 8 });
    await page.mouse.up();
    result.checks.mouseDrag = await page.evaluate(() => ({
      node: window.spike.nodes[7],
      commits: window.spike.commits,
    }));
    for (const mode of ["resize", "rotate"]) {
      await page.evaluate(() => {
        window.spike.reset();
        window.spike.patch("object-7", { x: 150, y: 250, angle: 0 });
        window.spike.select("object-7");
      });
      const handle = await page.evaluate((mode) => window.spike.handles()[mode], mode);
      await page.mouse.move(box.x + handle.x, box.y + handle.y);
      await page.mouse.down();
      await page.mouse.move(box.x + handle.x + 30, box.y + handle.y + 30, { steps: 8 });
      await page.mouse.up();
      result.checks[mode] = await page.evaluate(() => ({
        node: window.spike.nodes[7],
        commits: window.spike.commits - 1,
      }));
    }
    result.checks.remount = [];
    for (let i = 0; i < 5; i++)
      result.checks.remount.push(await page.evaluate(() => window.spike.remount()));
    for (const count of [10, 100, 300]) {
      await page.evaluate((count) => window.spike.benchmark(count, 300), count);
      const runs = [];
      for (let i = 0; i < 5; i++)
        runs.push(
          await page.evaluate(({ count, duration }) => window.spike.benchmark(count, duration), {
            count,
            duration: count === 100 ? duration : 1000,
          }),
        );
      result.timings[count] = runs.map((samples) => {
        const sorted = [...samples].sort((a, b) => a - b);
        return {
          frames: samples.length,
          medianMs: sorted[Math.floor(sorted.length / 2)],
          p95Ms: sorted[Math.floor(sorted.length * 0.95)],
          maxMs: sorted.at(-1),
          samples,
        };
      });
    }
    await page.evaluate(() => window.spike.reset(100));
    await page.evaluate(() => window.spike.export());
    for (let i = 0; i < 10; i++) {
      const exported = await page.evaluate(() => window.spike.export());
      if (i === 0)
        await writeFile(
          `${output}/${engine}-artwork.png`,
          Buffer.from(exported.png.split(",")[1], "base64"),
        );
      delete exported.png;
      result.exports.push(exported);
    }
    result.scripts = Object.fromEntries(
      [...scripts].map(([url, size]) => [new URL(url).pathname, size]),
    );
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    result.finalMetrics = (await cdp.send("Performance.getMetrics")).metrics.filter((m) =>
      ["JSHeapUsedSize", "Nodes", "JSEventListeners"].includes(m.name),
    );
    await context.close();
    const touchContext = await browser.newContext({
      viewport: { width: 800, height: 1000 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    });
    const touch = await touchContext.newPage();
    await touch.goto(`http://127.0.0.1:3032/?engine=${engine}`);
    await touch.waitForFunction(() => window.spike);
    await touch.evaluate(() => {
      window.spike.reset();
      window.spike.select("object-7");
    });
    const tb = await touch.locator("#surface").boundingBox();
    const tn = await touch.evaluate(() => window.spike.nodes[7]);
    const tc = await touchContext.newCDPSession(touch);
    await tc.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: tb.x + tn.x * 2, y: tb.y + tn.y * 2 }],
    });
    for (let i = 1; i <= 8; i++)
      await tc.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: tb.x + tn.x * 2 + i * 5, y: tb.y + tn.y * 2 + i * 2.5 }],
      });
    await tc.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    result.checks.emulatedTouchDrag = await touch.evaluate(() => ({
      node: window.spike.nodes[7],
      commits: window.spike.commits,
    }));
    await touchContext.close();
    await writeFile(`${output}/measurements.json`, JSON.stringify(report, null, 2));
  }
} finally {
  await browser.close();
}
