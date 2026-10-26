import { test, expect, type Page, type Locator } from "./browser-test";

async function nextPaints(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
async function toggle(page: Page) {
  // Keep the process in view while operating the real React control.
  await page.locator(".motion-toggle").evaluate((el: HTMLButtonElement) => el.click());
}
async function visibility(page: Page, hidden: boolean) {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    for (let i = 0; i < 3; i++) document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}
async function frozen(page: Page, process: Locator) {
  const before = await process.innerHTML();
  await nextPaints(page);
  expect(await process.innerHTML()).toBe(before);
}

for (const locale of ["ar", "en"] as const) {
  test(`${locale}: native browser cancellation survives the complete process lifecycle`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    // Deliberately do NOT install page.clock: fake native functions masked the original bug.
    try {
      await page.goto(`/${locale}`);
      const process = page.locator("[data-process]");
      const enter = async () => {
        await process.scrollIntoViewIfNeeded();
        await expect(process).toHaveAttribute("data-process-paused", "false");
      };
      await enter();
      await expect(process).toHaveAttribute("data-process-state", "entrance");
      await toggle(page); // cancel a pending native requestAnimationFrame
      await expect(process).toHaveAttribute("data-process-paused", "true");
      await frozen(page, process);
      await visibility(page, true);
      await visibility(page, false);
      await frozen(page, process); // visibility must not override a manual pause
      await toggle(page);
      await expect(process).toHaveAttribute("data-process-paused", "false");
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await expect(process).toHaveAttribute("data-process-paused", "true");
      await frozen(page, process);
      await enter();
      await visibility(page, true);
      await expect(process).toHaveAttribute("data-process-paused", "true");
      await frozen(page, process);
      await visibility(page, false);
      await expect(process).toHaveAttribute("data-process-paused", "false");
      await expect(process).toHaveAttribute("data-process-state", "rest");
      await toggle(page); // cancel the pending native 12-second timeout
      await expect(process).toHaveAttribute("data-process-paused", "true");
      await frozen(page, process);
      await toggle(page);
      await visibility(page, true);
      await frozen(page, process);
      await visibility(page, false);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(process).toHaveAttribute("data-process-state", "static");
      for (const element of await process.locator(".step-title,p").all())
        await expect(element).toHaveCSS("opacity", "1");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(process).toHaveAttribute("data-process-state", "rest");
      const other = locale === "ar" ? "en" : "ar";
      await page
        .locator(`.language-switcher a[lang="${other}"]`)
        .evaluate((el: HTMLAnchorElement) => el.click());
      await expect(page).toHaveURL(new RegExp(`/${other}$`));
      await expect(page.locator("html")).toHaveAttribute("dir", other === "ar" ? "rtl" : "ltr");
      await enter();
      await expect(process).toHaveAttribute("data-process-state", "entrance");
      // Locale keys unmount/remount PageMotion through client navigation, first with a
      // frame pending, then with a timeout pending. No full document reload is involved.
      let activeLocale = other;
      for (const phase of ["entrance", "rest"]) {
        await expect(process).toHaveAttribute("data-process-state", phase);
        activeLocale = activeLocale === "ar" ? "en" : "ar";
        await page
          .locator(`.language-switcher a[lang="${activeLocale}"]`)
          .evaluate((el: HTMLAnchorElement) => el.click());
        await expect(page).toHaveURL(new RegExp(`/${activeLocale}$`));
        await expect(page.locator("html")).toHaveAttribute("lang", activeLocale);
        await enter();
        await expect(process).toHaveAttribute("data-process-state", "entrance");
        await visibility(page, true);
        await frozen(page, process);
        await visibility(page, false);
      }
      await toggle(page);
      await expect(process).toHaveAttribute("data-process-paused", "true");
      await frozen(page, process);
    } finally {
      await testInfo.attach("native-runtime-errors", {
        body: JSON.stringify(errors, null, 2),
        contentType: "application/json",
      });
      expect(errors, "No uncaught browser or console errors throughout the lifecycle").toEqual([]);
    }
  });
}
