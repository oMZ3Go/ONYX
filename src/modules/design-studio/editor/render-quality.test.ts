import { expect, it } from "vitest";
import { renderPixelRatio, MAX_SURFACE_PIXELS, toolbarPosition } from "./render-quality";

it("matches screen density without double-applying zoom to geometry", () => {
  expect(renderPixelRatio(600, 300, 1, 200)).toBe(2);
  expect(renderPixelRatio(600, 300, 2, 200)).toBe(4);
  expect(renderPixelRatio(600, 300, 2, 50)).toBe(1);
});
it("bounds large backing buffers instead of globally lowering DPR", () => {
  for (const [width, height] of [
    [2000, 1000],
    [6000, 1000],
    [390, 195],
  ]) {
    const ratio = renderPixelRatio(width!, height!, 3, 600);
    expect(width! * height! * ratio ** 2).toBeLessThanOrEqual(MAX_SURFACE_PIXELS + 0.01);
    expect(Math.max(width!, height!) * ratio).toBeLessThanOrEqual(4096);
  }
});
it("keeps contextual controls within narrow and wide viewports", () => {
  for (const width of [288, 390, 1200])
    for (const left of [-300, 100, 2000]) {
      const p = toolbarPosition(
        { left, top: 500, right: left + 70, bottom: 560 },
        { width, height: 600 },
        200,
      );
      expect(p.left).toBeGreaterThanOrEqual(8);
      expect(p.left + p.width).toBeLessThanOrEqual(width - 8);
      expect(p.top).toBeGreaterThanOrEqual(8);
      expect(p.top + p.height).toBeLessThanOrEqual(592);
      expect(p.target).toBeGreaterThanOrEqual(width < 700 ? 44 : 34);
    }
});
