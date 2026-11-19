import { describe, it, expect } from "vitest";
import { boundCamera, zoomAt, initialCamera } from "./camera";
import {
  defaultPanels,
  parsePanelPreferences,
  panelWidths,
  sheetSizes,
  nearestSheetSize,
  floatingPanel,
  inspectorSplit,
  mobileDock,
  mobilePanelWidth,
  sideSheetSizes,
} from "./panel-layout";
const g = {
  width: 400,
  height: 300,
  contentWidth: 360,
  contentHeight: 180,
  minimum: 25,
  maximum: 600,
};
describe("viewport camera", () => {
  it("keeps the same garment point under a pointer during zoom", () => {
    const camera = { zoom: 150, x: 20, y: -10 },
      anchor = { x: 75, y: 30 };
    const next = zoomAt(camera, 300, anchor, g);
    expect((anchor.x - next.x) / (next.zoom / 100)).toBeCloseTo(
      (anchor.x - camera.x) / (camera.zoom / 100),
    );
    expect((anchor.y - next.y) / (next.zoom / 100)).toBeCloseTo(
      (anchor.y - camera.y) / (camera.zoom / 100),
    );
  });
  it("permits clipped inspection while leaving a recoverable visible portion", () => {
    const next = boundCamera({ zoom: 400, x: 99999, y: -99999 }, g);
    expect((g.contentWidth * next.zoom) / 100).toBeGreaterThan(g.width);
    expect(next.x - (g.contentWidth * 4) / 2).toBeLessThan(g.width / 2);
    expect(next.y + (g.contentHeight * 4) / 2).toBeGreaterThan(-g.height / 2);
  });
  it("can bring every corner of either side of a paired garment to the center", () => {
    for (const x of [-g.contentWidth / 2, g.contentWidth / 2])
      for (const y of [-g.contentHeight / 2, g.contentHeight / 2]) {
        const camera = boundCamera({ zoom: 300, x: -x * 3, y: -y * 3 }, g);
        expect(x * 3 + camera.x).toBe(0);
        expect(y * 3 + camera.y).toBe(0);
      }
  });
  it("restores a centered fit and clamps extreme input without changing aspect", () => {
    expect(boundCamera(initialCamera, g)).toEqual(initialCamera);
    expect(boundCamera({ zoom: 10000, x: 0, y: 0 }, g).zoom).toBe(600);
    expect(boundCamera({ zoom: -20, x: 0, y: 0 }, g).zoom).toBe(25);
  });
});
describe("independent panel preferences", () => {
  it("migrates older panel preferences and validates all five docks and mobile widths", () => {
    expect(parsePanelPreferences('{"dock":"floating"}').mobileWidth).toBe(320);
    for (const dock of ["top", "bottom", "left", "right", "floating"] as const)
      expect(parsePanelPreferences(JSON.stringify({ dock, mobileWidth: 999 }))).toMatchObject({
        dock,
        mobileWidth: 440,
      });
    expect(parsePanelPreferences('{"mobileWidth":-50}').mobileWidth).toBe(284);
    expect(parsePanelPreferences('{"mobileWidth":null}').mobileWidth).toBe(320);
  });
  it("adapts short landscape docks without overwriting the saved portrait choice", () => {
    expect(mobileDock("bottom", 844, 390)).toBe("right");
    expect(mobileDock("top", 844, 390)).toBe("left");
    for (const dock of ["top", "bottom", "left", "right", "floating"] as const) {
      expect(mobileDock(dock, 390, 844)).toBe(dock);
      expect(mobileDock(dock, 768, 1024)).toBe(dock);
    }
  });
  it("bounds mobile widths, reserves a usable adjacent preview and recovers after rotation", () => {
    for (const width of [304, 374, 752, 828])
      for (const requested of [284, 320, 440]) {
        const beside = width >= 684;
        const result = mobilePanelWidth(width, requested, beside);
        expect(result.value).toBeGreaterThanOrEqual(284);
        expect(result.value).toBeLessThanOrEqual(width - (beside ? 308 : 0));
        expect(mobilePanelWidth(828, requested, true).value).toBe(requested);
      }
    for (const height of [220, 440, 850]) {
      const sizes = sideSheetSizes(height);
      expect(sizes.compact).toBeLessThan(sizes.medium);
      expect(sizes.medium).toBeLessThan(sizes.expanded);
      expect(sizes.expanded).toBe(height);
    }
  });
  it("keeps floating panels reachable after rotation and clamps saved positions", () => {
    for (const [w, h] of [
      [320, 420],
      [844, 220],
      [768, 850],
    ]) {
      for (const x of [-5, 0.5, 10])
        for (const y of [-5, 0.5, 10]) {
          const p = floatingPanel(w!, h!, 400, x, y);
          expect(p.left).toBeGreaterThanOrEqual(8);
          expect(p.top).toBeGreaterThanOrEqual(8);
          expect(p.left + p.width).toBeLessThanOrEqual(w! - 8);
          expect(p.top + p.height).toBeLessThanOrEqual(h! - 8);
        }
    }
    expect(parsePanelPreferences('{"floatX":9,"floatY":-2,"split":100}')).toMatchObject({
      floatX: 1,
      floatY: 0,
      split: 1,
    });
  });
  it("redistributes inspector space without sacrificing either section on short screens", () => {
    for (const height of [180, 300, 700])
      for (const ratio of [0, 0.2, 0.55, 0.9, 1]) {
        const s = inspectorSplit(height, ratio);
        expect(s.properties).toBeGreaterThanOrEqual(s.minimum);
        expect(s.available - s.properties).toBeGreaterThanOrEqual(s.minimum - 0.001);
        expect(s.properties + 12).toBeLessThan(height);
      }
  });
  it("validates persisted widths and recovers from corrupt storage", () => {
    expect(parsePanelPreferences("bad")).toEqual(defaultPanels);
    expect(
      parsePanelPreferences('{"library":999,"inspector":-40,"dock":"outside","size":"huge"}'),
    ).toEqual({ ...defaultPanels, library: 440, inspector: 260 });
  });
  it("preserves a usable camera at narrow desktop widths and releases collapsed space", () => {
    const prefs = { ...defaultPanels, library: 440, inspector: 440 };
    for (const width of [918, 1100, 1800]) {
      const both = panelWidths(width, prefs, { library: false, inspector: false });
      expect(width - both.library - both.inspector).toBeGreaterThanOrEqual(319.9);
      expect(both.library).toBeGreaterThanOrEqual(260);
      expect(both.inspector).toBeGreaterThanOrEqual(260);
      const closed = panelWidths(width, prefs, { library: true, inspector: false });
      expect(closed.library).toBe(44);
      expect(closed.inspector).toBe(440);
    }
  });
  it("uses bounded responsive snap points that survive rotation", () => {
    for (const [height, available] of [
      [568, 420],
      [844, 690],
      [390, 220],
    ]) {
      const sizes = sheetSizes(height!, available!);
      expect(sizes.compact).toBeLessThanOrEqual(sizes.medium);
      expect(sizes.medium).toBeLessThanOrEqual(sizes.expanded);
      expect(sizes.expanded).toBeLessThanOrEqual(available! * 0.62);
      expect(nearestSheetSize(-100, sizes)).toBe("compact");
      expect(nearestSheetSize(9999, sizes)).toBe("expanded");
    }
  });
});
