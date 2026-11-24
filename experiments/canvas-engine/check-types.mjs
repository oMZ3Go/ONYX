import { writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

const directory = fileURLToPath(new URL("../../.cache/canvas-engine/", import.meta.url));
await writeFile(
  new URL("../../.cache/canvas-engine/probe.tsx", import.meta.url),
  `
import { useRef } from "react";
import { Stage, Layer, Text, Transformer } from "react-konva";
import Konva from "konva";
import { Canvas, Textbox } from "fabric";
export function Probe() {
  const transformer = useRef<Konva.Transformer>(null);
  return <Stage width={600} height={700}><Layer>
    <Text text="مرحبا ONYX" direction="rtl" draggable
      onDragEnd={(event) => { const x: number = event.target.x(); void x; }} />
    <Transformer ref={transformer} flipEnabled={false} />
  </Layer></Stage>;
}
export async function fabricProbe(element: HTMLCanvasElement) {
  const canvas = new Canvas(element);
  canvas.add(new Textbox("مرحبا ONYX", { direction: "rtl" }));
  canvas.on("object:modified", ({ target }) => { const x: number = target.left; void x; });
  await canvas.dispose();
}
`,
);
const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL("../../node_modules/typescript/bin/tsc", import.meta.url)),
    "--noEmit",
    "--strict",
    "--skipLibCheck",
    "--jsx",
    "react-jsx",
    "--target",
    "ES2020",
    "--module",
    "esnext",
    "--moduleResolution",
    "bundler",
    "probe.tsx",
  ],
  { cwd: directory, stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
