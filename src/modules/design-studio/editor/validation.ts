import type { EditorProject } from "./document";

/** Provisional defensive parsing limits, not measured editor or print capacity. */
export const documentLimits = {
  objectsPerSide: 1000,
  assets: 1000,
  fonts: 100,
  textLength: 10000,
} as const;
type RecordValue = Record<string, unknown>;
function fail(path: string): never {
  throw new Error(`Invalid ONYX document: ${path}`);
}
function record(value: unknown, path: string): RecordValue {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    fail(path);
  return value as RecordValue;
}
function exact(value: unknown, keys: string[], path: string) {
  const r = record(value, path);
  if (Object.keys(r).length !== keys.length || keys.some((k) => !Object.hasOwn(r, k)))
    fail(`${path}.keys`);
  return r;
}
function string(value: unknown, path: string, max = 256): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > max) fail(path);
}
function id(value: unknown, path: string): asserts value is string {
  string(value, path);
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(value) ||
    ["__proto__", "constructor", "prototype"].includes(value)
  )
    fail(path);
}
function number(value: unknown, path: string, min = -1e7, max = 1e7): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
    fail(path);
}
function positive(value: unknown, path: string) {
  number(value, path, Number.MIN_VALUE);
}
function integer(value: unknown, path: string, min = 0) {
  number(value, path, min, Number.MAX_SAFE_INTEGER);
  if (!Number.isSafeInteger(value)) fail(path);
}
function boolean(value: unknown, path: string) {
  if (typeof value !== "boolean") fail(path);
}
function enumeration(value: unknown, choices: readonly unknown[], path: string) {
  if (!choices.includes(value)) fail(path);
}
function ref(value: unknown, path: string) {
  const r = exact(value, ["id", "revision"], path);
  id(r.id, `${path}.id`);
  string(r.revision, `${path}.revision`);
}
function manifest(value: unknown, path: string, max: number) {
  const r = record(value, path);
  if (Object.keys(r).length > max) fail(`${path}.budget`);
  for (const key of Object.keys(r)) id(key, `${path}.key`);
  return r;
}
function timestamp(value: unknown, path: string): asserts value is string {
  string(value, path);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) fail(path);
}

