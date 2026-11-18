import sharp from "sharp";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";

// Preview derivatives only. Source mockups and backgrounds are never overwritten.
const paths = [
  "hoodies/hoodie-black-front",
  "hoodies/hoodie-black-back",
  "backgrounds/canvas-dark",
  "backgrounds/canvas-light",
];
const inventory = [];
for (const path of paths) {
  const source = `public/images/design-studio/${path}.png`;
  const output = `public/images/design-studio/web/${path}.webp`;
  await mkdir(output.slice(0, output.lastIndexOf("/")), { recursive: true });
  const original = await readFile(source);
  const metadata = await sharp(original).metadata();
  const result = await sharp(original)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(output);
  inventory.push({
    source,
    output,
    sha256: createHash("sha256").update(original).digest("hex"),
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    width: result.width,
    height: result.height,
    hasAlpha: metadata.hasAlpha,
    originalBytes: original.length,
    webBytes: (await stat(output)).size,
  });
}
await mkdir("docs/phase-03", { recursive: true });
await writeFile("docs/phase-03/asset-inventory.json", JSON.stringify(inventory, null, 2) + "\n");
