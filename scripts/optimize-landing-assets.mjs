import fs from "node:fs/promises";
import process from "node:process";
import console from "node:console";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
const source = path.resolve("public/images/landing");
const studioOnly = process.argv.includes("--studio");
const files = (await fs.readdir(source, { recursive: true })).filter(
  (file) => file.endsWith(".png") && (!studioOnly || file.startsWith("design-studio")),
);
const inventory = [];
for (const file of files) {
  const input = path.join(source, file);
  const output = path.join(source, "web", file.replace(/\.png$/, ".webp"));
  const original = await fs.readFile(input);
  const metadata = await sharp(original).metadata();
  const isNote = file.includes("note-");
  const isStudio = file.startsWith("design-studio");
  const max = isStudio
    ? file.includes("hoodie-")
      ? 1200
      : file.includes("print-")
        ? 600
        : 1000
    : file.includes("categories")
      ? 700
      : file.includes("product-")
        ? 900
        : file.includes("offer-hoodie")
          ? 1000
          : file.includes("story-model")
            ? 1400
            : file.includes("story-background")
              ? 1600
              : file.includes("offer-background")
                ? 1800
                : isNote
                  ? file.includes("wear-your")
                    ? 600
                    : 500
                  : 1920;
  await fs.mkdir(path.dirname(output), { recursive: true });
  const result = await sharp(original)
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .webp({ quality: isNote ? 90 : 84, alphaQuality: 100, effort: 6 })
    .toFile(output);
  inventory.push({
    source: input.slice(process.cwd().length + 1).replaceAll("\\", "/"),
    sha256: crypto.createHash("sha256").update(original).digest("hex"),
    originalBytes: original.length,
    width: metadata.width,
    height: metadata.height,
    hasAlpha: metadata.hasAlpha,
    outputWidth: result.width,
    outputHeight: result.height,
    webBytes: result.size,
  });
}
const inventories = new Map();
for (const item of inventory) {
  const phase = item.source.includes("/design-studio/") ? "phase-02" : "phase-01";
  if (!inventories.has(phase)) inventories.set(phase, []);
  inventories.get(phase).push(item);
}
for (const [phase, items] of inventories) {
  await fs.mkdir(`docs/${phase}`, { recursive: true });
  await fs.writeFile(`docs/${phase}/asset-inventory.json`, JSON.stringify(items, null, 2) + "\n");
}
console.log(
  `Optimized ${inventory.length} originals without modifying them. ${inventory.reduce((n, a) => n + a.originalBytes, 0)} → ${inventory.reduce((n, a) => n + a.webBytes, 0)} bytes.`,
);
