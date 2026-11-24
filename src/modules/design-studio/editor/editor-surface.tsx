"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import type Konva from "konva";
import type { DesignObject, Transform } from "./document";
import type { Editor } from "./use-editor";
import type { LocalizedStudioProps, Side } from "../types";
import { clientToPreview } from "./coordinates";
import { angle, bounds } from "./controller";
import { resolveCatalogSource } from "./catalog-assets";
import { decodeOriginal } from "./decoded-image";
import { renderPixelRatio } from "./render-quality";

export interface SurfaceProps extends LocalizedStudioProps {
  editor: Editor;
  side: Side;
  interactive: boolean;
  zoom: number;
  maskSrc: string;
}
function Artwork({
  object,
  editor,
  transform,
  onError,
}: {
  object: DesignObject;
  editor: Editor;
  transform: Transform;
  onError: () => void;
}) {
  const [image, setImage] = useState<HTMLImageElement>();
  const asset = object.kind !== "text" ? editor.state.project.assets[object.assetId] : undefined;
  const src = asset ? resolveCatalogSource(asset) : undefined;
  const sourceWidth = asset?.pixels?.width,
    sourceHeight = asset?.pixels?.height;
  useEffect(() => {
    if (!src) return;
    let active = true;
    void decodeOriginal(src)
      .then((img) => {
        if (active) {
          if (img.naturalWidth !== sourceWidth || img.naturalHeight !== sourceHeight) onError();
          else setImage(img);
        }
      })
      .catch(() => {
        if (active) onError();
      });
    return () => {
      active = false;
    };
  }, [src, sourceWidth, sourceHeight, onError]);
  return (
    <KonvaImage
      image={image}
      x={transform.centerX}
      y={transform.centerY}
      width={transform.width}
      height={transform.height}
      offsetX={transform.width / 2}
      offsetY={transform.height / 2}
      rotation={transform.rotationDeg}
      opacity={object.opacity}
      scaleX={transform.flipX ? -1 : 1}
      scaleY={transform.flipY ? -1 : 1}
      listening={false}
    />
  );
}

