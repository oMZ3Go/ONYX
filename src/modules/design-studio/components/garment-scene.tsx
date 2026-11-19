import { useLayoutEffect, useRef, useState } from "react";
import { GarmentImage } from "./garment-image";
import { fitViewport } from "../viewport";
import type { AvailableVariant, LocalizedStudioProps, ViewMode } from "../types";

/** Local crossfade: both image groups stay in the canvas stacking context. */
export function GarmentScene({
  view,
  variant,
  viewport,
  captions,
  focus,
  zoom,
  locale,
  copy,
}: LocalizedStudioProps & {
  view: ViewMode;
  variant: AvailableVariant;
  viewport: { width: number; height: number } | null;
  captions: boolean;
  focus: boolean;
  zoom: number;
}) {
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
        aria-hidden={exiting || undefined}
        inert={exiting || undefined}
        style={exiting ? { width: fitted?.width } : undefined}
      >
        {sides.map((side) => (
          <figure
            key={side}
            className="ds-garment"
            data-side={side}
            style={
              stacked && fitted
                ? {
                    width:
                      (fitted.imageHeight * variant.mockups[side].width) /
                      variant.mockups[side].height,
                  }
                : { flex: variant.mockups[side].width / variant.mockups[side].height }
            }
          >
            <span className="ds-garment-light" aria-hidden="true" />
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
