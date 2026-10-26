import { chromium } from "@playwright/test";
/* global window, document, PerformanceObserver, performance, innerWidth, URL */
import fs from "node:fs/promises";
import console from "node:console";
import process from "node:process";
import path from "node:path";
const output =
  process.argv.find((arg) => arg.endsWith(".json")) || ".cache/phase-01.1/performance.json";
const baseURL = process.env.ONYX_REVIEW_URL || "http://127.0.0.1:3000";
const throttled = process.argv.includes("--throttle");
const measureMotion = process.argv.includes("--motion");
const reducedMotion = process.argv.includes("--reduced");
const browser = await chromium.launch();
const results = [];
try {
  for (const locale of ["ar", "en"])
    for (const width of [390, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: reducedMotion ? "reduce" : "no-preference",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      if (throttled) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await cdp.send("Network.enable");
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 100,
          downloadThroughput: 500000,
          uploadThroughput: 125000,
        });
      }
      await page.addInitScript(() => {
        window.__onyxMetrics = { cls: 0, lcp: 0, longTasks: 0, longTaskMs: 0 };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) window.__onyxMetrics.cls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          const entry = list.getEntries().at(-1);
          if (entry) window.__onyxMetrics.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          window.__onyxMetrics.longTasks += list.getEntries().length;
          window.__onyxMetrics.longTaskMs += list
            .getEntries()
            .reduce((sum, entry) => sum + entry.duration, 0);
        }).observe({ type: "longtask", buffered: true });
      });
      await page.goto(`${baseURL}/${locale}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(11000);
      const result = {
        locale,
        width,
        ...(await page.evaluate(() => {
          const resources = performance.getEntriesByType("resource");
          return {
            ...window.__onyxMetrics,
            fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime,
            resourceBytes: resources.reduce((n, r) => n + r.transferSize, 0),
            javascriptBytes: resources
              .filter((r) => r.initiatorType === "script")
              .reduce((n, r) => n + r.transferSize, 0),
            cssBytes: resources
              .filter((r) => new URL(r.name).pathname.endsWith(".css"))
              .reduce((n, r) => n + r.transferSize, 0),
            imageBytes: resources
              .filter((r) => r.name.includes("/_next/image"))
              .reduce((n, r) => n + r.transferSize, 0),
            fonts: resources.filter((r) => r.name.includes("woff")).length,
            phase: document.querySelector(".hero-copy")?.dataset.phase,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        })),
      };
      if (measureMotion) {
        result.motion = [];
        for (const section of [
          "#home",
          "#how-it-works",
          "#offers",
          "#about",
          "#collection",
          "#categories",
          "footer",
        ]) {
          await page
            .locator(section)
            .evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
          const sample = await page.evaluate(
            () =>
              new Promise((resolve) => {
                const intervals = [];
                const start = performance.now();
                let previous;
                const frame = (now) => {
                  if (previous !== undefined) intervals.push(now - previous);
                  previous = now;
                  if (now - start < 1500) window.requestAnimationFrame(frame);
                  else {
                    intervals.sort((a, b) => a - b);
                    resolve({
                      frames: intervals.length,
                      medianMs: intervals[Math.floor(intervals.length / 2)],
                      p95Ms: intervals[Math.floor(intervals.length * 0.95)],
                      maxMs: intervals.at(-1),
                      over25ms: intervals.filter((ms) => ms > 25).length,
                    });
                  }
                };
                window.requestAnimationFrame(frame);
              }),
          );
          result.motion.push({ section, ...sample });
        }
      }
      result.completedPageTransferBytes = await page.evaluate(() =>
        [
          ...performance.getEntriesByType("navigation"),
          ...performance.getEntriesByType("resource"),
        ].reduce((total, entry) => total + (entry.transferSize || 0), 0),
      );
      result.completed = await page.evaluate(() => {
        const resources = performance.getEntriesByType("resource");
        return {
          ...window.__onyxMetrics,
          javascriptBytes: resources
            .filter((r) => r.initiatorType === "script")
            .reduce((sum, r) => sum + r.transferSize, 0),
          cssBytes: resources
            .filter((r) => new URL(r.name).pathname.endsWith(".css"))
            .reduce((sum, r) => sum + r.transferSize, 0),
          imageBytes: resources
            .filter(
              (r) =>
                r.name.includes("/_next/image") || /\.(png|webp)$/.test(new URL(r.name).pathname),
            )
            .reduce((sum, r) => sum + r.transferSize, 0),
          brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0)
            .length,
        };
      });
      result.errors = errors;
      results.push(result);
      await page.close();
    }
} finally {
  await browser.close();
}
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(
  output,
  JSON.stringify(
    {
      environment: `Local production build; Chromium; fresh contexts; ${reducedMotion ? "reduced motion" : "normal motion"}; ${throttled ? "4x CPU slowdown, 4 Mbps download / 1 Mbps upload, 100 ms latency" : "no network/CPU throttling"}; 11-second initial observation. Completed page transfer includes document and completed resources after section sampling. Not a Lighthouse score or field measurement.`,
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
