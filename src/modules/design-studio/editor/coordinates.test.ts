import { describe, expect, it } from "vitest";
import { fitViewport } from "../viewport";
import { workspaceAssets } from "../catalog/assets";
import {
  apply,
  clientToDocument,
  documentToClient,
  identity,
  inverse,
  multiply,
  objectToDocument,
  scale,
  translate,
  type SurfaceGeometry,
} from "./coordinates";

function geometry(zoom = 100): SurfaceGeometry {
  return {
    viewport: { left: 30, top: 90, width: 1000, height: 600 },
    scene: { width: 800, height: 430 },
    mockup: { x: 0, y: 0, cssPixelsPerSourcePixel: 0.5 },
    documentToMockup: identity,
    camera: { zoom, x: 50, y: -30 },
  };
}
describe("document and camera coordinates", () => {
  it("matches the existing centered CSS translate then scale, including captions", () => {
    expect(apply(documentToClient(geometry()), { x: 800, y: 400 })).toEqual({ x: 580, y: 345 });
    expect(apply(documentToClient(geometry(200)), { x: 800, y: 400 })).toEqual({ x: 580, y: 330 });
  });
  it("inverts synthetic calibration, pan, zoom and side offsets without rounding", () => {
    for (const zoom of [25, 100, 175, 600])
      for (const x of [-100, 0, 300]) {
        const g = {
          ...geometry(zoom),
          documentToMockup: multiply(translate(50, 80), scale(3)),
          mockup: { x: 410, y: 20, cssPixelsPerSourcePixel: 0.4 },
        };
        const p = { x, y: 123.456789 };
        const restored = clientToDocument(apply(documentToClient(g), p), g);
        expect(restored.x).toBeCloseTo(p.x, 10);
        expect(restored.y).toBeCloseTo(p.y, 10);
      }
  });
  it("fits separate side offsets in landscape and stacked portrait without RTL mirroring", () => {
    const images = [workspaceAssets.front, workspaceAssets.back];
    for (const stacked of [false, true]) {
      const fitted = fitViewport(700, 900, images, { stacked });
      const sourceScale = fitted.imageHeight / 887;
      const front = {
        ...geometry(),
        scene: fitted,
        mockup: { x: 0, y: 0, cssPixelsPerSourcePixel: sourceScale },
      };
      const back = {
        ...front,
        mockup: {
          ...front.mockup,
          x: stacked ? 0 : sourceScale * 1774 + 20,
          y: stacked ? fitted.imageHeight + 30 + 20 : 0,
        },
      };
      const a = apply(documentToClient(front), { x: 0, y: 0 }),
        b = apply(documentToClient(back), { x: 0, y: 0 });
      if (stacked) {
        expect(b.y).toBeGreaterThan(a.y);
        expect(b.x).toBe(a.x);
      } else {
        expect(b.x).toBeGreaterThan(a.x);
        expect(b.y).toBe(a.y);
      }
      // No locale or DPR enters either mapping. Increasing physical x always goes right.
      expect(apply(documentToClient(back), { x: 1, y: 0 }).x).toBeGreaterThan(b.x);
    }
  });
  it("uses clockwise rotation around the center and local flips before rotation", () => {
    const transform = {
      centerX: 100,
      centerY: 200,
      width: 40,
      height: 20,
      rotationDeg: 90,
      flipX: false,
      flipY: false,
    };
    expect(apply(objectToDocument(transform), { x: 0.5, y: 0 })).toEqual({ x: 100, y: 220 });
    expect(apply(objectToDocument({ ...transform, flipX: true }), { x: 0.5, y: 0 })).toEqual({
      x: 100,
      y: 180,
    });
  });
  it("keeps a document point stable through repeated camera round trips", () => {
    const original = { x: 100.123456789, y: 200.987654321 };
    let p = { ...original };
    for (let i = 0; i < 1000; i++) {
      const g = geometry(25 + (i % 575));
      p = clientToDocument(apply(documentToClient(g), p), g);
    }
    expect(p.x).toBeCloseTo(original.x, 8);
    expect(p.y).toBeCloseTo(original.y, 8);
  });
  it("rejects singular, nonfinite and invalid geometry instead of corrupting objects", () => {
    expect(() => inverse(scale(0))).toThrow();
    expect(() => inverse({ ...identity, a: Infinity })).toThrow();
    expect(() => documentToClient(geometry(0))).toThrow();
    expect(() => documentToClient(geometry(NaN))).toThrow();
    expect(() => apply(identity, { x: Infinity, y: 1 })).toThrow();
  });
});