export default function EditorSurface({
  editor,
  side,
  interactive,
  zoom,
  maskSrc,
  copy,
  locale,
}: SurfaceProps) {
  const { state, controller } = editor,
    doc = state.project.sides[side];
  const host = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const layer = useRef<Konva.Layer>(null);
  const [dpr, setDpr] = useState(() => window.devicePixelRatio || 1);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false);
  const [onError] = useState(() => () => setFailed(true));
  const gesture = useRef<{
    id: number;
    pointer: number;
    start: { x: number; y: number };
    before: Readonly<Record<string, Transform>>;
    box: ReturnType<typeof bounds>;
    operation: string;
    rect: DOMRect;
  } | null>(null);
  const frame = useRef(0),
    sample = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        controller.cancel();
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(host.current!);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
      controller.cancel();
    };
  }, [controller]);
  useEffect(() => {
    controller.cancel();
  }, [controller, zoom, interactive]);
  useEffect(() => {
    let query: MediaQueryList;
    const update = () => {
      setDpr(window.devicePixelRatio || 1);
      query?.removeEventListener("change", update);
      query = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      query.addEventListener("change", update);
    };
    update();
    return () => query.removeEventListener("change", update);
  }, []);
  const pixelRatio = renderPixelRatio(size.width, size.height, dpr, zoom);
  useLayoutEffect(() => {
    const current = layer.current;
    if (!current) return;
    current.getCanvas().setPixelRatio(pixelRatio);
    const smooth = () => {
      current.getContext().imageSmoothingEnabled = true;
      current.getContext().imageSmoothingQuality = "high";
    };
    current.on("beforeDraw.onyx-quality", smooth);
    current.draw();
    return () => {
      current.off("beforeDraw.onyx-quality", smooth);
    };
  }, [pixelRatio, size.width, size.height]);
  const transforms = (object: DesignObject) =>
    side === state.activeSide ? (state.transient[object.id] ?? object.transform) : object.transform;
  const selected = state.selection[side]
    .map((id) => doc.objectsById[id]!)
    .filter((o) => o?.visible && !o.locked);
  const box = selected.length ? bounds(selected.map(transforms)) : null;
  const scaleX = size.width / doc.space.width,
    scaleY = size.height / doc.space.height;
  const flush = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const g = gesture.current,
      point = sample.current;
    sample.current = null;
    if (!g || !point || controller.getGesture()?.id !== g.id) return;
    const p = clientToPreview(point, g.rect, doc.space),
      dx = p.x - g.start.x,
      dy = p.y - g.start.y;
    const rotation =
      Math.atan2(p.y - g.box.centerY, p.x - g.box.centerX) -
      Math.atan2(g.start.y - g.box.centerY, g.start.x - g.box.centerX);
    const anchor = {
      x: g.operation.includes("w") ? g.box.right : g.box.left,
      y: g.operation.includes("n") ? g.box.bottom : g.box.top,
    };
    const a = { x: g.start.x - anchor.x, y: g.start.y - anchor.y },
      b = { x: p.x - anchor.x, y: p.y - anchor.y };
    const factor = Math.max(
      0.02,
      Math.min(50, (a.x * b.x + a.y * b.y) / Math.max(1, a.x * a.x + a.y * a.y)),
    );
    controller.preview(
      Object.fromEntries(
        Object.entries(g.before).map(([id, t]) => {
          if (g.operation === "move")
            return [id, { ...t, centerX: t.centerX + dx, centerY: t.centerY + dy }];
          if (g.operation === "rotate") {
            const x = t.centerX - g.box.centerX,
              y = t.centerY - g.box.centerY;
            return [
              id,
              {
                ...t,
                centerX: g.box.centerX + x * Math.cos(rotation) - y * Math.sin(rotation),
                centerY: g.box.centerY + x * Math.sin(rotation) + y * Math.cos(rotation),
                rotationDeg: angle(t.rotationDeg + (rotation * 180) / Math.PI),
              },
            ];
          }
          return [
            id,
            {
              ...t,
              centerX: anchor.x + (t.centerX - anchor.x) * factor,
              centerY: anchor.y + (t.centerY - anchor.y) * factor,
              width: t.width * factor,
              height: t.height * factor,
            },
          ];
        }),
      ),
      g.id,
    );
  };
  const start = (event: PointerEvent, id?: string, operation = "move") => {
    if (!interactive || event.button !== 0) return;
    if (id) {
      if (event.shiftKey) {
        controller.select(side, [id], true);
        return;
      }
      if (!state.selection[side].includes(id)) controller.select(side, [id]);
      else controller.setSide(side);
    } else controller.setSide(side);
    if (!controller.begin()) return;
    event.preventDefault();
    host.current!.focus({ preventScroll: true });
    const before = controller.getGesture()!.before,
      rect = host.current!.getBoundingClientRect();
    gesture.current = {
      id: controller.getGesture()!.id,
      pointer: event.pointerId,
      start: clientToPreview({ x: event.clientX, y: event.clientY }, rect, doc.space),
      before,
      box: bounds(Object.values(before)),
      operation,
      rect,
    };
    host.current!.setPointerCapture(event.pointerId);
  };
  const cancel = () => {
    const id = gesture.current?.id;
    if (gesture.current) suppressClick.current = true;
    gesture.current = null;
    sample.current = null;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    if (id === controller.getGesture()?.id) controller.cancel();
  };
  return (
    <div
      ref={host}
      className="ds-editor-surface"
      dir="ltr"
      tabIndex={interactive ? 0 : -1}
      role="group"
      aria-label={`${copy.editor.surface}: ${copy.workspace[side]}`}
      data-editor-side={side}
      data-revision={state.project.revision}
      data-selected={state.selection[side].join(",")}
      data-interactive={interactive}
      onPointerDown={() => {
        suppressClick.current = false;
      }}
      onClick={(event) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (event.target === event.currentTarget && interactive) controller.select(side, []);
      }}
      onPointerMove={(event) => {
        if (gesture.current?.pointer !== event.pointerId) return;
        sample.current = { x: event.clientX, y: event.clientY };
        if (!frame.current) frame.current = requestAnimationFrame(flush);
      }}
      onPointerUp={(event) => {
        if (gesture.current?.pointer !== event.pointerId) return;
        sample.current = { x: event.clientX, y: event.clientY };
        flush();
        suppressClick.current = true;
        const id = gesture.current.id;
        gesture.current = null;
        controller.finish(id);
        if (host.current?.hasPointerCapture(event.pointerId))
          host.current.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={() => {
        if (gesture.current) cancel();
      }}
    >
      <div
        className="ds-artwork-render"
        aria-hidden="true"
        style={
          state.clipGarment
            ? {
                maskImage: `url("${maskSrc}")`,
                WebkitMaskImage: `url("${maskSrc}")`,
                maskMode: "alpha",
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
              }
            : undefined
        }
      >
        {size.width > 0 && (
          <Stage
            width={size.width}
            height={size.height}
            scaleX={scaleX}
            scaleY={scaleY}
            listening={false}
          >
            <Layer ref={layer} listening={false} imageSmoothingEnabled>
              {doc.layerOrder.map((id) => {
                const object = doc.objectsById[id]!;
                return object.visible ? (
                  <Artwork
                    key={id}
                    object={object}
                    transform={transforms(object)}
                    editor={editor}
                    onError={onError}
                  />
                ) : null;
              })}
            </Layer>
          </Stage>
        )}
      </div>
      {interactive &&
        doc.layerOrder.map((id) => {
          const object = doc.objectsById[id]!,
            t = transforms(object);
          if (!object.visible || object.locked) return null;
          const name =
            copy.editor.select +
            ": " +
            (object.kind === "artwork"
              ? (editor.catalog.artworks.find((a) => a.id === object.artwork.id)?.name[locale] ??
                object.name)
              : object.name);
          return (
            <button
              key={id}
              type="button"
              className="ds-object-hit"
              aria-label={name}
              aria-pressed={state.selection[side].includes(id)}
              data-object-id={id}
              data-transform={JSON.stringify(object.transform)}
              style={{
                left: `${(t.centerX / doc.space.width) * 100}%`,
                top: `${(t.centerY / doc.space.height) * 100}%`,
                width: t.width * scaleX,
                height: t.height * scaleY,
                transform: `translate(-50%, -50%) rotate(${t.rotationDeg}deg)`,
              }}
              onPointerDown={(event) => start(event, id)}
              onClick={(event) => {
                if (event.detail === 0) controller.select(side, [id], event.shiftKey);
              }}
            />
          );
        })}
      {interactive && box && state.activeSide === side && (
        <div
          className="ds-selection-box"
          style={{
            left: box.left * scaleX,
            top: box.top * scaleY,
            width: box.width * scaleX,
            height: box.height * scaleY,
          }}
        >
          {(["nw", "ne", "sw", "se", "rotate"] as const).map((handle) => (
            <button
              key={handle}
              className="ds-transform-handle"
              data-handle={handle}
              type="button"
              tabIndex={-1}
              aria-label={handle === "rotate" ? copy.editor.rotate : copy.editor.resize}
              style={{ width: (24 * 100) / zoom, height: (24 * 100) / zoom }}
              onPointerDown={(event) => start(event, undefined, handle)}
            />
          ))}
        </div>
      )}
      {failed && (
        <span className="ds-render-error" role="alert" dir={locale === "ar" ? "rtl" : "ltr"}>
          {copy.editor.renderError}
        </span>
      )}
    </div>
  );
}
