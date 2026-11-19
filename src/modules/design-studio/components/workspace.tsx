import { GarmentScene } from "./garment-scene";
import { initialCamera, zoomAt, type Camera } from "../camera";
import { useCameraNavigation } from "../use-camera-navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { StudioIcon } from "./studio-icon";
import { fitViewport } from "../viewport";
import type {
  AvailableVariant,
  LocalizedStudioProps,
  ViewMode,
  WorkspaceState,
  WorkspaceTheme,
} from "../types";

interface Props extends LocalizedStudioProps {
  variant: AvailableVariant;
  workspace: WorkspaceState;
  theme: WorkspaceTheme;
  onView: (view: ViewMode) => void;
  camera: Camera;
  onCamera: (camera: Camera) => void;
  onGrid: () => void;
  focus: boolean;
  onFocus: () => void;
  tools: ReactNode;
  compact: boolean;
}
export function Workspace({
  locale,
  copy,
  variant,
  workspace,
  theme,
  onView,
  camera,
  onCamera,
  onGrid,
  focus,
  onFocus,
  tools,
  compact,
}: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const element = viewport.current!;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const sides = workspace.view === "both" ? (["front", "back"] as const) : [workspace.view];
  const captions =
    !focus && !(compact && viewportSize && viewportSize.width < 700 && workspace.panel);
  const stacked = Boolean(
    focus && viewportSize && viewportSize.height > viewportSize.width && sides.length > 1,
  );
  const fitted = viewportSize
    ? fitViewport(
        viewportSize.width,
        viewportSize.height,
        sides.map((side) => variant.mockups[side]),
        { captions, stacked, focus },
      )
    : null;
  const geometry =
    fitted && viewportSize
      ? {
          ...viewportSize,
          contentWidth: fitted.width,
          contentHeight: fitted.height,
          minimum: fitted.minimum,
          maximum: fitted.maximum,
        }
      : null;
  const navigation = useCameraNavigation(viewport, camera, geometry, onCamera);
  const zoom = camera.zoom;
  const changeZoom = (value: number) => {
    if (geometry) onCamera(zoomAt(camera, value, { x: 0, y: 0 }, geometry));
  };
  const fit = () => onCamera(initialCamera);
  return (
    <section className="ds-canvas" aria-label={copy.workspace.title} data-theme={theme}>
      <div className="ds-canvas-controls">
        <div
          className="ds-view-control"
          aria-label={copy.workspace.view}
          data-view={workspace.view}
          style={
            {
              "--ds-view-index": ["front", "back", "both"].indexOf(workspace.view),
            } as CSSProperties
          }
        >
          <span className="ds-view-indicator" aria-hidden="true" />
          {(["front", "back", "both"] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-label={copy.workspace[view]}
              aria-pressed={workspace.view === view}
              onClick={() => onView(view)}
            >
              <StudioIcon name={view} data-view-icon={view} />
              <span className="ds-view-label">{copy.workspace[view]}</span>
              <span className="ds-view-short" aria-hidden="true">
                {copy.workspace[view === "both" ? "bothShort" : view]}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="ds-stage">
        <div className="ds-studio-light" aria-hidden="true" />
        <div
          className="ds-viewport"
          ref={viewport}
          role="region"
          aria-label={copy.workspace.preview}
          data-zoom={zoom}
          data-inspecting={zoom > 100}
          data-pan-x={camera.x}
          data-pan-y={camera.y}
          data-hand={navigation.activeHand}
          data-dragging={navigation.dragging}
          data-min-zoom={fitted?.minimum}
          data-max-zoom={fitted?.maximum}
        >
          <div
            className="ds-position-grid"
            aria-hidden="true"
            data-visible={workspace.grid}
            style={
              {
                "--ds-grid-size": `${(32 * zoom) / 100}px`,
                backgroundPosition: `calc(50% + ${camera.x}px) calc(50% + ${camera.y}px)`,
              } as CSSProperties
            }
          />
          <div
            className="ds-zoom-content"
            style={{
              width: fitted ? `${fitted.width}px` : "80%",
              transform: `translate(calc(-50% + ${camera.x}px), calc(-50% + ${camera.y}px)) scale(${zoom / 100})`,
            }}
          >
            <GarmentScene
              view={workspace.view}
              variant={variant}
              viewport={viewportSize}
              captions={Boolean(captions)}
              focus={focus}
              zoom={zoom}
              locale={locale}
              copy={copy}
            />
          </div>
        </div>
      </div>
      <div className="ds-canvas-bottom">
        {tools}
        <div className="ds-camera-controls" role="group" aria-label={copy.cameraControls}>
          <div className="ds-zoom" dir="ltr">
            <button
              type="button"
              aria-label={copy.workspace.zoomOut}
              disabled={!fitted || zoom <= fitted.minimum}
              onClick={() => changeZoom(zoom - 25)}
            >
              <StudioIcon name="minus" />
            </button>
            <output aria-live="polite" aria-label={copy.workspace.zoom}>
              {Math.round(zoom)}%
            </output>
            <button
              type="button"
              aria-label={copy.workspace.zoomIn}
              disabled={!fitted || zoom >= fitted.maximum}
              onClick={() => changeZoom(zoom + 25)}
            >
              <StudioIcon name="plus" />
            </button>
          </div>
          <button type="button" className="ds-fit" onClick={fit}>
            <StudioIcon name="fit" />
            <span>{copy.workspace.fit}</span>
          </button>
        </div>
        <div className="ds-canvas-tools" role="group" aria-label={copy.canvasTools}>
          <div className="ds-history" aria-label={copy.workspace.history}>
            <button
              type="button"
              disabled
              aria-label={copy.workspace.undo}
              aria-describedby="ds-editing-note"
            >
              <StudioIcon name="undo" />
              <span>{copy.workspace.undo}</span>
            </button>
            <span aria-hidden="true" />
            <button
              type="button"
              disabled
              aria-label={copy.workspace.redo}
              aria-describedby="ds-editing-note"
            >
              <StudioIcon name="redo" />
              <span>{copy.workspace.redo}</span>
            </button>
          </div>
          <button
            type="button"
            className="ds-hand"
            aria-label={copy.hand}
            aria-pressed={navigation.hand}
            onClick={navigation.toggleHand}
            title={copy.handHint}
          >
            <StudioIcon name="hand" />
          </button>
          <button
            type="button"
            className="ds-grid-toggle"
            aria-label={copy.workspace.grid}
            aria-pressed={workspace.grid}
            onClick={onGrid}
          >
            <Icon name="grid" />
            <span>{copy.workspace.grid}</span>
          </button>
          <button
            id="ds-fullscreen"
            type="button"
            className="ds-fullscreen"
            onClick={onFocus}
            aria-label={focus ? copy.exitFullscreen : copy.fullscreen}
            aria-pressed={focus}
          >
            {focus ? <Icon name="close" /> : <StudioIcon name="fullscreen" />}
            <span>{focus ? copy.exitFullscreen : copy.fullscreen}</span>
          </button>
        </div>
      </div>
      <p className="ds-workspace-note" id="ds-editing-note">
        {copy.deferred.editing}
      </p>
    </section>
  );
}
