import { cp, mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const destination = path.join(root, ".cache/canvas-engine");
await mkdir(path.join(destination, "public"), { recursive: true });
await cp(new URL("./app", import.meta.url), path.join(destination, "app"), { recursive: true });
for (const file of ["package.json", "next.config.mjs"]) {
  await copyFile(new URL(file, import.meta.url), path.join(destination, file));
}
// The lock belongs to the experiment, never the storefront dependency graph.
try {
  await copyFile(
    new URL("package-lock.json", import.meta.url),
    path.join(destination, "package-lock.json"),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const assets = {
  "arabic.woff2":
    "node_modules/@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2",
  "latin.woff2": "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  "artwork.png": "public/images/landing/design-studio/prints/print-crown.png",
  "noto-LICENSE.txt": "node_modules/@fontsource-variable/noto-sans-arabic/LICENSE",
  "inter-LICENSE.txt": "node_modules/@fontsource-variable/inter/LICENSE",
};
const hashes = {};
for (const [name, source] of Object.entries(assets)) {
  const bytes = await readFile(path.join(root, source));
  await writeFile(path.join(destination, "public", name), bytes);
  hashes[name] = createHash("sha256").update(bytes).digest("hex");
}
await writeFile(path.join(destination, "asset-hashes.json"), JSON.stringify(hashes, null, 2));
