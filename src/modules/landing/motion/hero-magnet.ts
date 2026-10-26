import { pointerEligibility } from "./pointer-eligibility";

/** Only the magnetic wrapper moves here; entrance, float and hover keep their own owners. */
export function initializeHeroMagnet() {
  const region = document.querySelector<HTMLElement>("#home");
  const field = region?.querySelector<HTMLElement>(".hero-artwork");
  const artwork = region?.querySelector<HTMLElement>(".hero-magnet");
  if (!region || !field || !artwork) return () => {};
  let frame = 0,
    previous = 0,
    x = 0,
    y = 0,
    targetX = 0,
    targetY = 0;
  let bounds: { hero: DOMRect; artwork: DOMRect } | undefined;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = previous = x = y = targetX = targetY = 0;
    bounds = undefined;
    artwork.style.removeProperty("transform");
  };
  const draw = (now: number) => {
    frame = 0;
    if (!eligibility.allowed()) {
      reset();
      return;
    }
    // Frame-rate independent damping, without overshoot or a continuously running spring.
    const amount = 1 - Math.exp(-Math.min(40, previous ? now - previous : 16.67) / 125);
    previous = now;
    x += (targetX - x) * amount;
    y += (targetY - y) * amount;
    if (Math.hypot(targetX - x, targetY - y) < 0.015) {
      x = targetX;
      y = targetY;
    } else frame = requestAnimationFrame(draw);
    artwork.style.transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0)`;
  };
  const start = () => {
    if (!frame) {
      previous = 0;
      frame = requestAnimationFrame(draw);
    }
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !eligibility.allowed()) return;
    bounds ??= { hero: region.getBoundingClientRect(), artwork: field.getBoundingClientRect() };
    const { hero, artwork: art } = bounds;
    const dx = (event.clientX - art.left - art.width / 2) / (hero.width * 0.5);
    const dy = (event.clientY - art.top - art.height / 2) / (hero.height * 0.55);
    // The whole Hero responds, with a softer field away from the garment and at its edges.
    const distance = Math.hypot(dx, dy);
    const proximity = 0.65 + 0.35 * Math.max(0, 1 - distance);
    const edge = Math.min(
      event.clientX - hero.left,
      hero.right - event.clientX,
      event.clientY - hero.top,
      hero.bottom - event.clientY,
    );
    const fade = Math.max(0, Math.min(1, edge / 48));
    const influence = proximity * fade * fade * (3 - 2 * fade);
    targetX = Math.max(-1, Math.min(1, dx)) * 10 * influence;
    targetY = Math.max(-1, Math.min(1, dy)) * 8 * influence;
    start();
  };
  const leave = () => {
    bounds = undefined;
    targetX = targetY = 0;
    if (eligibility.allowed()) start();
    else reset();
  };
  let listening = false;
  const listen = (allowed: boolean) => {
    if (allowed === listening) return;
    listening = allowed;
    if (allowed) {
      region.addEventListener("pointermove", move, { passive: true });
      region.addEventListener("pointerleave", leave);
      region.addEventListener("pointercancel", reset);
      window.addEventListener("resize", reset);
      window.addEventListener("scroll", reset, { passive: true });
    } else {
      region.removeEventListener("pointermove", move);
      region.removeEventListener("pointerleave", leave);
      region.removeEventListener("pointercancel", reset);
      window.removeEventListener("resize", reset);
      window.removeEventListener("scroll", reset);
    }
  };
  const eligibility = pointerEligibility(region, reset, listen);
  return () => {
    eligibility.dispose();
  };
}
