import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import process from "node:process";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= fileURLToPath(
  new URL("../../.cache/ms-playwright/", import.meta.url),
);
const { chromium } = await import("@playwright/test");
const baseURL = process.env.ONYX_SPIKE_URL || "http://127.0.0.1:3032";
const browser = await chromium.launch();
const output = fileURLToPath(new URL("../../.cache/canvas-engine/results/", import.meta.url));
await mkdir(output, { recursive: true });
const report = {};
try {
  for (const engine of ["konva", "fabric", "svg"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${baseURL}/?engine=${engine}`);
    await page.waitForFunction(() => window.spike || window.spikeError);
    assert.equal(await page.evaluate(() => window.spikeError), undefined);
    const textarea = page.getByRole("textbox", { name: "Arabic text" });
    await textarea.fill("مرحبا أونيكس");
    await textarea.evaluate((e) => e.setSelectionRange(6, 12));
    await page.keyboard.insertText("ONYX");
    assert.equal(await page.evaluate(() => window.spike.nodes[0].text), "مرحبا ONYX");
    await textarea.press("Backspace");
    assert.equal(await page.evaluate(() => window.spike.nodes[0].text), "مرحبا ONY");
    await page.screenshot({ path: `${output}/${engine}-edited.png`, fullPage: true });
    const original = await page.evaluate(() => {
      window.spike.reset();
      return window.spike.nodes[9];
    });
    await page.evaluate(() => window.spike.patch("object-9", { x: 999 }));
    assert.deepEqual(await page.evaluate(() => window.spike.nodes[9]), original);
    await page.evaluate(() => {
      window.spike.reset();
      window.spike.select("object-7");
    });
    const first = await page.evaluate(() => window.spike.export());
    assert.equal(first.width, 3544);
    assert.equal(first.height, 4134);
    assert.deepEqual(first.cornerAlpha, [0, 0, 0]);
    const repeated = await page.evaluate(() => window.spike.export());
    // Selection, CSS camera and ambient DOM color must not enter isolated output.
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
      const host = document.getElementById("surface");
      host.style.transform = "translate(20px,10px) scale(1.5)";
      host.style.backgroundColor = "magenta";
      window.spike.select(null);
    });
    const second = await page.evaluate(() => window.spike.export());
    if (second.digest !== first.digest) {
      await writeFile(
        `${output}/${engine}-before-rtl.png`,
        Buffer.from(first.png.split(",")[1], "base64"),
      );
      await writeFile(
        `${output}/${engine}-after-rtl.png`,
        Buffer.from(second.png.split(",")[1], "base64"),
      );
    }
    const counts = [];
    for (let i = 0; i < 5; i++) counts.push(await page.evaluate(() => window.spike.remount()));
    assert.ok(
      counts.every(
        (c) =>
          c.canvases === (engine === "konva" ? 1 : engine === "fabric" ? 2 : 0) &&
          c.svg === (engine === "svg" ? 1 : 0),
      ),
    );
    const dprContext = await browser.newContext({ deviceScaleFactor: 2 });
    const dprPage = await dprContext.newPage();
    await dprPage.goto(`${baseURL}/?engine=${engine}`);
    await dprPage.waitForFunction(() => window.spike);
    const dprOutput = await dprPage.evaluate(() => window.spike.export());
    await dprContext.close();
    const accessibility = await page.locator("main").ariaSnapshot();
    assert.ok(accessibility.includes('textbox "Arabic text"'));
    assert.ok(accessibility.includes('spinbutton "X"'));
    assert.deepEqual(errors, []);
    const checks = {
      coldRepeatIdentical: repeated.digest === first.digest,
      cameraSelectionRtlInvariant: second.digest === repeated.digest,
      dprInvariant: dprOutput.digest === first.digest,
    };
    const passed = Object.values(checks).every(Boolean);
    report[engine] = {
      status: passed ? "passed" : "failed-export-fidelity",
      baseURL,
      errors,
      mountCounts: counts,
      editedText: "مرحبا ONY",
      exportDigests: {
        cold: first.digest,
        repeated: repeated.digest,
        workspaceChanged: second.digest,
        dpr2Cold: dprOutput.digest,
      },
      checks,
      accessibility,
    };
    await context.tracing.stop({
      path: `${output}/${engine}-${baseURL.includes("3033") ? "development" : "production"}.zip`,
    });
    await context.close();
  }
  await writeFile(
    `${output}/verification-${baseURL.includes("3033") ? "development" : "production"}.json`,
    JSON.stringify(report, null, 2),
  );
  if (Object.values(report).some((result) => result.status !== "passed")) process.exitCode = 1;
} finally {
  await browser.close();
}
