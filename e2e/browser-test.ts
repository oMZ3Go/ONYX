import { test as base, expect } from "@playwright/test";
export { expect } from "@playwright/test";
export type { Page, Locator } from "@playwright/test";

/** Guard the whole suite, including clock-driven tests, against silent browser failures. */
export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        // The category test deliberately requests this missing route and asserts HTTP 404.
        const expected404 =
          testInfo.title.includes("all category destinations") &&
          message.location().url.endsWith("/categories/unknown") &&
          message.text().includes("404 (Not Found)");
        if (!expected404) errors.push(message.text());
      });
      await use(errors);
      if (errors.length)
        await testInfo.attach("browser-errors", {
          body: JSON.stringify(errors, null, 2),
          contentType: "application/json",
        });
      expect(errors, "Uncaught page or unexpected console errors").toEqual([]);
    },
    { auto: true },
  ],
});
