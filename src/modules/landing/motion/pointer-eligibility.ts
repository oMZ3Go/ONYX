/** Local pointer effects share preferences, but never subscribe to global pointer movement. */
export function pointerEligibility(
  target: HTMLElement,
  reset: () => void,
  onChange?: (allowed: boolean) => void,
) {
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  const allowed = () =>
    visible &&
    fine.matches &&
    !reduced.matches &&
    !document.hidden &&
    document.documentElement.dataset.motionPaused !== "true";
  const sync = () => {
    if (!allowed()) reset();
    onChange?.(allowed());
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    sync();
  });
  observer.observe(target);
  fine.addEventListener("change", sync);
  reduced.addEventListener("change", sync);
  document.addEventListener("onyx-motion-change", sync);
  document.addEventListener("visibilitychange", sync);
  return {
    allowed,
    dispose() {
      reset();
      onChange?.(false);
      observer.disconnect();
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
      document.removeEventListener("onyx-motion-change", sync);
      document.removeEventListener("visibilitychange", sync);
    },
  };
}
