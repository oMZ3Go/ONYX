import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { boundCamera, zoomAt, type Camera, type CameraGeometry } from "./camera";

export function useCameraNavigation(
  viewport: RefObject<HTMLDivElement | null>,
  camera: Camera,
  geometry: CameraGeometry | null,
  onCamera: (camera: Camera) => void,
  cancelArtwork: () => void,
) {
  const [hand, setHand] = useState(false);
  const [temporaryHand, setTemporaryHand] = useState(false);
  const [dragging, setDragging] = useState(false);
  const live = useRef(camera);
  useEffect(() => {
    live.current = camera;
  }, [camera]);
  const constrain = useEffectEvent(() => {
    if (!geometry) return;
    const next = boundCamera(camera, geometry);
    if (next.zoom !== camera.zoom || next.x !== camera.x || next.y !== camera.y) onCamera(next);
  });
  useEffect(() => {
    constrain();
  }, [
    geometry?.width,
    geometry?.height,
    geometry?.contentWidth,
    geometry?.contentHeight,
    geometry?.maximum,
  ]);
  const send = useEffectEvent((next: Camera) => {
    if (geometry) {
      live.current = boundCamera(next, geometry);
      onCamera(live.current);
    }
  });
  const zoom = useEffectEvent((next: number, anchor: { x: number; y: number }) =>
    geometry ? zoomAt(live.current, next, anchor, geometry) : live.current,
  );
  const canDrag = useEffectEvent(() => hand || temporaryHand);
  const cancel = useEffectEvent(cancelArtwork);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const points = new Map<number, { x: number; y: number }>();
    let frame = 0,
      pending: Camera | null = null,
      moved = false,
      navigating = false;
    const queue = (next: Camera) => {
      live.current = next;
      pending = next;
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (pending) send(pending);
          pending = null;
        });
    };
    const relative = (x: number, y: number) => {
      const b = el.getBoundingClientRect();
      return { x: x - b.x - b.width / 2, y: y - b.y - b.height / 2 };
    };
    const down = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("[data-editor-toolbar]")) return;
      if (event.button !== 0 || (event.pointerType !== "touch" && !canDrag())) return;
      if (!points.size) moved = false;
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (canDrag() || points.size > 1) {
        cancel();
        navigating = true;
        for (const id of points.keys()) el.setPointerCapture(id);
        event.preventDefault();
        event.stopImmediatePropagation();
        setDragging(true);
      }
    };
    const move = (event: PointerEvent) => {
      const previous = points.get(event.pointerId);
      if (!previous) return;
      const before = [...points.values()];
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const after = [...points.values()];
      if (navigating || canDrag()) event.stopImmediatePropagation();
      if (points.size >= 2) {
        event.preventDefault();
        moved = true;
        setDragging(true);
        const mid = (p: typeof before) => ({
          x: (p[0]!.x + p[1]!.x) / 2,
          y: (p[0]!.y + p[1]!.y) / 2,
        });
        const distance = (p: typeof before) => Math.hypot(p[0]!.x - p[1]!.x, p[0]!.y - p[1]!.y);
        const a = mid(before),
          b = mid(after),
          length = distance(before);
        const next = zoom(
          live.current.zoom * (length > 2 ? distance(after) / length : 1),
          relative(a.x, a.y),
        );
        queue({ ...next, x: next.x + b.x - a.x, y: next.y + b.y - a.y });
      } else if (canDrag()) {
        event.preventDefault();
        const dx = event.clientX - previous.x,
          dy = event.clientY - previous.y;
        if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
        queue({ ...live.current, x: live.current.x + dx, y: live.current.y + dy });
      }
    };
    const up = (event: PointerEvent) => {
      if (event.type === "lostpointercapture" && event.target !== el) return;
      if (event.type !== "pointerup") cancel();
      if (navigating) event.stopImmediatePropagation();
      points.delete(event.pointerId);
      if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
      if (!points.size) {
        setDragging(false);
        navigating = false;
      }
    };
    const wheel = (event: WheelEvent) => {
      cancel();
      event.preventDefault();
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1);
      queue(
        zoom(
          live.current.zoom * Math.exp(-Math.max(-200, Math.min(200, delta)) * 0.003),
          relative(event.clientX, event.clientY),
        ),
      );
    };
    const click = (event: MouseEvent) => {
      if (moved) {
        event.preventDefault();
        event.stopImmediatePropagation();
        moved = false;
      }
    };
    const key = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.code !== "Space" ||
        !el.matches(":hover") ||
        (target instanceof HTMLElement &&
          (target.isContentEditable || /INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName)))
      )
        return;
      event.preventDefault();
      cancel();
      setTemporaryHand(event.type === "keydown");
    };
    const release = () => {
      setTemporaryHand(false);
      setDragging(false);
      points.clear();
      navigating = false;
      cancel();
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.code === "Space") setTemporaryHand(false);
    };
    el.addEventListener("pointerdown", down, true);
    el.addEventListener("pointermove", move, true);
    el.addEventListener("pointerup", up, true);
    el.addEventListener("pointercancel", up, true);
    el.addEventListener("lostpointercapture", up, true);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("click", click, true);
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", release);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", down, true);
      el.removeEventListener("pointermove", move, true);
      el.removeEventListener("pointerup", up, true);
      el.removeEventListener("pointercancel", up, true);
      el.removeEventListener("lostpointercapture", up, true);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("click", click, true);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", release);
    };
  }, [viewport]);
  return {
    hand,
    activeHand: hand || temporaryHand,
    dragging,
    toggleHand: () => {
      cancelArtwork();
      setHand(!hand);
    },
  };
}
