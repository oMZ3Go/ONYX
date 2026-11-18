import { expect, type Page } from "./browser-test";

export async function setStudioTheme(page: Page, theme: string) {
  if ((await page.locator(".ds-page").getAttribute("data-theme")) !== theme)
    await page.locator(".ds-appearance-toggle").click();
  await expect(page.locator(".ds-page")).toHaveAttribute("data-theme", theme);
  await expect(page.locator(".ds-theme-options")).toHaveCount(0);
}
