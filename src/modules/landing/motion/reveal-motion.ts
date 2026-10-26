/** Enhancement-only entrances. Prepare before entry, never blank already readable content. */
export function initializeReveals(locale: string) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const roots = [...document.querySelectorAll<HTMLElement>("[data-reveal], [data-brush]")];
  // Observe the fitted image rather than its larger decorative positioning wrapper.
  const targets = roots.map((root) => (root.dataset.brush ? root.querySelector("img")! : root));
  const observedRoots = new Map<Element, HTMLElement>(
    targets.map((target, index) => [target, roots[index]!]),
  );
  const pending = new Map<HTMLElement, Animation[]>();
  const visible = new Set<Element>();
  const paused = () => document.documentElement.dataset.motionPaused === "true";
  const ease = "cubic-bezier(.22,.7,.22,1)";
  const sign = locale === "ar" ? 1 : -1;
  const complete = (root: HTMLElement) => {
    const animations = pending.get(root);
    pending.delete(root);
    animations?.forEach((animation) => {
      animation.onfinish = null;
      animation.cancel();
    });
    root.dataset.revealState = "complete";
  };
  // Read the whole layout before adding animation styles, including nested notes.
  const bounds = targets.map((target) => target.getBoundingClientRect());
  roots.forEach((root, index) => {
    const rect = bounds[index]!;
    if (reduced.matches || paused() || (rect.top < innerHeight && rect.bottom > 0)) {
      root.dataset.revealState = "complete";
      return;
    }
    const kind = root.dataset.reveal;
    const transform =
      kind === "side"
        ? `translateX(${sign * 24}px)`
        : kind === "note"
          ? `translate(${sign * 12}px, 10px) rotate(-3deg)`
          : kind === "garment"
            ? "translateY(26px) scale(.97)"
            : kind === "card"
              ? "translateY(24px)"
              : "translateY(16px)";
    const animations: Animation[] = [];
    const add = (element: Element, frames: Keyframe[], delay = 0, duration = 820) => {
      const animation = element.animate(frames, {
        duration,
        delay: Number(root.dataset.delay || 0) + delay,
        easing: ease,
        fill: "both",
      });
      animation.pause();
      animation.currentTime = 0;
      animations.push(animation);
    };
    if (root.dataset.brush) {
      // Staggered bristles follow each raster's curve. The image keeps its native alpha.
      const lags = [70, 15, 45, 0, 30, 60, 20];
      root.querySelectorAll(".brush-reveal-path").forEach((path, index) => {
        add(
          path,
          [{ strokeDashoffset: root.dataset.brushReverse ? "-1" : "1" }, { strokeDashoffset: "0" }],
          lags[index],
          root.dataset.brush === "gesture" ? 1250 : 1100,
        );
      });
    } else {
      add(root, [
        { opacity: 0, transform },
        { opacity: 1, transform: "none" },
      ]);
    }
    if (kind === "category" || kind === "scene" || kind === "card") {
      const image = root.querySelector(
        kind === "card" ? ".product-image" : kind === "scene" ? ".story-background" : "img",
      );
      if (image) add(image, [{ clipPath: "inset(0 0 26% 0)" }, { clipPath: "inset(0)" }], 35, 1000);
    }
    if (kind === "category") {
      for (const [selector, delay] of [
        [".category-copy", 160],
        [".category-arrow", 240],
      ] as const) {
        const child = root.querySelector(selector);
        if (child)
          add(
            child,
            [
              { opacity: 0, translate: "0 10px" },
              { opacity: 1, translate: "0 0" },
            ],
            delay,
            640,
          );
      }
    }
    pending.set(root, animations);
    root.dataset.revealState = "prepared";
    let finished = 0;
    animations.forEach((animation) => {
      animation.onfinish = () => {
        if (++finished === animations.length) complete(root);
      };
    });
  });
  const sync = () => {
    for (const [root, animations] of pending) {
      // Explicit pause is also a request for a readable static page.
      if (reduced.matches || paused()) {
        complete(root);
        continue;
      }
      if (document.hidden || !visible.has(root)) animations.forEach((a) => a.pause());
      else {
        root.dataset.revealState = "running";
        animations.forEach((a) => {
          if (a.playState === "paused") a.play();
        });
      }
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const root = observedRoots.get(entry.target)!;
        if (entry.isIntersecting) visible.add(root);
        else visible.delete(root);
      }
      sync();
    },
    { threshold: 0, rootMargin: "0px 0px -16px 0px" },
  );
  observedRoots.forEach((root, target) => {
    if (pending.has(root)) observer.observe(target);
  });
  const focus = (event: FocusEvent) => {
    for (const root of pending.keys()) if (root.contains(event.target as Node)) complete(root);
  };
  document.addEventListener("focusin", focus);
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("onyx-motion-change", sync);
  reduced.addEventListener("change", sync);
  return () => {
    observer.disconnect();
    for (const root of pending.keys()) complete(root);
    roots.forEach((root) => delete root.dataset.revealState);
    document.removeEventListener("focusin", focus);
    document.removeEventListener("visibilitychange", sync);
    document.removeEventListener("onyx-motion-change", sync);
    reduced.removeEventListener("change", sync);
  };
}