/** Pure structural validation followed by a detached copy; no fetch, renderer or active-state mutation. */
export function parseEditorProject(input: unknown): EditorProject {
  const p = exact(
    input,
    [
      "schemaVersion",
      "id",
      "revision",
      "createdAt",
      "updatedAt",
      "catalogRevision",
      "garment",
      "sides",
      "assets",
      "fonts",
      "productionSpecRef",
    ],
    "project",
  );
  if (p.schemaVersion !== 2) fail("schemaVersion (only version 2 is supported)");
  id(p.id, "id");
  integer(p.revision, "revision");
  timestamp(p.createdAt, "createdAt");
  timestamp(p.updatedAt, "updatedAt");
  if (Date.parse(p.updatedAt) < Date.parse(p.createdAt)) fail("updatedAt precedes createdAt");
  string(p.catalogRevision, "catalogRevision");
  const garment = exact(p.garment, ["productId", "variantId", "sizeId"], "garment");
  id(garment.productId, "garment.productId");
  id(garment.variantId, "garment.variantId");
  if (garment.sizeId !== null) id(garment.sizeId, "garment.sizeId");
  if (p.productionSpecRef !== null) ref(p.productionSpecRef, "productionSpecRef");
  const assets = manifest(p.assets, "assets", documentLimits.assets);
  for (const [key, value] of Object.entries(assets)) {
    const a = exact(
      value,
      ["id", "sha256", "mime", "byteLength", "pixels", "source"],
      `assets.${key}`,
    );
    if (a.id !== key) fail(`assets.${key}.id`);
    if (typeof a.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(a.sha256))
      fail(`assets.${key}.sha256`);
    enumeration(
      a.mime,
      ["image/png", "image/jpeg", "image/webp", "font/woff2"],
      `assets.${key}.mime`,
    );
    integer(a.byteLength, `assets.${key}.byteLength`, 1);
    if (a.mime === "font/woff2") {
      if (a.pixels !== null) fail(`assets.${key}.pixels`);
    } else {
      const pixels = exact(a.pixels, ["width", "height"], `assets.${key}.pixels`);
      integer(pixels.width, "pixels.width", 1);
      integer(pixels.height, "pixels.height", 1);
    }
    const source = record(a.source, "asset.source");
    if (source.kind === "catalog") {
      exact(source, ["kind", "ref"], "asset.source");
      ref(source.ref, "asset.source.ref");
    } else {
      exact(source, ["kind"], "asset.source");
      if (source.kind !== "local") fail("asset.source.kind");
    }
  }
  const fonts = manifest(p.fonts, "fonts", documentLimits.fonts);
  for (const [key, value] of Object.entries(fonts)) {
    const f = exact(
      value,
      ["id", "assetId", "family", "version", "license", "redistributable"],
      `fonts.${key}`,
    );
    if (f.id !== key) fail(`fonts.${key}.id`);
    id(f.assetId, "font.assetId");
    if (
      !Object.hasOwn(assets, f.assetId) ||
      record(assets[f.assetId], "font.asset").mime !== "font/woff2"
    )
      fail("font.assetId");
    for (const field of ["family", "version", "license"]) string(f[field], `font.${field}`);
    boolean(f.redistributable, "font.redistributable");
  }
  const sides = exact(p.sides, ["front", "back"], "sides");
  const seen = new Set<string>();
  for (const side of ["front", "back"]) {
    const s = exact(sides[side], ["space", "objectsById", "layerOrder"], `sides.${side}`);
    const space = record(s.space, "space");
    if (space.unit === "preview-px") {
      exact(space, ["unit", "width", "height", "mockup"], "space");
      ref(space.mockup, "space.mockup");
      if (p.productionSpecRef !== null) fail("preview space cannot be production calibrated");
    } else {
      exact(space, ["unit", "width", "height", "calibration"], "space");
      if (space.unit !== "mm" || p.productionSpecRef === null)
        fail("mm space requires a production reference");
      ref(space.calibration, "space.calibration");
    }
    positive(space.width, "space.width");
    positive(space.height, "space.height");
    const objects = manifest(s.objectsById, "objects", documentLimits.objectsPerSide);
    if (
      !Array.isArray(s.layerOrder) ||
      s.layerOrder.length !== Object.keys(objects).length ||
      new Set(s.layerOrder).size !== s.layerOrder.length
    )
      fail("layerOrder");
    for (const key of s.layerOrder) {
      id(key, "layerOrder.id");
      if (!Object.hasOwn(objects, key)) fail("layerOrder.missing");
    }
    for (const [key, value] of Object.entries(objects)) {
      const o = record(value, `objects.${key}`);
      const fields = ["id", "kind", "name", "visible", "locked", "opacity", "transform"];
      if (o.kind === "artwork") fields.push("artwork", "assetId", "rights");
      else if (o.kind === "image") fields.push("assetId", "crop");
      else if (o.kind === "text")
        fields.push(
          "text",
          "fontId",
          "fontSize",
          "weight",
          "style",
          "lineHeight",
          "align",
          "direction",
          "language",
          "fill",
        );
      else fail(`objects.${key}.kind`);
      exact(o, fields, `objects.${key}`);
      if (o.id !== key || seen.has(key)) fail(`objects.${key}.id`);
      seen.add(key);
      string(o.name, "object.name");
      boolean(o.visible, "object.visible");
      boolean(o.locked, "object.locked");
      number(o.opacity, "object.opacity", 0, 1);
      const t = exact(
        o.transform,
        ["centerX", "centerY", "width", "height", "rotationDeg", "flipX", "flipY"],
        "transform",
      );
      number(t.centerX, "transform.centerX");
      number(t.centerY, "transform.centerY");
      positive(t.width, "transform.width");
      positive(t.height, "transform.height");
      number(t.rotationDeg, "transform.rotationDeg", -180, 180);
      if (t.rotationDeg === 180) fail("rotationDeg uses [-180, 180)");
      boolean(t.flipX, "transform.flipX");
      boolean(t.flipY, "transform.flipY");
      if (o.kind === "text") {
        if (typeof o.text !== "string" || o.text.length > documentLimits.textLength) fail("text");
        id(o.fontId, "text.fontId");
        if (!Object.hasOwn(fonts, o.fontId)) fail("text.fontId");
        positive(o.fontSize, "text.fontSize");
        positive(o.lineHeight, "text.lineHeight");
        integer(o.weight, "text.weight", 1);
        number(o.weight, "text.weight", 1, 1000);
        enumeration(o.style, ["normal", "italic"], "text.style");
        enumeration(o.align, ["left", "center", "right"], "text.align");
        enumeration(o.direction, ["ltr", "rtl"], "text.direction");
        string(o.language, "text.language", 64);
        if (typeof o.fill !== "string" || !/^#[a-fA-F0-9]{6}$/.test(o.fill)) fail("text.fill");
      } else {
        id(o.assetId, "object.assetId");
        if (!Object.hasOwn(assets, o.assetId)) fail("object.assetId");
        const asset = record(assets[o.assetId], "asset");
        if (asset.mime === "font/woff2") fail("image.assetId");
        if (o.kind === "artwork") {
          ref(o.artwork, "artwork");
          const r = exact(o.rights, ["status", "commercialUse", "attribution"], "rights");
          enumeration(r.status, ["unverified", "provisional", "approved"], "rights.status");
          boolean(r.commercialUse, "rights.commercialUse");
          if (r.attribution !== null) string(r.attribution, "rights.attribution", 2000);
        } else {
          const c = exact(o.crop, ["x", "y", "width", "height"], "crop"),
            pixels = record(asset.pixels, "pixels");
          number(c.x, "crop.x", 0);
          number(c.y, "crop.y", 0);
          positive(c.width, "crop.width");
          positive(c.height, "crop.height");
          if (
            (c.x as number) + (c.width as number) > (pixels.width as number) ||
            (c.y as number) + (c.height as number) > (pixels.height as number)
          )
            fail("crop.bounds");
        }
      }
    }
  }
  return structuredClone(input) as EditorProject;
}
