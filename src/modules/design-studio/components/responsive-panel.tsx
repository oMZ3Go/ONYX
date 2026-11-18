import {
  useEffect,
  useEffectEvent,
  useRef,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";
import {
  floatingPanel,
  nearestSheetSize,
  type PanelPreferences,
  type PanelSize,
  type PanelDock,
} from "../panel-layout";
import { Icon } from "@/components/icon";
import { StudioIcon } from "./studio-icon";
import { direction, type Locale } from "@/i18n/config";
import type { LocalizedStudioProps, Panel } from "../types";

const query = "(max-width: 999px)";
function subscribe(callback: () => void) {
  const media = matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const snapshot = () => matchMedia(query).matches;
const serverSnapshot = () => false;
export function useCompactLayout() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function ResponsivePanel({
  id,
  title,
  collapseLabel,
  locale,
  collapsed,
  onToggle,
  children,
  resize,
}: {
  id: Exclude<Panel, null>;
  title: string;
  collapseLabel: string;
  locale: Locale;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
  resize?: ReactNode;
}) {
  return (
    <aside
      className={`ds-panel-host ds-${id}-host`}
      dir={direction(locale)}
      data-collapsed={collapsed}
    >
      <button
        id={`ds-desktop-${id}`}
        className="ds-desktop-toggle"
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={`ds-${id}-panel`}
        aria-label={collapsed ? title : `${collapseLabel}: ${title}`}
        title={title}
      >
        <Icon name={id === "library" ? "image" : "adjustments"} />
        <span>{title}</span>
        <StudioIcon name="chevron" />
      </button>
      <div
        id={`ds-${id}-panel`}
        className="ds-panel-body"
        inert={collapsed}
        aria-hidden={collapsed}
      >
        {children}
      </div>
      {resize}
    </aside>
  );
}

/** One retained non-modal sheet: swapping tools never remounts the sheet. */
export function MobileTools({
  locale,
  copy,
  panel,
  suspended,
  onClose,
  library,
  inspector,
  preferences,
  onPreferences,
  snaps,
  onLiveHeight,
  liveHeight,
  onDragging,
  onPanelChange,
  dock,
  rail,
  narrowSide,
  onSideExpanded,
  mobileWidth,
  liveWidth,
  onLiveWidth,
  shortLandscape,
}: LocalizedStudioProps & {
  panel: Panel | null;
  suspended: boolean;
  onClose: () => void;
  library: ReactNode;
  inspector: ReactNode;
  preferences: PanelPreferences;
  onPreferences: (patch: Partial<PanelPreferences>) => void;
  snaps: Record<PanelSize, number>;
  onLiveHeight: (height: number | null) => void;
  liveHeight: number | null;
  onDragging: (dragging: boolean) => void;
  onPanelChange: (panel: Exclude<Panel, null>) => void;
  dock: PanelDock;
  rail: boolean;
  narrowSide: boolean;
  onSideExpanded: (expanded: boolean) => void;
  mobileWidth: { minimum: number; maximum: number; value: number };
  liveWidth: number | null;
  onLiveWidth: (width: number | null) => void;
  shortLandscape: boolean;
}) {
  const [options, setOptions] = useState(false);
  const [pinned, setPinned] = useState(false);
  // Pin belongs to this open panel session, independent of layout and content.
  if (panel === null && pinned) setPinned(false);
  if (panel === null && options) setOptions(false);
  const sideDock = dock === "left" || dock === "right";
  const widthResizable = sideDock || dock === "floating";
  const [sizing, setSizing] = useState<"height" | "width">("height");
  const [bounds, setBounds] = useState({ width: 390, height: 600 });
  const [floatingDrag, setFloatingDrag] = useState<{ x: number; y: number } | null>(null);
  const gesture = useRef<{
    kind: "size" | "width" | "move";
    x: number;
    y: number;
    height: number;
    width: number;
    floatX: number;
    floatY: number;
    moved: boolean;
    pointerId: number;
    handle: HTMLButtonElement;
  } | null>(null);
  const ignoreClick = useRef(false);
  const pressInside = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const wasSuspended = useRef(suspended);
  const [active, setActive] = useState<Exclude<Panel, null>>("library");
  if (panel && panel !== active) setActive(panel);
  const dismiss = useEffectEvent(onClose);
  const announcePanel = useEffectEvent(() => {
    if (!suspended)
      dialog.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  });
  const open = panel !== null && !suspended;
  const floating = dock === "floating";
  const position = floatingPanel(
    bounds.width,
    bounds.height,
    liveHeight ?? snaps[preferences.size],
    floatingDrag?.x ?? preferences.floatX,
    floatingDrag?.y ?? preferences.floatY,
    liveWidth ?? mobileWidth.value,
  );
  useEffect(() => {
    const main = dialog.current!.parentElement!;
    const observer = new ResizeObserver(() =>
      setBounds({ width: main.clientWidth, height: main.clientHeight }),
    );
    observer.observe(main);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = dialog.current!;
    const resuming = wasSuspended.current && !suspended;
    wasSuspended.current = suspended;
    if (open) {
      element.show();
      if (resuming) document.getElementById("ds-fullscreen")?.focus({ preventScroll: true });
    }
    if (!element.open) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(element);
    const duration = style.getPropertyValue("--ds-reveal").trim();
    const animation = element.animate(
      open
        ? [
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "translateY(0)" },
          ]
        : [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(10px)" },
          ],
      {
        duration:
          reduced || suspended ? 0 : parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000),
        easing: style.getPropertyValue("--ds-ease").trim(),
        fill: "both",
      },
    );
    let current = true;
    void animation.finished
      .then(() => {
        if (current && !open) element.close();
        if (current) animation.cancel();
      })
      .catch(() => {});
    return () => {
      current = false;
      animation.cancel();
    };
  }, [open, suspended]);
  useEffect(() => {
    if (panel) announcePanel();
  }, [panel]);
  useEffect(() => {
    const element = dialog.current!;
    if (!open) return;
    const down = (event: PointerEvent) => {
      pressInside.current = event.composedPath().includes(element);
      // A new press is the boundary between gestures, even if the previous
      // gesture was cancelled or produced no compatibility click.
      if (!gesture.current) ignoreClick.current = false;
    };
    const outside = (event: MouseEvent) => {
      if (gesture.current || pressInside.current || pinned) return;
      const target = event.target;
      if (!(target instanceof Element) || element.contains(target)) return;
      // A control can replace its icon before this document listener runs.
      // The original event path retains that control even if target is detached.
      if (
        event
          .composedPath()
          .some((node) => node instanceof Element && node.matches("button, a, .ds-panel-toggles"))
      )
        return;
      dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (options) {
        setOptions(false);
        element.querySelector<HTMLButtonElement>(".ds-sheet-settings")?.focus();
      } else dismiss();
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("click", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("click", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, options, pinned]);

  const startDrag = (
    event: React.PointerEvent<HTMLButtonElement>,
    kind: "size" | "width" | "move",
  ) => {
    if (event.button !== 0 || !event.isPrimary || gesture.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = {
      kind,
      x: event.clientX,
      y: event.clientY,
      height: dialog.current!.getBoundingClientRect().height,
      width: mobileWidth.value,
      floatX: preferences.floatX,
      floatY: preferences.floatY,
      moved: false,
      pointerId: event.pointerId,
      handle: event.currentTarget,
    };
    ignoreClick.current = false;
  };
  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    if (!start || event.pointerId !== start.pointerId) return;
    const delta = event.clientY - start.y;
    const movement =
      start.kind === "move"
        ? Math.hypot(event.clientX - start.x, delta)
        : start.kind === "width"
          ? event.clientX - start.x
          : delta;
    if (Math.abs(movement) < 6 && !start.moved) return;
    start.moved = true;
    ignoreClick.current = true;
    onDragging(true);
    if (start.kind === "move" && floating)
      setFloatingDrag({
        x: Math.max(
          0,
          Math.min(1, start.floatX + (event.clientX - start.x) / (position.travelX || 1)),
        ),
        y: Math.max(0, Math.min(1, start.floatY + delta / (position.travelY || 1))),
      });
    if (start.kind === "size")
      onLiveHeight(
        Math.max(
          snaps.compact,
          Math.min(snaps.expanded, start.height + delta * (dock === "top" ? 1 : -1)),
        ),
      );
    if (start.kind === "width")
      onLiveWidth(
        Math.max(
          mobileWidth.minimum,
          Math.min(
            mobileWidth.maximum,
            start.width + (event.clientX - start.x) * (dock === "right" ? -1 : 1),
          ),
        ),
      );
  };
  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    if (!start || event.pointerId !== start.pointerId) return;
    gesture.current = null;
    onDragging(false);
    if (start?.moved) {
      if (start.kind === "size")
        onPreferences({
          size: nearestSheetSize(
            start.height + (event.clientY - start.y) * (dock === "top" ? 1 : -1),
            snaps,
          ),
        });
      else if (start.kind === "width") {
        onPreferences({
          mobileWidth: Math.max(
            mobileWidth.minimum,
            Math.min(
              mobileWidth.maximum,
              start.width + (event.clientX - start.x) * (dock === "right" ? -1 : 1),
            ),
          ),
        });
      } else if (floating) {
        onPreferences({
          floatX: Math.max(
            0,
            Math.min(1, start.floatX + (event.clientX - start.x) / (position.travelX || 1)),
          ),
          floatY: Math.max(
            0,
            Math.min(1, start.floatY + (event.clientY - start.y) / (position.travelY || 1)),
          ),
        });
      } else {
        const main = dialog.current!.parentElement!.getBoundingClientRect();
        const horizontal =
          shortLandscape || Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y);
        const leading = horizontal
          ? event.clientX < main.x + main.width / 2
          : event.clientY < main.y + main.height / 2;
        onPreferences({
          dock: horizontal ? (leading ? "left" : "right") : leading ? "top" : "bottom",
        });
      }
    }
    onLiveHeight(null);
    onLiveWidth(null);
    setFloatingDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancelDrag = () => {
    const start = gesture.current;
    if (!start) return;
    gesture.current = null;
    onLiveHeight(null);
    onLiveWidth(null);
    onDragging(false);
    setFloatingDrag(null);
    if (start.handle.hasPointerCapture(start.pointerId))
      start.handle.releasePointerCapture(start.pointerId);
  };
  const resetGesture = useEffectEvent(cancelDrag);
  useEffect(() => {
    window.addEventListener("blur", resetGesture);
    return () => {
      window.removeEventListener("blur", resetGesture);
      resetGesture();
    };
  }, [open, dock, rail]);

  return (
    <dialog
      ref={dialog}
      id="ds-mobile-tools"
      className="ds-panel-dialog"
      data-floating={floating}
      data-pinned={pinned}
      data-options={options}
      data-rail={rail}
      data-narrow-side={narrowSide}
      style={
        floating
          ? {
              left: position.left,
              top: position.top,
              width: position.width,
              maxHeight: bounds.height - 16,
            }
          : undefined
      }
      data-active-panel={active}
      dir={direction(locale)}
      aria-labelledby="ds-sheet-heading"
      aria-modal="false"
      inert={!open}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="ds-compact-panel-heading">
        <h2 id="ds-sheet-heading" tabIndex={-1}>
          {active === "library" ? copy.library.title : copy.properties.title}
        </h2>
        <div className="ds-sheet-navigation" role="group" aria-label={copy.panels}>
          {open &&
            (["library", "inspector"] as const).map((id) => (
              <button
                key={id}
                id={`ds-toggle-${id}`}
                type="button"
                aria-label={id === "library" ? copy.library.title : copy.properties.title}
                title={id === "library" ? copy.library.title : copy.properties.title}
                aria-controls={`ds-${id}-panel`}
                aria-pressed={active === id}
                aria-expanded={active === id && !rail}
                onClick={() => {
                  setOptions(false);
                  if (rail) onSideExpanded(true);
                  onPanelChange(id);
                }}
              >
                <Icon name={id === "library" ? "image" : "adjustments"} />
              </button>
            ))}
        </div>
        <div className="ds-sheet-layout-controls" role="group" aria-label={copy.panelControls}>
          <button
            type="button"
            className="ds-sheet-pin"
            aria-pressed={pinned}
            aria-label={pinned ? copy.unpinPanel : copy.pinPanel}
            title={pinned ? copy.unpinPanel : copy.pinPanel}
            onClick={() => setPinned(!pinned)}
          >
            <StudioIcon name="pin" />
          </button>
          <button
            className="ds-sheet-position"
            type="button"
            onPointerDown={(event) => startDrag(event, "move")}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={cancelDrag}
            onLostPointerCapture={cancelDrag}
            title={floating ? copy.moveFloating : copy.moveSheet}
            aria-label={floating ? copy.moveFloating : copy.moveSheet}
            aria-keyshortcuts={floating ? "ArrowUp ArrowDown ArrowLeft ArrowRight Home" : undefined}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 40 : 16;
              const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
              const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
              if (!floating || (!dx && !dy && event.key !== "Home")) return;
              event.preventDefault();
              onPreferences({
                floatX:
                  event.key === "Home"
                    ? 0.5
                    : Math.max(0, Math.min(1, preferences.floatX + dx / (position.travelX || 1))),
                floatY:
                  event.key === "Home"
                    ? 0.5
                    : Math.max(0, Math.min(1, preferences.floatY + dy / (position.travelY || 1))),
              });
            }}
          >
            <StudioIcon name="move" />
          </button>
          <button
            type="button"
            className="ds-sheet-settings"
            aria-label={copy.panelPosition}
            aria-expanded={options}
            aria-controls="ds-panel-options"
            onClick={() => {
              if (rail) onSideExpanded(true);
              setOptions(!options);
            }}
          >
            <StudioIcon name="panel" />
          </button>
          <button
            className="ds-sheet-close"
            type="button"
            onClick={onClose}
            aria-label={copy.closePanel}
          >
            <Icon name="close" />
          </button>
        </div>
      </div>
      <div
        id="ds-panel-options"
        className="ds-panel-options"
        hidden={!options}
        role="group"
        aria-label={copy.panelPosition}
      >
        <fieldset>
          <legend>{copy.panelSizing}</legend>
          <div className="ds-panel-sizing-row">
            <button
              className="ds-sheet-expand"
              type="button"
              onPointerDown={(event) => startDrag(event, "size")}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onLostPointerCapture={cancelDrag}
              title={copy.resizeSheet}
              onClick={() => {
                if (!ignoreClick.current) setSizing("height");
                ignoreClick.current = false;
              }}
              aria-pressed={sizing === "height" || !widthResizable}
              aria-label={copy.panelSizes}
            >
              <StudioIcon name="resize" />
              {copy.panelSizes}
            </button>
            <button
              className="ds-sheet-width"
              type="button"
              disabled={!widthResizable}
              aria-pressed={sizing === "width" && widthResizable}
              aria-describedby={!widthResizable ? "ds-panel-width-hint" : undefined}
              onPointerDown={(event) => startDrag(event, "width")}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={cancelDrag}
              onLostPointerCapture={cancelDrag}
              onClick={() => {
                if (!ignoreClick.current) setSizing("width");
                ignoreClick.current = false;
              }}
            >
              <StudioIcon name="width" />
              {copy.panelWidth}
            </button>
          </div>
          <div className="ds-panel-height-presets" hidden={sizing === "width" && widthResizable}>
            {(["compact", "medium", "expanded"] as PanelSize[]).map((size) => (
              <button
                type="button"
                key={size}
                aria-pressed={preferences.size === size}
                onClick={() => onPreferences({ size })}
              >
                <StudioIcon
                  name={size === "compact" ? "compact" : size === "medium" ? "panel" : "expand"}
                />
                {copy[`${size}Size`]}
              </button>
            ))}
          </div>
          <div className="ds-panel-width-preference" hidden={sizing !== "width" || !widthResizable}>
            <input
              type="range"
              aria-label={copy.panelWidth}
              min={mobileWidth.minimum}
              max={mobileWidth.maximum}
              step={1}
              value={liveWidth ?? mobileWidth.value}
              dir="ltr"
              onChange={(event) =>
                onPreferences({ mobileWidth: Number(event.currentTarget.value) })
              }
            />
            <output>{Math.round(liveWidth ?? mobileWidth.value)}px</output>
          </div>
          {!widthResizable && (
            <p id="ds-panel-width-hint" className="ds-layout-hint">
              {copy.fullWidthPanel}
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>{copy.panelPosition}</legend>
          <div className="ds-panel-dock-options">
            {(["top", "bottom", "left", "right", "floating"] as const).map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={dock === option}
                disabled={shortLandscape && (option === "top" || option === "bottom")}
                aria-describedby={
                  shortLandscape && (option === "top" || option === "bottom")
                    ? "ds-panel-dock-hint"
                    : undefined
                }
                onClick={() => {
                  onPreferences({ dock: option });
                  setOptions(false);
                }}
              >
                <StudioIcon
                  name={
                    (
                      {
                        top: "dockTop",
                        bottom: "dockBottom",
                        left: "dockLeft",
                        right: "dockRight",
                        floating: "move",
                      } as const
                    )[option]
                  }
                />
                {
                  copy[
                    (
                      {
                        top: "dockTop",
                        bottom: "dockBottom",
                        left: "dockLeft",
                        right: "dockRight",
                        floating: "floating",
                      } as const
                    )[option]
                  ]
                }
              </button>
            ))}
          </div>
          {shortLandscape && (
            <p id="ds-panel-dock-hint" className="ds-layout-hint">
              {copy.shortDockHint}
            </p>
          )}
        </fieldset>
        <button
          type="button"
          onClick={() => {
            onPreferences({
              dock: "bottom",
              size: "compact",
              floatX: 0.5,
              floatY: 0.85,
              mobileWidth: 320,
            });
            setOptions(false);
          }}
        >
          <StudioIcon name="reset" />
          {copy.resetPanel}
        </button>
      </div>
      <div
        id="ds-library-panel"
        className="ds-mobile-body ds-library-host"
        inert={options}
        hidden={rail || active !== "library"}
      >
        {library}
      </div>
      <div
        id="ds-inspector-panel"
        className="ds-mobile-body ds-inspector-host"
        inert={options}
        hidden={rail || active !== "inspector"}
      >
        {inspector}
      </div>
      {narrowSide && (
        <button
          type="button"
          className="ds-side-reveal"
          aria-label={rail ? copy.expandSidePanel : copy.collapseSidePanel}
          title={rail ? copy.expandSidePanel : copy.collapseSidePanel}
          aria-expanded={!rail}
          onClick={() => {
            setOptions(false);
            onSideExpanded(rail);
          }}
        >
          <StudioIcon name={rail ? "expand" : "compact"} />
          {!rail && <span>{copy.collapseSidePanel}</span>}
        </button>
      )}
    </dialog>
  );
}
