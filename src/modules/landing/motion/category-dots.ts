import { pointerEligibility } from "./pointer-eligibility";

/** Four tiny followers, clipped to Categories. No global pointer listener or React frame state. */
export function initializeCategoryDots() {
  const section = document.querySelector<HTMLElement>("#categories");
  if (!section) return () => {};
  const layer = document.createElement("div");
  layer.className = "category-dots";
  layer.setAttribute("aria-hidden", "true");
  const dots = Array.from({ length: 4 }, () => ({
    element: document.createElement("i"),
    x: 0,
    y: 0,
  }));
  layer.append(...dots.map((dot) => dot.element));
  section.append(layer);
  let frame = 0,
    previous = 0,
    moved = 0,
    x = 0,
    y = 0,
    leaving = 0;
  let active = false,
    bounds: DOMRect | undefined;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = previous = leaving = 0;
    active = false;
    bounds = undefined;
    dots.forEach((dot) => {
      dot.element.style.opacity = "0";
    });
  };
  const eligibility = pointerEligibility(section, reset);
  const draw = (now: number) => {
    frame = 0;
    const fade = leaving
      ? Math.max(0, 1 - (now - leaving) / 180)
      : Math.max(0, 1 - Math.max(0, now - moved - 100) / 380);
    if (!eligibility.allowed() || fade === 0) {
      reset();
      return;
    }
    const dt = Math.min(40, previous ? now - previous : 16.67);
    previous = now;
    let followX = x,
      followY = y;
    dots.forEach((dot, index) => {
      const amount = 1 - Math.exp(-dt / (42 + index * 14));
      dot.x += (followX - dot.x) * amount;
      dot.y += (followY - dot.y) * amount;
      dot.element.style.transform = `translate3d(${dot.x.toFixed(2)}px,${dot.y.toFixed(2)}px,0)`;
      dot.element.style.opacity = String(fade * (0.62 - index * 0.1));
      followX = dot.x;
      followY = dot.y;
    });
    frame = requestAnimationFrame(draw);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !eligibility.allowed()) return;
    bounds ??= section.getBoundingClientRect();
    x = event.clientX - bounds.left;
    y = event.clientY - bounds.top;
    if (!active)
      dots.forEach((dot) => {
        dot.x = x;
        dot.y = y;
      });
    active = true;
    leaving = 0;
    moved = performance.now();
    if (!frame) frame = requestAnimationFrame(draw);
  };
  const leave = () => {
    bounds = undefined;
    if (active) leaving = performance.now();
  };
  section.addEventListener("pointermove", move, { passive: true });
  section.addEventListener("pointerleave", leave);
  section.addEventListener("pointercancel", reset);
  window.addEventListener("scroll", reset, { passive: true });
  window.addEventListener("resize", reset);
  document.addEventListener("keydown", reset);
  return () => {
    eligibility.dispose();
    layer.remove();
    section.removeEventListener("pointermove", move);
    section.removeEventListener("pointerleave", leave);
    section.removeEventListener("pointercancel", reset);
    window.removeEventListener("scroll", reset);
    window.removeEventListener("resize", reset);
    document.removeEventListener("keydown", reset);
  };
}
