import { useEffect, useRef, useState, type ReactNode } from "react";
import { inspectorSplit } from "../panel-layout";

export function InspectorLayout({
  compact,
  ratio,
  onRatio,
  label,
  tab,
  properties,
  layers,
}: {
  compact: boolean;
  ratio: number;
  onRatio: (ratio: number) => void;
  label: string;
  tab: string;
  properties: ReactNode;
  layers: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ y: number; properties: number } | null>(null);
  const [height, setHeight] = useState(600);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.height > 0) setHeight(entry.contentRect.height);
    });
    observer.observe(container.current!);
    return () => observer.disconnect();
  }, []);
  const split = inspectorSplit(height, ratio);
  const resize = (pixels: number) =>
    onRatio(Math.max(split.minimum, Math.min(split.maximum, pixels)) / (split.available || 1));
  return (
    <div
      ref={container}
      className="ds-inspector"
      data-tab={tab}
      style={
        compact ? undefined : { gridTemplateRows: `${split.properties}px 12px minmax(0, 1fr)` }
      }
    >
      {properties}
      {!compact && (
        <div
          className="ds-inspector-divider"
          role="separator"
          tabIndex={0}
          aria-label={label}
          aria-orientation="horizontal"
          aria-valuemin={Math.round((split.minimum / (split.available || 1)) * 100)}
          aria-valuemax={Math.round((split.maximum / (split.available || 1)) * 100)}
          aria-valuenow={Math.round((split.properties / (split.available || 1)) * 100)}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            gesture.current = { y: event.clientY, properties: split.properties };
          }}
          onPointerMove={(event) => {
            if (gesture.current)
              resize(gesture.current.properties + event.clientY - gesture.current.y);
          }}
          onPointerUp={(event) => {
            gesture.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
          onLostPointerCapture={() => {
            gesture.current = null;
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 40 : 16;
            const value =
              event.key === "Home"
                ? split.minimum
                : event.key === "End"
                  ? split.maximum
                  : event.key === "ArrowUp"
                    ? split.properties - step
                    : event.key === "ArrowDown"
                      ? split.properties + step
                      : null;
            if (value !== null) {
              event.preventDefault();
              resize(value);
            }
          }}
        />
      )}
      {layers}
    </div>
  );
}
