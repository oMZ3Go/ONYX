/** Paint the exact official image mask, with a gentle return even when interrupted. */
export function initializeLogoMotion() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const allowed = () =>
    !reduced.matches &&
    !document.hidden &&
    document.documentElement.dataset.motionPaused !== "true";
  const empty =
    "polygon(0 0,0 0,0 13%,0 19%,0 25%,0 34%,0 42%,0 51%,0 63%,0 72%,0 84%,0 94%,0 100%,0 100%)";
  const brush =
    "polygon(0 0,72% 0,67% 13%,79% 19%,62% 25%,73% 34%,55% 42%,64% 51%,42% 63%,55% 72%,39% 84%,48% 94%,30% 100%,0 100%)";
  const full =
    "polygon(0 0,100% 0,100% 13%,100% 19%,100% 25%,100% 34%,100% 42%,100% 51%,100% 63%,100% 72%,100% 84%,100% 94%,100% 100%,0 100%)";
  const disposers = [...document.querySelectorAll<HTMLElement>(".brand-logo")].map((logo) => {
    const image = logo.querySelector("img")!;
    let animations: Animation[] = [];
    let engaged = false;
    const clear = () => {
      animations.forEach((a) => {
        a.onfinish = null;
        a.cancel();
      });
      animations = [];
    };
    const update = () => {
      const next = logo.matches(":focus-visible") || (fine.matches && logo.matches(":hover"));
      if (!allowed()) {
        engaged = false;
        clear();
        return;
      }
      if (next === engaged) return;
      engaged = next;
      const imageOpacity = getComputedStyle(image).opacity;
      const paint = getComputedStyle(logo, "::after");
      const paintOpacity = paint.opacity,
        clipPath = paint.clipPath;
      clear();
      animations = next
        ? [
            image.animate(
              [
                { opacity: imageOpacity },
                { opacity: 0.18, offset: 0.18 },
                { opacity: 0.18, offset: 0.65 },
                { opacity: 1 },
              ],
              { duration: 1100, easing: "ease" },
            ),
            logo.animate(
              [
                { clipPath: empty, opacity: 1 },
                { clipPath: brush, opacity: 1, offset: 0.44 },
                { clipPath: full, opacity: 1, offset: 0.82 },
                { clipPath: full, opacity: 0 },
              ],
              { duration: 1100, easing: "ease-in-out", pseudoElement: "::after" },
            ),
          ]
        : [
            image.animate([{ opacity: imageOpacity }, { opacity: 1 }], {
              duration: 260,
              easing: "ease-out",
            }),
            logo.animate(
              [
                { opacity: paintOpacity, clipPath },
                { opacity: 0, clipPath },
              ],
              { duration: 260, easing: "ease-out", pseudoElement: "::after" },
            ),
          ];
      animations[1]!.onfinish = clear;
    };
    for (const event of ["pointerenter", "pointerleave", "focusin", "focusout"])
      logo.addEventListener(event, update);
    for (const event of ["onyx-motion-change", "visibilitychange"])
      document.addEventListener(event, update);
    reduced.addEventListener("change", update);
    fine.addEventListener("change", update);
    return () => {
      clear();
      for (const event of ["pointerenter", "pointerleave", "focusin", "focusout"])
        logo.removeEventListener(event, update);
      for (const event of ["onyx-motion-change", "visibilitychange"])
        document.removeEventListener(event, update);
      reduced.removeEventListener("change", update);
      fine.removeEventListener("change", update);
    };
  });
  return () => disposers.forEach((dispose) => dispose());
}
