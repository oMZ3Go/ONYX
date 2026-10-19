import { chromium } from "@playwright/test";
/* global window, document, PerformanceObserver, performance, innerWidth */
import fs from "node:fs/promises";
import console from "node:console";
const browser = await chromium.launch();
const results = [];
try {
  for (const locale of ["ar", "en"])
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.addInitScript(() => {
        window.__onyxMetrics = { cls: 0, lcp: 0, longTasks: 0 };
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
        }).observe({ type: "longtask", buffered: true });
      });
      await page.goto(`http://127.0.0.1:3000/${locale}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(11000);
      results.push({
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
            imageBytes: resources
              .filter((r) => r.name.includes("/_next/image"))
              .reduce((n, r) => n + r.transferSize, 0),
            fonts: resources.filter((r) => r.name.includes("woff")).length,
            phase: document.querySelector(".hero-copy")?.dataset.phase,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        })),
      });
      await page.close();
    }
} finally {
  await browser.close();
}
await fs.mkdir(".cache/phase-01", { recursive: true });
await fs.writeFile(
  ".cache/phase-01/performance.json",
  JSON.stringify(
    {
      environment:
        "Local production build; Chromium; fresh contexts; no network/CPU throttling; 11-second observation. Not a Lighthouse score or field measurement.",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
