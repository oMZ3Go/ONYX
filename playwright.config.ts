import { defineConfig } from "@playwright/test";
const development = process.env.ONYX_E2E_DEV === "1";
const baseURL = `http://127.0.0.1:${development ? 3002 : 3000}`;
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 7000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: development ? "npm run dev -- --port 3002" : "npm run start -- --port 3000",
    url: `${baseURL}/ar`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
