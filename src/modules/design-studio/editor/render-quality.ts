/** Per artwork surface: at most 4 Mi pixels (16 MiB RGBA), and 4096 pixels per edge.
 * The CSS camera still owns geometry; this only allocates enough backing pixels.
 */
export const MAX_SURFACE_PIXELS = 4 * 1024 * 1024;
export function renderPixelRatio(width: number, height: number, dpr: number, zoom: number) {
  if (![width, height, dpr, zoom].every((n) => Number.isFinite(n) && n > 0)) return 1;
  return Math.min(
    (dpr * zoom) / 100,
    Math.sqrt(MAX_SURFACE_PIXELS / (width * height)),
    4096 / width,
    4096 / height,
  );
}

export function toolbarPosition(
  box: { left: number; top: number; right: number; bottom: number },
  viewport: { width: number; height: number },
  zoom: number,
) {
  const target = viewport.width < 700 ? 40 : 34,
    gap = 4,
    padding = 14;
  const columns = Math.max(
    1,
    Math.min(7, Math.floor((viewport.width - 16 - padding + gap) / (target + gap))),
  );
  const width = columns * (target + gap) - gap + padding,
    height = Math.ceil(7 / columns) * (target + gap) - gap + padding;
  const below = box.bottom + 18;
  const above = box.top - (26 * zoom) / 100 - 20 - height;
  return {
    left: Math.max(8, Math.min(viewport.width - width - 8, (box.left + box.right - width) / 2)),
    top: Math.max(
      8,
      Math.min(viewport.height - height - 8, below + height <= viewport.height - 8 ? below : above),
    ),
    width,
    height,
    target,
  };
}
