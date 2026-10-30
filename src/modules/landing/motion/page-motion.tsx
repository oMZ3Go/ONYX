"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { initializeProcess } from "./process-dom";
import { initializeReveals } from "./reveal-motion";
import { initializeCategoryDots } from "./category-dots";
import { initializeHeroMagnet } from "./hero-magnet";
import { initializeLogoMotion } from "./logo-motion";
import { durationMilliseconds } from "./css-duration";
export function PageMotion({
  pause,
  play,
  locale,
}: {
  pause: string;
  play: string;
  locale: string;
}) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
      fine = matchMedia("(hover: hover) and (pointer: fine)");
    const animations = new Map<Element, Animation>(),
      visible = new Set<Element>();
    const disposeReveals = initializeReveals(locale);
    const disposePointer = initializeCategoryDots();
    const disposeMagnet = initializeHeroMagnet();
    const disposeLogos = initializeLogoMotion();
    const tokens = getComputedStyle(document.documentElement);
    const revealMs = durationMilliseconds(tokens.getPropertyValue("--motion-reveal"), 720);
    const ambientMs = durationMilliseconds(tokens.getPropertyValue("--motion-ambient"), 10000);
    const gradientMs = durationMilliseconds(tokens.getPropertyValue("--motion-gradient"), 3900);
    const offerGradientMs = durationMilliseconds(
      tokens.getPropertyValue("--motion-offer-gradient"),
      5700,
    );
    const manual = () => document.documentElement.dataset.motionPaused === "true";
    const layers = [...document.querySelectorAll<HTMLElement>("[data-float], [data-ambient]")];
    const processRoot = document.querySelector<HTMLElement>("[data-process]");
    const studioRoot = document.querySelector<HTMLElement>(".studio-scene");
    const studioPanel = studioRoot?.closest<HTMLElement>(".studio-panel");
    const process = processRoot ? initializeProcess(processRoot) : undefined;
    const story = document.querySelector<HTMLElement>(".story-artwork");
    const parallaxLayers = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    const cards = [...document.querySelectorAll<HTMLElement>(".product-card")];
    let parallaxFrame = 0;
    const sync = () => {
      const studioVisible = !!studioRoot && visible.has(studioRoot);
      if (studioPanel) {
        if (reduced.matches || !fine.matches) delete studioPanel.dataset.studioMotion;
        else
          studioPanel.dataset.studioMotion =
            studioVisible && !manual() && !document.hidden ? "running" : "paused";
      }
      // All studio layers share active time, so visibility and pause cannot desynchronize
      // the opposite directions. Different panel amplitudes provide the depth variation.
      const studioTime = layers.find((layer) => layer.dataset.float === "studio-garment");
      const studioElapsed = studioTime ? Number(animations.get(studioTime)?.currentTime || 0) : 0;
      if (parallaxFrame && (reduced.matches || manual() || document.hidden || !fine.matches)) {
        cancelAnimationFrame(parallaxFrame);
        parallaxFrame = 0;
      }
      for (const element of layers) {
        let animation = animations.get(element);
        const type = element.dataset.float || element.dataset.ambient;
        const product = type === "product-edge";
        const orbit = type === "orbit";
        const studio = type === "studio-garment" || type === "studio-panel";
        const inView = studio ? studioVisible : visible.has(element);
        const phase = Number(element.dataset.phase || 0);
        const card = product ? element.closest(".product-card") : null;
        const engaged =
          !product ||
          !!card?.matches(":focus-within") ||
          (fine.matches && !!card?.matches(":hover"));
        if (reduced.matches || (!fine.matches && element.dataset.float)) {
          animation?.cancel();
          animations.delete(element);
          continue;
        }
        if (!animation && engaged && inView && !manual() && !document.hidden) {
          const frames = studio
            ? [
                { transform: "translateY(0)" },
                {
                  transform: `translateY(${type === "studio-garment" ? -9 : Number(element.dataset.studioTravel || 4)}px)`,
                },
              ]
            : type === "hero"
              ? [
                  { transform: "translateY(0)" },
                  { transform: "translateY(var(--hero-float-travel, -16px))" },
                ]
              : type === "offer"
                ? [{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }]
                : type === "story"
                  ? [
                      { transform: "scale(1) translateY(0)" },
                      { transform: "scale(1.028) translateY(-3px)" },
                    ]
                  : type === "edge" || product
                    ? [{ "--gradient-angle": "0deg" }, { "--gradient-angle": "360deg" }]
                    : orbit
                      ? [
                          { transform: `rotate(${phase}deg)` },
                          { transform: `rotate(${phase + 360}deg)` },
                        ]
                      : type === "product-surface"
                        ? [
                            { transform: "translate3d(-10%,-5%,0)" },
                            { transform: "translate3d(10%,5%,0)" },
                          ]
                        : type === "paper"
                          ? [
                              { transform: "translate3d(-8%,0,0)", opacity: 0.35 },
                              { transform: "translate3d(8%,4%,0)", opacity: 0.7 },
                            ]
                          : [
                              { transform: "translate3d(-9%,3%,0) rotate(-4deg)", opacity: 0.6 },
                              { transform: "translate3d(9%,-3%,0) rotate(4deg)", opacity: 1 },
                            ];
          animation = element.animate(frames, {
            duration: studio
              ? 4000
              : type === "hero"
                ? 3500
                : type === "offer"
                  ? 4000
                  : type === "story"
                    ? 4500
                    : type === "edge"
                      ? offerGradientMs
                      : product
                        ? gradientMs
                        : orbit
                          ? Number(element.dataset.period)
                          : ambientMs,
            direction: type === "edge" || product || orbit ? "normal" : "alternate",
            iterations: Infinity,
            easing: type === "edge" || product || orbit ? "linear" : "ease-in-out",
            delay: type === "hero" ? 800 : type === "offer" || type === "edge" ? revealMs + 150 : 0,
          });
          animations.set(element, animation);
          if (studio) animation.currentTime = studioElapsed;
        }
        if (animation) {
          if (manual() || document.hidden || !inView || !engaged) animation.pause();
          else animation.play();
        }
      }
      process?.sync({
        reduced: reduced.matches,
        paused: manual(),
        hidden: document.hidden,
        visible: !!processRoot && visible.has(processRoot),
      });
      if (reduced.matches || !fine.matches)
        parallaxLayers.forEach((el) => el.style.removeProperty("transform"));
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target);
          } else visible.delete(entry.target);
        }
        sync();
      },
      { threshold: 0.08 },
    );
    const observed = new Set<Element>(layers);
    if (processRoot) observed.add(processRoot);
    if (studioRoot) observed.add(studioRoot);
    observed.forEach((el) => observer.observe(el));
    const parallax = () => {
      if (
        parallaxFrame ||
        reduced.matches ||
        manual() ||
        document.hidden ||
        !fine.matches ||
        !story
      )
        return;
      parallaxFrame = requestAnimationFrame(() => {
        parallaxFrame = 0;
        const rect = story.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const p = Math.max(
          -1,
          Math.min(1, (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight),
        );
        parallaxLayers.forEach((el) => {
          el.style.transform = `translateY(${p * (el.dataset.parallax === "background" ? 18 : -9)}px)`;
        });
      });
    };
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("onyx-motion-change", sync);
    reduced.addEventListener("change", sync);
    fine.addEventListener("change", sync);
    window.addEventListener("scroll", parallax, { passive: true });
    cards.forEach((card) => {
      for (const event of ["pointerenter", "pointerleave", "focusin", "focusout"])
        card.addEventListener(event, sync);
    });
    sync();
    return () => {
      observer.disconnect();
      animations.forEach((a) => a.cancel());
      disposeReveals();
      disposePointer();
      disposeLogos();
      disposeMagnet();
      process?.dispose();
      cancelAnimationFrame(parallaxFrame);
      parallaxLayers.forEach((el) => el.style.removeProperty("transform"));
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("onyx-motion-change", sync);
      reduced.removeEventListener("change", sync);
      fine.removeEventListener("change", sync);
      window.removeEventListener("scroll", parallax);
      cards.forEach((card) => {
        for (const event of ["pointerenter", "pointerleave", "focusin", "focusout"])
          card.removeEventListener(event, sync);
      });
      delete document.documentElement.dataset.motionPaused;
      if (studioPanel) delete studioPanel.dataset.studioMotion;
    };
  }, [locale]);
  return (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={paused}
      onClick={() => {
        const next = !paused;
        setPaused(next);
        document.documentElement.dataset.motionPaused = String(next);
        document.dispatchEvent(new Event("onyx-motion-change"));
      }}
    >
      <Icon name={paused ? "play" : "pause"} />
      <span className="motion-toggle-label">
        <span aria-hidden={paused}>{pause}</span>
        <span aria-hidden={!paused}>{play}</span>
      </span>
    </button>
  );
}
