import { useLayoutEffect, useRef, useState } from "react";
import { GarmentImage } from "./garment-image";
import { SurfaceBoundary } from "../editor/surface-boundary";
import type { Editor } from "../editor/use-editor";
import type { Camera } from "../camera";
import { artworkViewport, fitViewport } from "../viewport";
import type { AvailableVariant, LocalizedStudioProps, ViewMode } from "../types";

/** Local crossfade: both image groups stay in the canvas stacking context. */
export function GarmentScene({
  editor,
  interactive,
  view,
  variant,
  viewport,
  captions,
  focus,
  camera,
  locale,
  copy,
}: LocalizedStudioProps & {
  editor: Editor;
  interactive: boolean;
  view: ViewMode;
  variant: AvailableVariant;
  viewport: { width: number; height: number } | null;
  captions: boolean;
  focus: boolean;
  camera: Camera;
}) {
  const { zoom } = camera;
  const [transition, setTransition] = useState<{ view: ViewMode; previous: ViewMode | null }>({
    view,
    previous: null,
  });
  if (transition.view !== view) setTransition({ view, previous: transition.view });
  const scene = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = scene.current!;
    const incoming = element.querySelector<HTMLElement>(".ds-garments")!;
    const outgoing = element.querySelector<HTMLElement>(".ds-garments-exit");
    if (!outgoing) return;
    const style = getComputedStyle(element);
    const time = style.getPropertyValue("--ds-reveal").trim();
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : parseFloat(time) * (time.endsWith("ms") ? 1 : 1000);
    const options = {
      duration,
      easing: style.getPropertyValue("--ds-ease").trim(),
      fill: "both" as const,
    };
    const enter = incoming.animate([{ opacity: 0 }, { opacity: 1 }], options);
    const exit = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], options);
    let current = true;
    void Promise.all([enter.finished, exit.finished])
      .then(() => {
        if (current) setTransition({ view, previous: null });
      })
      .catch(() => {});
    return () => {
      current = false;
      enter.cancel();
      exit.cancel();
    };
  }, [view, transition.previous]);

  const group = (mode: ViewMode, exiting: boolean) => {
    const sides = mode === "both" ? (["front", "back"] as const) : [mode];
    const stacked = Boolean(
      focus && viewport && viewport.height > viewport.width && sides.length > 1,
    );
    const fitted = viewport
      ? fitViewport(
          viewport.width,
          viewport.height,
          sides.map((side) => variant.mockups[side]),
          { captions, stacked, focus },
        )
      : null;
    return (
      <div
        key={`${exiting ? "exit" : "current"}-${mode}`}
        className={exiting ? "ds-garments-exit" : "ds-garments"}
        data-view={mode}
        data-stacked={stacked}
        data-captions={captions}
        data-clipped={editor.state.clipGarment}
        aria-hidden={exiting || undefined}
        inert={exiting || undefined}
        style={exiting ? { width: fitted?.width } : undefined}
      >
        {sides.map((side, index) => (
          <figure
            key={side}
            className="ds-garment"
            data-side={side}
            style={
              stacked && fitted
                ? {
                    width: fitted.mockups[index]!.width,
                  }
                : { flex: variant.mockups[side].width / variant.mockups[side].height }
            }
          >
            <span className="ds-garment-light" aria-hidden="true" />
            <div className="ds-garment-image">
              <GarmentImage
                asset={variant.mockups[side]}
                highResolution={focus || zoom > 100}
                renderedWidth={
                  ((((fitted?.imageHeight ?? 200) * variant.mockups[side].width) /
                    variant.mockups[side].height) *
                    zoom) /
                  100
                }
                alt={exiting ? "" : `${copy.workspace[side]} - ${variant.name[locale]}`}
              />
              <SurfaceBoundary
                maskSrc={variant.mockups[side].originalSrc}
                viewportFrame={
                  fitted && viewport ? artworkViewport(viewport, fitted, index, camera) : undefined
                }
                editor={editor}
                side={side}
                interactive={interactive && !exiting}
                zoom={zoom}
                locale={locale}
                copy={copy}
              />
            </div>
            <figcaption>{copy.workspace[side]}</figcaption>
          </figure>
        ))}
      </div>
    );
  };
  return (
    <div ref={scene} className="ds-garment-scene">
      {transition.previous && group(transition.previous, true)}
      {group(view, false)}
    </div>
  );
}
