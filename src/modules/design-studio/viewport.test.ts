import { describe, expect, it } from "vitest";
import { artworkViewport, clampZoom, fitViewport } from "./viewport";

const wide = { src: "/front.webp", originalSrc: "/front.png", width: 1600, height: 800 };
describe("preview viewport geometry", () => {
  it("contains the complete view and captions at Fit-to-Screen on short and narrow screens", () => {
    for (const [width, height] of [
      [296, 96],
      [366, 320],
      [728, 640],
      [610, 220],
      [1140, 660],
    ]) {
      for (const images of [[wide], [wide, wide], [{ ...wide, width: 800, height: 1600 }]]) {
        const fit = fitViewport(width!, height!, images);
        expect(fit.width).toBeLessThanOrEqual(width! - 16);
        expect(fit.height).toBeLessThanOrEqual(height! - 16);
        expect(fit.minimum).toBeLessThanOrEqual(100);
        expect(fit.maximum).toBeGreaterThanOrEqual(300);
        expect(
          Math.max(
            (fit.width * fit.maximum) / 100 - width!,
            (fit.height * fit.maximum) / 100 - height!,
          ),
        ).toBeGreaterThan(0);
      }
    }
  });
  it("keeps different front/back proportions when fitting a pair", () => {
    const images = [wide, { ...wide, width: 800, height: 1600 }];
    const fit = fitViewport(780, 520, images);
    const imageHeight = fit.height - 30;
    expect(fit.width).toBeCloseTo(imageHeight * (2 + 0.5) + 20);
    expect(fit.mockups[1]!.x).toBeCloseTo(imageHeight * 2 + 20);
  });
  it("registers each unclipped canvas to its own image while keeping its allocation viewport-sized", () => {
    const viewport = { width: 390, height: 760 };
    const fit = fitViewport(viewport.width, viewport.height, [wide, wide], {
      stacked: true,
      captions: false,
    });
    for (const zoom of [25, 100, 300]) {
      const camera = { x: 28, y: -41, zoom };
      const front = artworkViewport(viewport, fit, 0, camera);
      const back = artworkViewport(viewport, fit, 1, camera);
      expect(front.width).toBe(viewport.width);
      expect(back.height).toBe(viewport.height);
      expect(back.originX).toBe(front.originX);
      expect(back.originY - front.originY).toBeCloseTo(((fit.imageHeight + 20) * zoom) / 100);
      expect(front.originX + (fit.width * zoom) / 200).toBeCloseTo(viewport.width / 2 + camera.x);
      expect(front.originY + (fit.height * zoom) / 200).toBeCloseTo(viewport.height / 2 + camera.y);
    }
  });
  it("clamps zoom to the independent inspection range", () => {
    const roomy = fitViewport(1100, 220, [wide]);
    const narrow = fitViewport(300, 700, [wide]);
    expect(narrow.maximum).toBeGreaterThanOrEqual(300);
    expect(clampZoom(1000, narrow.minimum, narrow.maximum)).toBe(narrow.maximum);
    expect(clampZoom(0, roomy.minimum, roomy.maximum)).toBe(roomy.minimum);
    expect(clampZoom(100, roomy.minimum, roomy.maximum)).toBe(100);
  });
  it("fits a portrait fullscreen pair without stretching either asset", () => {
    for (const [width, height] of [
      [320, 498],
      [390, 774],
    ]) {
      const fit = fitViewport(width!, height!, [wide, wide], {
        stacked: true,
        captions: false,
        focus: true,
      });
      expect(fit.width).toBe(fit.imageHeight * 2);
      expect(fit.height).toBe(fit.imageHeight * 2 + 20);
      expect(fit.width).toBeLessThanOrEqual(width! - 16);
      expect(fit.height).toBeLessThanOrEqual(height! - 16);
      expect(fit.maximum).toBeGreaterThan(100);
    }
  });
});
