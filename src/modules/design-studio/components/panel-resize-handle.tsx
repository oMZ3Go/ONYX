import { useRef } from "react";
export function PanelResizeHandle({
  side,
  label,
  width,
  maximum,
  onResize,
  onDragging,
}: {
  side: "library" | "inspector";
  label: string;
  width: number;
  maximum: number;
  onResize: (width: number) => void;
  onDragging: (dragging: boolean) => void;
}) {
  const drag = useRef<{ x: number; width: number } | null>(null);
  const sign = side === "library" ? 1 : -1;
  const resize = (next: number) => onResize(Math.round(Math.max(260, Math.min(maximum, next))));
  return (
    <div
      className="ds-panel-resizer"
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={260}
      aria-valuemax={Math.round(maximum)}
      aria-valuenow={Math.round(width)}
      aria-controls={`ds-${side}-panel`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { x: event.clientX, width };
        onDragging(true);
      }}
      onPointerMove={(event) => {
        if (drag.current) resize(drag.current.width + (event.clientX - drag.current.x) * sign);
      }}
      onPointerUp={(event) => {
        drag.current = null;
        onDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onLostPointerCapture={() => {
        drag.current = null;
        onDragging(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        onDragging(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Home") {
          event.preventDefault();
          resize(260);
        } else if (event.key === "End") {
          event.preventDefault();
          resize(maximum);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          resize(width + (event.key === "ArrowRight" ? 1 : -1) * sign * (event.shiftKey ? 40 : 16));
        }
      }}
    />
  );
}
