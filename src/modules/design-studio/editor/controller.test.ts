import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fixtureStudioCatalog as catalog } from "../catalog/fixtures";
import manifest from "../catalog/artwork-manifest.json";
import { createProject } from "../state";
import { migrateProject } from "./migration";
import { EditorController, HISTORY_LIMIT, bounds } from "./controller";
import { resolveCatalogSource } from "./catalog-assets";
import { clientToPreview } from "./coordinates";
import type { StudioCatalog } from "../types";

function setup(source: StudioCatalog = catalog) {
  let id = 0;
  return new EditorController(
    migrateProject(createProject(catalog.revision, "onyx-hoodie", "hoodie-black"), catalog, {
      id: "test",
      now: "2026-11-22T00:00:00.000Z",
    }),
    source,
    () => "2026-11-22T01:00:00.000Z",
    () => `object-${++id}`,
  );
}
const object = (c: EditorController, side: "front" | "back" = "back", id = "object-1") =>
  c.getSnapshot().project.sides[side].objectsById[id]!;
describe("canonical artwork commands", () => {
  it("clipping is presentation state and preserves history and document identity", () => {
    const c = setup();
    c.add("back", "crown");
    const project = c.getSnapshot().project;
    c.setClip(false);
    expect(c.getSnapshot().project).toBe(project);
    expect(c.getSnapshot().undoCount).toBe(1);
    c.history("undo");
    expect(c.getSnapshot().clipGarment).toBe(false);
    c.history("redo");
    expect(c.getSnapshot().clipGarment).toBe(false);
  });
  it("context actions center a group on its garment side and lock it atomically", () => {
    const c = setup();
    c.add("back", "crown");
    c.duplicate();
    c.select("back", ["object-1"], true);
    const delta = object(c, "back", "object-2").transform.centerX - object(c).transform.centerX;
    c.centerSelection("x");
    expect(bounds([object(c).transform, object(c, "back", "object-2").transform]).centerX).toBe(
      887,
    );
    expect(object(c, "back", "object-2").transform.centerX - object(c).transform.centerX).toBe(
      delta,
    );
    const count = c.getSnapshot().undoCount;
    c.lockSelection();
    expect(c.getSnapshot().undoCount).toBe(count + 1);
    expect(object(c).locked).toBe(true);
    expect(object(c, "back", "object-2").locked).toBe(true);
    c.history("undo");
    expect(object(c).locked).toBe(false);
  });
  it("locks only objects represented in the visible selection toolbar", () => {
    const c = setup();
    c.add("back", "crown");
    c.duplicate();
    c.flag("object-1", "visible");
    c.select("back", ["object-1"], true);
    c.lockSelection();
    expect(object(c, "back", "object-2").locked).toBe(true);
    expect(object(c).locked).toBe(false);
    c.lockSelection();
    expect(object(c, "back", "object-2").locked).toBe(false);
  });
  it("single-step layer movement preserves selected relative order", () => {
    const c = setup();
    c.add("back", "crown");
    c.duplicate();
    c.duplicate();
    c.select("back", ["object-1"]);
    c.stepOrder("forward");
    expect(c.getSnapshot().project.sides.back.layerOrder).toEqual([
      "object-2",
      "object-1",
      "object-3",
    ]);
    c.stepOrder("backward");
    expect(c.getSnapshot().project.sides.back.layerOrder).toEqual([
      "object-1",
      "object-2",
      "object-3",
    ]);
  });
  it("verifies every catalog manifest against the original bytes", () => {
    for (const entry of Object.values(manifest)) {
      const bytes = readFileSync(`public${entry.src}`);
      expect(bytes.length).toBe(entry.byteLength);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(entry.sha256);
      expect(bytes.readUInt32BE(16)).toBe(entry.width);
      expect(bytes.readUInt32BE(20)).toBe(entry.height);
    }
  });
  it("inserts explicit independent sides, with original aspect and rights", () => {
    const c = setup();
    c.add("back", "dragon");
    expect(c.getSnapshot().project.sides.front.layerOrder).toEqual([]);
    expect(object(c).transform.width / object(c).transform.height).toBeCloseTo(1122 / 1402);
    expect(object(c)).toMatchObject({
      kind: "artwork",
      rights: { status: "provisional", commercialUse: false },
    });
    c.add("front", "crown");
    expect(object(c, "front", "object-2").id).not.toBe(object(c).id);
    expect(c.getSnapshot().undoCount).toBe(2);
  });
  it.each(["unknown", "__proto__", "constructor"])(
    "rejects invalid reference %s atomically",
    (id) => {
      const c = setup(),
        before = c.getSnapshot();
      expect(() => c.add("front", id)).toThrow();
      expect(c.getSnapshot()).toBe(before);
    },
  );
  it("rejects incompatible and stale catalog references", () => {
    const source = {
      ...catalog,
      artworks: catalog.artworks.map((a) => ({
        ...a,
        compatibility: { productIds: ["other"], variantIds: null },
      })),
    };
    expect(() => setup(source).add("back", "crown")).toThrow();
    expect(() => setup({ ...catalog, revision: "stale" }).add("back", "crown")).toThrow();
  });
  it("rejects asset identity mismatch", () => {
    const c = setup();
    c.add("back", "crown");
    const asset = Object.values(c.getSnapshot().project.assets)[0]!;
    expect(resolveCatalogSource(asset)).toBe(manifest.crown.src);
    expect(() => resolveCatalogSource({ ...asset, sha256: "a".repeat(64) })).toThrow();
  });
  it("keeps all intermediate samples transient and commits one gesture", () => {
    const c = setup();
    c.add("back", "crown");
    const before = c.getSnapshot().project,
      t = object(c).transform;
    c.begin();
    for (let x = 1; x <= 50; x++) c.preview({ "object-1": { ...t, centerX: t.centerX + x } });
    expect(c.getSnapshot().project).toBe(before);
    expect(c.getSnapshot().undoCount).toBe(1);
    c.finish();
    expect(object(c).transform.centerX).toBe(t.centerX + 50);
    expect(c.getSnapshot().undoCount).toBe(2);
    c.history("undo");
    expect(object(c).transform).toEqual(t);
    c.history("redo");
    expect(object(c).transform.centerX).toBe(t.centerX + 50);
  });
  it("cancellation and stale callbacks cannot create history or clear redo", () => {
    const c = setup();
    c.add("back", "crown");
    c.numeric("centerX", 900);
    c.history("undo");
    const before = c.getSnapshot().project;
    c.begin();
    c.preview({ "object-1": { ...object(c).transform, centerX: 123 } });
    c.cancel();
    c.finish();
    c.preview({ "object-1": { ...object(c).transform, centerX: 456 } });
    expect(c.getSnapshot().project).toBe(before);
    expect(c.getSnapshot().redoCount).toBe(1);
    c.begin();
    c.setView("front");
    c.finish();
    expect(c.getSnapshot().project).toBe(before);
  });
  it("rejects invalid transforms atomically and normalizes rotation", () => {
    const c = setup();
    c.add("back", "crown");
    const before = c.getSnapshot().project;
    for (const width of [0, -1, NaN, Infinity])
      expect(() =>
        c.transforms("back", { "object-1": { ...object(c).transform, width } }),
      ).toThrow();
    expect(c.getSnapshot().project).toBe(before);
    c.numeric("rotationDeg", 450);
    expect(object(c).transform.rotationDeg).toBe(90);
  });
  it("numeric sizing preserves aspect ratio", () => {
    const c = setup();
    c.add("back", "dragon");
    c.numeric("width", 350);
    expect(object(c).transform.height).toBeCloseTo((350 * 1402) / 1122);
    c.numeric("height", 250);
    expect(object(c).transform.width).toBeCloseTo((250 * 1122) / 1402);
  });
  it("ignores stale gesture samples and pointerup after a new gesture starts", () => {
    const c = setup();
    c.add("back", "crown");
    c.begin();
    const old = c.getGesture()!.id;
    c.cancel();
    c.begin();
    const current = c.getGesture()!.id;
    c.preview({ "object-1": { ...object(c).transform, centerX: 20 } }, old);
    c.finish(old);
    expect(c.getGesture()!.id).toBe(current);
    expect(c.getSnapshot().transient).toEqual({});
    c.preview({ "object-1": { ...object(c).transform, centerX: 30 } }, current);
    c.finish(current);
    expect(object(c).transform.centerX).toBe(30);
    expect(c.getSnapshot().undoCount).toBe(2);
  });
  it("duplicate/delete and undo retain exact layer order and stable IDs", () => {
    const c = setup();
    c.add("back", "crown");
    c.duplicate();
    expect(object(c, "back", "object-2").transform.centerX).toBe(object(c).transform.centerX + 20);
    c.order("back");
    expect(c.getSnapshot().project.sides.back.layerOrder).toEqual(["object-2", "object-1"]);
    c.remove();
    expect(c.getSnapshot().project.sides.back.layerOrder).toEqual(["object-1"]);
    c.history("undo");
    expect(c.getSnapshot().project.sides.back.layerOrder).toEqual(["object-2", "object-1"]);
  });
  it("protects locked/hidden objects from transform, duplicate, delete and order", () => {
    const c = setup();
    c.add("back", "crown");
    c.flag("object-1", "locked");
    const before = c.getSnapshot().project;
    c.numeric("centerX", 1);
    c.duplicate();
    c.remove();
    c.order("back");
    c.flag("object-1", "visible");
    expect(c.begin()).toBe(false);
    expect(c.getSnapshot().project).toBe(before);
    expect(() =>
      c.transforms("back", { "object-1": { ...object(c).transform, centerX: 1 } }),
    ).toThrow();
    c.flag("object-1", "locked");
    c.flag("object-1", "visible");
    expect(c.begin()).toBe(false);
  });
  it("multi-selection has no history and alignment uses rotated visual bounds", () => {
    const c = setup();
    c.add("back", "crown");
    c.numeric("rotationDeg", 45);
    c.duplicate();
    const revision = c.getSnapshot().project.revision;
    c.select("back", ["object-1"], true);
    expect(c.getSnapshot().project.revision).toBe(revision);
    c.align("left");
    const a = bounds([object(c).transform]),
      b = bounds([object(c, "back", "object-2").transform]);
    expect(a.left).toBeCloseTo(b.left);
  });
  it("history stays side-specific and revisions advance through undo/redo", () => {
    const c = setup();
    c.add("front", "crown");
    c.add("back", "dragon");
    const revision = c.getSnapshot().project.revision;
    c.setView("front");
    c.history("undo");
    expect(c.getSnapshot().view).toBe("back");
    expect(c.getSnapshot().project.sides.front.layerOrder).toHaveLength(1);
    expect(c.getSnapshot().project.sides.back.layerOrder).toHaveLength(0);
    c.history("redo");
    expect(c.getSnapshot().project.revision).toBe(revision + 2);
  });
  it("new edits clear redo but no-ops do not", () => {
    const c = setup();
    c.add("back", "crown");
    c.numeric("centerX", 900);
    c.history("undo");
    c.numeric("centerX", object(c).transform.centerX);
    expect(c.getSnapshot().redoCount).toBe(1);
    c.numeric("centerX", 800);
    expect(c.getSnapshot().redoCount).toBe(0);
  });
  it("bounds history and never embeds bytes or renderer state", () => {
    const c = setup();
    c.add("back", "crown");
    for (let x = 1; x <= 120; x++) c.numeric("centerX", x);
    expect(c.getSnapshot().undoCount).toBe(HISTORY_LIMIT);
    const json = JSON.stringify(c.getSnapshot().project);
    expect(json).not.toMatch(/data:|blob:|canvas|viewport|camera/);
    expect(json.length).toBeLessThan(3000);
  });
  it("maps measured image coordinates without mirroring or camera double application", () => {
    const space = { width: 1774, height: 887 };
    expect(
      clientToPreview({ x: 600, y: 300 }, { left: 100, top: 50, width: 1000, height: 500 }, space),
    ).toEqual({ x: 887, y: 443.5 });
    const left = clientToPreview(
      { x: 500, y: 300 },
      { left: 100, top: 50, width: 1000, height: 500 },
      space,
    );
    expect(left.x).toBeLessThan(887);
  });
});
