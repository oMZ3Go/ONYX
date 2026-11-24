import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { URL } from "node:url";
import process from "node:process";
import sharp from "sharp";

const manifest = {};
for (const id of ["crown", "dragon", "nature", "space"]) {
  const src = `/images/landing/design-studio/prints/print-${id}.png`;
  const bytes = await readFile(new URL(`../public${src}`, import.meta.url));
  const { width, height, format } = await sharp(bytes).metadata();
  if (format !== "png" || !width || !height) throw new Error(`Invalid original: ${id}`);
  manifest[id] = {
    src,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    byteLength: bytes.length,
    width,
    height,
  };
}
const path = new URL("../src/modules/design-studio/catalog/artwork-manifest.json", import.meta.url);
if (process.argv.includes("--check")) {
  if (JSON.stringify(JSON.parse(await readFile(path, "utf8"))) !== JSON.stringify(manifest))
    throw new Error(
      "Artwork manifest differs from original bytes; regenerate and review catalog revision.",
    );
} else await writeFile(path, JSON.stringify(manifest, null, 2) + "\n");
