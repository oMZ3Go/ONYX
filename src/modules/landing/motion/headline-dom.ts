import type { Locale } from "@/i18n/config";
import { createTimelineLoop, IDLE_START_MS, type HeadlineFrame } from "./headline-timeline";
import { headlineEffects, dragAfterimage } from "./headline-effects";
import { browserScheduler } from "./browser-scheduler";
type Point = { x: number; y: number };
const ease = (p: number) => 1 - (1 - p) ** 3;
const mix = (a: Point, b: Point, p: number): Point => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
});
export function initializeHeadline(root: HTMLDivElement, locale: Locale) {
  const heading = root.querySelector<HTMLElement>("h1")!;
  const lines = [...root.querySelectorAll<HTMLElement>(".headline-line")];
  const first = lines[0]!,
    second = lines[1]!;
  const cursor = root.querySelector<HTMLElement>(".designer-cursor")!;
  const menu = root.querySelector<HTMLElement>(".color-menu")!;
  const swatch = root.querySelector<HTMLElement>("[data-color='blue']")!;
  const cta = root.querySelector<HTMLElement>(".hero-cta")!;
  const flash = cursor.querySelector<HTMLElement>("span")!;
  const echoes = lines.map((line) => [...line.querySelectorAll<HTMLElement>(".headline-echo")]);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false,
    disposed = false,
    enhanced = false;
  let geometry = {
    first: { x: 0, y: 0 },
    second: { x: 0, y: 0 },
    outside: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    swatch: { x: 0, y: 0 },
    button: { x: 0, y: 0 },
    group: { x: 0, y: 0 },
    offset: 0,
  };
  const measure = () => {
    const bounds = root.getBoundingClientRect();
    const rect = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - bounds.left, y: r.top - bounds.top, w: r.width, h: r.height };
    };
    const h = rect(heading),
      b = rect(cta),
      rtl = locale === "ar";
    // Layout offsets ignore animated text transforms and work with either writing direction.
    const anchor = (line: HTMLElement) => ({
      x: h.x + line.offsetLeft + line.offsetWidth * (rtl ? 0.18 : 0.82),
      y: h.y + line.offsetTop + line.offsetHeight * 0.7,
    });
    const offset = rtl
      ? innerWidth - bounds.left + first.offsetWidth
      : -bounds.left - first.offsetWidth - 50;
    const menuX = Math.max(
      0,
      Math.min(root.clientWidth - menu.offsetWidth, h.x + (rtl ? 0 : second.offsetWidth * 0.35)),
    );
    menu.style.left = `${menuX}px`;
    // The contextual tool may overlap copy, but always clears the real CTA.
    const menuY = Math.min(h.y + h.h + 8, b.y - menu.offsetHeight - 10);
    menu.style.top = `${menuY}px`;
    geometry = {
      first: anchor(first),
      second: anchor(second),
      outside: { x: offset, y: h.y - 15 },
      origin: { x: h.x + h.w * 0.5, y: h.y - 28 },
      swatch: {
        x: menuX + swatch.offsetLeft + swatch.offsetWidth * 0.5,
        y: menuY + swatch.offsetTop + 14,
      },
      button: { x: b.x + b.w * (rtl ? 0.3 : 0.7), y: b.y + b.h * 0.55 },
      group: { x: h.x + h.w * 0.55, y: h.y + h.h * 0.4 },
      offset,
    };
  };
  const render = (frame: HeadlineFrame) => {
    const { phase, progress, cycleTime } = frame;
    const effects = headlineEffects(frame);
    root.dataset.phase = phase;
    const p = ease(progress),
      g = geometry;
    first.style.opacity = cycleTime >= 1000 && phase !== "delete" ? "1" : "0";
    second.style.opacity = cycleTime >= 3450 && phase !== "delete" ? "1" : "0";
    const moving1 = phase === "drag-first",
      moving2 = phase === "drag-second";
    const offset1 = moving1 ? g.offset * (1 - p) : 0,
      offset2 = moving2 ? g.offset * (1 - p) : 0;
    first.style.transform = `translate3d(${offset1}px, ${moving1 ? -26 * (1 - p) : 0}px, 0)`;
    second.style.transform = `translate3d(${offset2}px, ${moving2 ? -22 * (1 - p) : 0}px, 0)`;
    first.dataset.selected = String(moving1);
    const blur = dragAfterimage(frame, g.offset);
    echoes.forEach((layers, lineIndex) =>
      layers.forEach((layer, index) => {
        const active = lineIndex === 0 ? moving1 : moving2;
        layer.style.opacity = String(active ? blur.opacity / (index + 1) : 0);
        layer.style.transform = `translate3d(${blur.x * (index + 1)}px,${blur.y * (index + 1)}px,0)`;
      }),
    );
    second.dataset.selected = String(moving2 || ["context", "palette", "color"].includes(phase));
    heading.dataset.selected = String(phase === "select-all");
    // Only the palette selection may introduce the brand color.
    const blue = phase === "color" ? p : cycleTime >= 6750 ? 1 : 0;
    second.style.color =
      blue === 1
        ? "var(--onyx-blue)"
        : blue === 0
          ? "var(--onyx-white)"
          : `color-mix(in srgb, var(--onyx-blue) ${blue * 100}%, var(--onyx-white))`;
    menu.style.opacity = String(effects.menu);
    menu.style.transform = `translateY(${-6 * (1 - effects.menu)}px) scaleY(${0.86 + 0.14 * effects.menu})`;
    menu.style.clipPath = `inset(0 0 ${(1 - effects.menu) * 100}% 0 round 10px)`;
    menu.dataset.state = phase === "palette" ? "opening" : phase === "color" ? "closing" : "closed";
    swatch.dataset.chosen = String(effects.chosen);
    cta.style.scale = phase === "pulse" ? String(1 + Math.sin(progress * Math.PI) * 0.035) : "1";
    cta.dataset.pulse = String(phase === "pulse");
    let point: Point = g.origin;
    if (phase === "exit-first") point = mix(g.origin, g.outside, p);
    else if (moving1) point = { x: g.first.x + offset1, y: g.first.y - 26 * (1 - p) };
    else if (phase === "release-first") point = g.first;
    else if (phase === "exit-second") point = mix(g.first, g.outside, p);
    else if (moving2) point = { x: g.second.x + offset2, y: g.second.y - 22 * (1 - p) };
    else if (phase === "context") point = g.second;
    else if (phase === "palette") point = mix(g.second, g.swatch, p);
    else if (phase === "color") point = g.swatch;
    else if (phase === "to-button") point = mix(g.swatch, g.button, p);
    else if (["pulse", "fade", "idle"].includes(phase)) point = g.button;
    else if (phase === "return") point = mix(g.button, g.group, p);
    else if (["select-all", "delete"].includes(phase)) point = g.group;
    // SVG hotspot is (2,2), mirrored to (23,2) in RTL.
    cursor.style.transform = `translate3d(${point.x - (locale === "ar" ? 23 : 2)}px, ${point.y - 2}px, 0)`;
    cursor.style.opacity =
      phase === "idle"
        ? "0"
        : phase === "delete"
          ? String(Math.max(0, 1 - progress * 2))
          : phase === "fade"
            ? String(1 - progress)
            : phase === "empty" || phase === "return"
              ? String(Math.min(progress * 4, 1))
              : "1";
    cursor.dataset.click = String(effects.click < 1);
    cursor.dataset.blue = String(effects.blueClick);
    flash.style.opacity = String((1 - effects.click) * 0.75);
    flash.style.transform = `scale(${0.35 + effects.click * 1.15})`;
  };
  const firstPaint = performance.getEntriesByName("first-contentful-paint")[0];
  // If slow JS left the fallback on screen, hold it before the first deletion instead
  // of abruptly blanking a heading the visitor has already been reading.
  const alreadyReading = firstPaint && performance.now() - firstPaint.startTime > 750;
  const loop = createTimelineLoop(render, browserScheduler(), alreadyReading ? IDLE_START_MS : 0);
  const restore = () => {
    root.dataset.phase = "static";
    delete root.dataset.enhanced;
    for (const el of [first, second, cursor, menu, cta, flash, ...echoes.flat()]) {
      el.removeAttribute("style");
      delete el.dataset.selected;
      delete el.dataset.pulse;
    }
    delete heading.dataset.selected;
    delete root.dataset.paused;
  };
  const sync = () => {
    if (disposed) return;
    if (reduced.matches) {
      loop.pause();
      loop.reset();
      enhanced = false;
      restore();
      return;
    }
    root.dataset.paused = String(document.documentElement.dataset.motionPaused === "true");
    if (root.dataset.paused === "true") {
      loop.pause();
      return;
    }
    if (!visible || document.hidden) {
      loop.pause();
      return;
    }
    if (!enhanced) {
      measure();
      root.dataset.enhanced = "true";
      enhanced = true;
    }
    loop.resume();
  };
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      sync();
    },
    { threshold: 0.15 },
  );
  observer.observe(root);
  const initialBounds = root.getBoundingClientRect();
  visible = initialBounds.bottom > 0 && initialBounds.top < innerHeight;
  sync();
  const resize = new ResizeObserver(measure);
  resize.observe(root);
  resize.observe(heading);
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("onyx-motion-change", sync);
  reduced.addEventListener("change", sync);
  void document.fonts.ready.then(() => {
    if (!disposed) {
      measure();
      sync();
    }
  });
  return () => {
    disposed = true;
    loop.dispose();
    observer.disconnect();
    resize.disconnect();
    document.removeEventListener("visibilitychange", sync);
    document.removeEventListener("onyx-motion-change", sync);
    reduced.removeEventListener("change", sync);
    restore();
  };
}
