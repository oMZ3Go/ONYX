export interface Camera {
  zoom: number;
  x: number;
  y: number;
}
export const initialCamera: Camera = { zoom: 100, x: 0, y: 0 };
export interface CameraGeometry {
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  minimum: number;
  maximum: number;
}
export function boundCamera(camera: Camera, g: CameraGeometry): Camera {
  const zoom = Math.min(g.maximum, Math.max(g.minimum, camera.zoom));
  const bound = (viewport: number, content: number) =>
    Math.max(0, (viewport + (content * zoom) / 100) / 2 - Math.min(96, viewport * 0.3));
  const x = bound(g.width, g.contentWidth),
    y = bound(g.height, g.contentHeight);
  return { zoom, x: Math.max(-x, Math.min(x, camera.x)), y: Math.max(-y, Math.min(y, camera.y)) };
}
/** Anchor is in viewport CSS pixels relative to its center, never garment pixels. */
export function zoomAt(
  camera: Camera,
  zoom: number,
  anchor: { x: number; y: number },
  g: CameraGeometry,
): Camera {
  const next = Math.min(g.maximum, Math.max(g.minimum, zoom));
  const ratio = next / camera.zoom;
  return boundCamera(
    {
      zoom: next,
      x: anchor.x - (anchor.x - camera.x) * ratio,
      y: anchor.y - (anchor.y - camera.y) * ratio,
    },
    g,
  );
}
