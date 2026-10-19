import { existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import process from "node:process";
import console from "node:console";

const require = createRequire(import.meta.url);
const localCache = fileURLToPath(new URL("../.cache/ms-playwright", import.meta.url));
const env = { ...process.env };
// Reuse the interrupted session's browser installation without affecting explicit paths or CI.
if (!env.PLAYWRIGHT_BROWSERS_PATH && !env.CI && existsSync(localCache)) {
  env.PLAYWRIGHT_BROWSERS_PATH = localCache;
}
console.log(`Playwright browser cache: ${env.PLAYWRIGHT_BROWSERS_PATH || "system default"}`);
const child = spawn(
  process.execPath,
  [require.resolve("@playwright/test/cli"), ...process.argv.slice(2)],
  {
    env,
    stdio: "inherit",
  },
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
