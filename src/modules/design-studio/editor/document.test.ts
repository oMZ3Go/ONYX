import { describe, expect, it } from "vitest";
import { fixtureStudioCatalog } from "../catalog/fixtures";
import { createProject } from "../state";
import { migrateProject } from "./migration";
import { parseEditorProject } from "./validation";
import type { EditorProject } from "./document";

const identity = { id: "project-1", now: "2026-11-21T12:00:00.000Z" };
const shell = () => createProject(fixtureStudioCatalog.revision, "onyx-hoodie", "hoodie-black");
function fixture(): EditorProject {
  const p = migrateProject(shell(), fixtureStudioCatalog, identity);
  return {
    ...p,
    assets: {
      crown: {
        id: "crown",
        sha256: "a".repeat(64),
        mime: "image/png",
        byteLength: 100,
        pixels: { width: 364, height: 368 },
        source: { kind: "catalog", ref: { id: "crown", revision: "source-1" } },
      },
      arabic: {
        id: "arabic",
        sha256: "b".repeat(64),
        mime: "font/woff2",
        byteLength: 100,
        pixels: null,
        source: { kind: "local" },
      },
    },
    fonts: {
      noto: {
        id: "noto",
        assetId: "arabic",
        family: "Noto Sans Arabic",
        version: "5.3.0",
        license: "OFL-1.1",
        redistributable: true,
      },
    },
    sides: {
      ...p.sides,
      front: {
        ...p.sides.front,
        layerOrder: ["art-1", "text-1", "image-1"],
        objectsById: {
          "art-1": {
            id: "art-1",
            kind: "artwork",
            name: "Crown",
            visible: true,
            locked: false,
            opacity: 1,
            transform: {
              centerX: 200,
              centerY: 150,
              width: 100,
              height: 100,
              rotationDeg: -45,
              flipX: false,
              flipY: true,
            },
            artwork: { id: "crown", revision: "source-1" },
            assetId: "crown",
            rights: { status: "unverified", commercialUse: false, attribution: null },
          },
          "text-1": {
            id: "text-1",
            kind: "text",
            name: "Arabic",
            visible: true,
            locked: true,
            opacity: 0.5,
            transform: {
              centerX: 200,
              centerY: 300,
              width: 300,
              height: 100,
              rotationDeg: 0,
              flipX: false,
              flipY: false,
            },
            text: "مُحَمَّد\nONYX 2026 — سوريا",
            fontId: "noto",
            fontSize: 28,
            weight: 400,
            style: "normal",
            lineHeight: 1.4,
            align: "right",
            direction: "rtl",
            language: "ar",
            fill: "#ffffff",
          },
          "image-1": {
            id: "image-1",
            kind: "image",
            name: "Crop",
            visible: true,
            locked: false,
            opacity: 1,
            transform: {
              centerX: 10,
              centerY: 20,
              width: 60,
              height: 80,
              rotationDeg: 0,
              flipX: false,
              flipY: false,
            },
            assetId: "crown",
            crop: { x: 1, y: 2, width: 100, height: 200 },
          },
        },
      },
    },
  };
}
// Tests deliberately mutate untrusted input copies to exercise the runtime boundary.
type Mutable<T> = { -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K] };
function mutable() {
  return structuredClone(fixture()) as Mutable<EditorProject>;
}
describe("editor project boundary", () => {
  it("migrates only empty v1, preserves references, and creates independent uncalibrated sides", () => {
    const old = shell(),
      snapshot = structuredClone(old);
    const p = migrateProject(old, fixtureStudioCatalog, identity);
    expect(p.schemaVersion).toBe(2);
    expect(p.garment).toEqual({ ...old.garment, sizeId: null });
    expect(p.productionSpecRef).toBeNull();
    expect(p.sides.front.space).toMatchObject({ unit: "preview-px", width: 1774, height: 887 });
    expect(p.sides.front).not.toBe(p.sides.back);
    expect(p.sides.front.objectsById).not.toBe(p.sides.back.objectsById);
    expect(old).toEqual(snapshot);
  });
  it("round-trips Unicode, layers, transforms and manifest identity as plain JSON", () => {
    const original = fixture(),
      parsed = parseEditorProject(JSON.parse(JSON.stringify(original)));
    expect(parsed).toEqual(original);
    expect(parsed.sides.front).not.toBe(original.sides.front);
    expect(migrateProject(parsed, fixtureStudioCatalog, identity)).toEqual(original);
  });
  it("does not mutate or replace active work when staging fails", () => {
    const active = fixture(),
      snapshot = structuredClone(active),
      bad = mutable();
    bad.sides.front.layerOrder.push("missing");
    expect(() => parseEditorProject(bad)).toThrow();
    expect(active).toEqual(snapshot);
  });
  it.each([NaN, Infinity, -Infinity, 0, -1])("rejects invalid dimensions %s", (width) => {
    const p = mutable();
    p.sides.front.objectsById["art-1"]!.transform.width = width;
    expect(() => parseEditorProject(p)).toThrow();
  });
  it.each([
    (p: Mutable<EditorProject>) => {
      p.sides.front.layerOrder[1] = "art-1";
    },
    (p: Mutable<EditorProject>) => {
      p.sides.front.layerOrder.pop();
    },
    (p: Mutable<EditorProject>) => {
      p.sides.front.objectsById["art-1"]!.opacity = 2;
    },
    (p: Mutable<EditorProject>) => {
      p.sides.front.objectsById["art-1"]!.transform.rotationDeg = 180;
    },
    (p: Mutable<EditorProject>) => {
      p.sides.back.objectsById["art-1"] = p.sides.front.objectsById["art-1"]!;
      p.sides.back.layerOrder.push("art-1");
    },
    (p: Mutable<EditorProject>) => {
      delete p.assets.crown;
    },
    (p: Mutable<EditorProject>) => {
      delete p.fonts.noto;
    },
    (p: Mutable<EditorProject>) => {
      p.assets.crown!.sha256 = "invalid";
    },
    (p: Mutable<EditorProject>) => {
      p.productionSpecRef = { id: "invented", revision: "1" };
    },
    (p: Mutable<EditorProject>) => {
      p.revision = -1;
    },
    (p: Mutable<EditorProject>) => {
      p.updatedAt = "yesterday";
    },
    (p: Mutable<EditorProject>) => {
      p.updatedAt = "2020-01-01T00:00:00.000Z";
    },
  ])("rejects inconsistent documents", (corrupt) => {
    const p = mutable();
    corrupt(p);
    expect(() => parseEditorProject(p)).toThrow();
  });
  it("rejects crop overflow, URLs, unknown fields/kinds and prototype keys", () => {
    const p = fixture();
    const serialized = JSON.stringify(p);
    const inputs = [
      serialized.replace('"width":100,"height":200', '"width":10000,"height":200'),
      serialized.replace('"kind":"local"', '"kind":"local","url":"blob:temporary"'),
      serialized.replace('"kind":"artwork"', '"kind":"group"'),
      serialized.replace('"art-1":{', '"__proto__":{'),
    ];
    for (const input of inputs) expect(() => parseEditorProject(JSON.parse(input))).toThrow();
    expect(() => parseEditorProject({ ...p, camera: { zoom: 100 } })).toThrow();
    expect(() => parseEditorProject({ ...p, schemaVersion: 3 })).toThrow();
  });
  it("rejects unknown v1 content, references and catalog revisions instead of dropping data", () => {
    const s = shell();
    for (const input of [
      { ...s, schemaVersion: 99 },
      { ...s, catalogRevision: "old" },
      { ...s, garment: { ...s.garment, variantId: "missing" } },
      { ...s, sides: { ...s.sides, front: { elements: [{ id: "legacy" }] } } },
      { ...s, unknown: true },
    ])
      expect(() => migrateProject(input, fixtureStudioCatalog, identity)).toThrow();
  });
  it("requires explicit physical calibration references for millimetre documents", () => {
    const p = fixture();
    const space = {
      unit: "mm" as const,
      width: 300,
      height: 350,
      calibration: { id: "synthetic-test-only", revision: "1" },
    };
    const physical = {
      ...p,
      productionSpecRef: { id: "synthetic-test-only", revision: "1" },
      sides: { front: { ...p.sides.front, space }, back: { ...p.sides.back, space } },
    };
    expect(parseEditorProject(physical)).toEqual(physical);
    expect(() => parseEditorProject({ ...physical, productionSpecRef: null })).toThrow();
  });
  it("bounds text and object count before rendering", () => {
    const p = mutable();
    const text = p.sides.front.objectsById["text-1"]!;
    if (text.kind === "text") text.text = "a".repeat(10001);
    expect(() => parseEditorProject(p)).toThrow();
    const many = mutable();
    for (let i = 0; i < 1001; i++) {
      const id = `extra-${i}`;
      many.sides.back.objectsById[id] = { ...many.sides.front.objectsById["art-1"]!, id };
      many.sides.back.layerOrder.push(id);
    }
    expect(() => parseEditorProject(many)).toThrow();
  });
});
