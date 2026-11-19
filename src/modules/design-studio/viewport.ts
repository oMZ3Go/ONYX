import type { ImageAsset } from "./types";

/** Preview-only geometry. All dimensions are CSS pixels, never print measurements. */
export function fitViewport(
  width: number,
  height: number,
  images: readonly ImageAsset[],
  options: { captions?: boolean; stacked?: boolean; focus?: boolean } = {},
) {
  const ratios = images.map((image) => image.width / image.height);
  const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);
  const gap = images.length > 1 ? 20 : 0;
  const caption = options.captions === false ? 0 : 30;
  // Fit is a camera reference, independent of the clipped inspection zoom range.
  const gutter =
    width < 700
      ? options.focus
        ? 16
        : 8
      : Math.min(56, Math.max(8, Math.min(width, height) * 0.065));
  const stacked = options.stacked && images.length > 1;
  const imageHeight = Math.max(
    1,
    Math.min(
      stacked
        ? (width - 2 * gutter) / Math.max(...ratios)
        : (width - 2 * gutter - gap) / totalRatio,
      stacked
        ? (height - 2 * gutter - gap) / images.length - caption
        : height - 2 * gutter - caption,
      ...images.map((image) => image.height),
    ),
  );
  const fittedWidth = stacked ? imageHeight * Math.max(...ratios) : imageHeight * totalRatio + gap;
  const fittedHeight = stacked
    ? (imageHeight + caption) * images.length + gap
    : imageHeight + caption;
  // Permit detail inspection; cap magnification according to source pixels and
  // fitted image height, with a useful 300% floor and a 600% navigation ceiling.
  const maximum = Math.max(
    300,
    Math.min(
      600,
      Math.floor(
        ((Math.min(...images.map((image) => image.originalHeight ?? image.height)) / imageHeight) *
          200) /
          25,
      ) * 25,
    ),
  );
  const minimum = 25;
  return { width: fittedWidth, height: fittedHeight, imageHeight, minimum, maximum };
}
export function clampZoom(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
