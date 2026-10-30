import { browserScheduler } from "./browser-scheduler";
import { createStudioDemo, STUDIO_MOVE_MS } from "./studio-demo";

/** Shares PageMotion's pause event and preferences; no persistent RAF or viewport coordinates. */
export function initializeStudioDemo(root: HTMLElement, select: (index: number) => void) {
  const panel = root.querySelector<HTMLElement>(".studio-artworks")!;
  const cursor = root.querySelector<HTMLElement>(".studio-cursor")!;
  const buttons = [...root.querySelectorAll<HTMLElement>("[data-studio-option]")];
  const prints = [...root.querySelectorAll<HTMLImageElement>(".studio-print img")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const hover = matchMedia("(any-hover: hover)");
  let visible = false;
  let positioned = false;
  let move: Animation | undefined;
  const holdCursor = () => {
    if (!move) return;
    // Preserve the current tip before cancelling, including an interrupted approach.
    const transform = new DOMMatrixReadOnly(getComputedStyle(cursor).transform);
    cursor.style.left = `${parseFloat(cursor.style.left) + transform.m41}px`;
    cursor.style.top = `${parseFloat(cursor.style.top) + transform.m42}px`;
    move.cancel();
    move = undefined;
  };
  const loop = createStudioDemo(
    buttons.length,
    select,
    (phase, target) => {
      root.dataset.demoPhase = phase;
      cursor.dataset.click = String(phase === "click");
      const button = buttons[target]!;
      // Same 25 × 31 SVG and (2,2)/(23,2) hotspot as Hero, including its RTL mirror.
      const x =
        button.offsetLeft + button.offsetWidth / 2 - (root.dataset.locale === "ar" ? 23 : 2);
      const y = button.offsetTop + button.offsetHeight / 2 - 2;
      if (!positioned) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        positioned = true;
      }
      if (phase === "idle") {
        holdCursor();
        return;
      }
      if (phase === "hover") move?.finish();
      if (phase !== "approach") return;
      // Offset coordinates are local to the same floating panel, so scroll, RTL and
      // the panel's ambient translation cannot move the real target away from the tip.
      holdCursor();
      const fromX = parseFloat(cursor.style.left) - x;
      const fromY = parseFloat(cursor.style.top) - y;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      move = cursor.animate(
        [{ transform: `translate(${fromX}px, ${fromY}px)` }, { transform: "translate(0, 0)" }],
        { duration: STUDIO_MOVE_MS, easing: "cubic-bezier(.22,.7,.22,1)", fill: "forwards" },
      );
    },
    browserScheduler(),
  );
  const setHover = (value: boolean) => {
    root.dataset.demoHovered = String(value);
    loop.hover(value);
  };
  const enter = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && hover.matches) setHover(true);
  };
  const leave = (event: PointerEvent) => {
    if (event.pointerType === "mouse") setHover(false);
  };
  const sync = () => {
    if (!hover.matches) setHover(false);
    const eligible =
      visible &&
      !document.hidden &&
      !reduced.matches &&
      document.documentElement.dataset.motionPaused !== "true" &&
      prints.every((img) => img.complete && img.naturalWidth > 0);
    root.dataset.demoEligible = String(eligible);
    loop.sync(eligible);
  };
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      sync();
    },
    { threshold: 0.35 },
  );
  observer.observe(panel);
  // Resizing can change a target mid-gesture. Cancel it and measure again next time.
  const resize = new ResizeObserver(() => {
    loop.sync(false);
    sync();
  });
  resize.observe(root);
  prints.forEach((img) => img.addEventListener("load", sync));
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("onyx-motion-change", sync);
  reduced.addEventListener("change", sync);
  hover.addEventListener("change", sync);
  panel.addEventListener("pointerenter", enter);
  panel.addEventListener("pointerleave", leave);
  sync();
  return {
    select(index: number) {
      loop.select(index);
    },
    dispose() {
      // React can detach the scene before passive-effect cleanup; no geometry read is needed.
      move?.cancel();
      move = undefined;
      loop.dispose();
      observer.disconnect();
      resize.disconnect();
      prints.forEach((img) => img.removeEventListener("load", sync));
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("onyx-motion-change", sync);
      reduced.removeEventListener("change", sync);
      hover.removeEventListener("change", sync);
      panel.removeEventListener("pointerenter", enter);
      panel.removeEventListener("pointerleave", leave);
      delete root.dataset.demoEligible;
      delete root.dataset.demoHovered;
    },
  };
}
