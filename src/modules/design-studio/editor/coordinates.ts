import type { Camera } from "../camera";
import type { Transform } from "./document";

export interface Point {
  readonly x: number;
  readonly y: number;
}
/** Column-vector affine matrix: x' = a*x + c*y + e; y' = b*x + d*y + f. */
export interface Matrix {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
  readonly f: number;
}
export const identity: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
function finite(values: readonly number[]) {
  if (!values.every(Number.isFinite)) throw new Error("Non-finite coordinate");
}
function checked(m: Matrix): Matrix {
  finite(Object.values(m));
  return m;
}
export function translate(x: number, y: number): Matrix {
  return checked({ ...identity, e: x, f: y });
}
export function scale(x: number, y = x): Matrix {
  return checked({ ...identity, a: x, d: y });
}
/** multiply(A, B) applies B first, then A. */
export function multiply(a: Matrix, b: Matrix): Matrix {
  checked(a);
  checked(b);
  return checked({
    a: a.a * b.a + a.c * b.b,
    b: a.b * b.a + a.d * b.b,
    c: a.a * b.c + a.c * b.d,
    d: a.b * b.c + a.d * b.d,
    e: a.a * b.e + a.c * b.f + a.e,
    f: a.b * b.e + a.d * b.f + a.f,
  });
}
export function apply(m: Matrix, p: Point): Point {
  checked(m);
  finite([p.x, p.y]);
  const result = { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
  finite([result.x, result.y]);
  return result;
}
export function inverse(m: Matrix): Matrix {
  checked(m);
  const determinant = m.a * m.d - m.b * m.c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12)
    throw new Error("Singular coordinate mapping");
  return checked({
    a: m.d / determinant,
    b: -m.b / determinant,
    c: -m.c / determinant,
    d: m.a / determinant,
    e: (m.c * m.f - m.d * m.e) / determinant,
    f: (m.b * m.e - m.a * m.f) / determinant,
  });
}
export interface SurfaceGeometry {
  /** CSS client pixels, from the viewport element, not the screen or canvas bitmap. */
  readonly viewport: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  /** The whole fitted group, including captions and gap, before camera scale. */
  readonly scene: { readonly width: number; readonly height: number };
  /** Image top-left in that group. Captions are outside the image rectangle. */
  readonly mockup: {
    readonly x: number;
    readonly y: number;
    readonly cssPixelsPerSourcePixel: number;
  };
  /** Preview pixel space uses identity. Physical space needs approved registration. */
  readonly documentToMockup: Matrix;
  readonly camera: Camera;
}
export function documentToClient(g: SurfaceGeometry): Matrix {
  const { viewport: v, scene, camera, mockup } = g;
  finite([
    v.left,
    v.top,
    v.width,
    v.height,
    scene.width,
    scene.height,
    camera.x,
    camera.y,
    camera.zoom,
    mockup.x,
    mockup.y,
    mockup.cssPixelsPerSourcePixel,
  ]);
  if (
    [
      v.width,
      v.height,
      scene.width,
      scene.height,
      camera.zoom,
      mockup.cssPixelsPerSourcePixel,
    ].some((n) => n <= 0)
  )
    throw new Error("Invalid surface geometry");
  const matrices = [
    translate(v.left + v.width / 2 + camera.x, v.top + v.height / 2 + camera.y),
    scale(camera.zoom / 100),
    translate(-scene.width / 2, -scene.height / 2),
    translate(mockup.x, mockup.y),
    scale(mockup.cssPixelsPerSourcePixel),
    g.documentToMockup,
  ];
  const result = matrices.reduce(multiply);
  inverse(result);
  return result;
}
export function clientToDocument(point: Point, geometry: SurfaceGeometry): Point {
  return apply(inverse(documentToClient(geometry)), point);
}
/** Equivalent measured image registration after the parent CSS camera is applied.
 * Captions and gaps are excluded by measuring the image wrapper itself. No RTL or DPR.
 */
export function clientToPreview(
  point: Point,
  rect: { left: number; top: number; width: number; height: number },
  space: { width: number; height: number },
): Point {
  if (rect.width <= 0 || rect.height <= 0 || space.width <= 0 || space.height <= 0)
    throw new Error("Invalid preview rectangle");
  return apply(
    inverse(
      multiply(
        translate(rect.left, rect.top),
        scale(rect.width / space.width, rect.height / space.height),
      ),
    ),
    point,
  );
}
/** Object local coordinates span [-.5,.5] in both axes; flips precede clockwise rotation. */
export function objectToDocument(t: Transform): Matrix {
  finite([t.centerX, t.centerY, t.width, t.height, t.rotationDeg]);
  if (t.width <= 0 || t.height <= 0) throw new Error("Invalid object dimensions");
  const radians = (t.rotationDeg * Math.PI) / 180;
  const rotation = {
    ...identity,
    a: Math.cos(radians),
    b: Math.sin(radians),
    c: -Math.sin(radians),
    d: Math.cos(radians),
  };
  return multiply(
    translate(t.centerX, t.centerY),
    multiply(rotation, scale(t.width * (t.flipX ? -1 : 1), t.height * (t.flipY ? -1 : 1))),
  );
}
