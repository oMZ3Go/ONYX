"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
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
      visible = new Set<Element>(),
      reveals = new Set<Animation>();
    let parallaxFrame = 0;
    const disabled = () =>
      reduced.matches || document.documentElement.dataset.motionPaused === "true";
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            revealObserver.unobserve(entry.target);
            if (disabled()) continue;
            const element = entry.target as HTMLElement,
              kind = element.dataset.reveal,
              sign = locale === "ar" ? 1 : -1;
            const transform =
              kind === "side"
                ? `translateX(${sign * 22}px)`
                : kind === "note"
                  ? `translate(${sign * 10}px, 8px) scale(.94)`
                  : kind === "card"
                    ? "translateY(22px) scale(.985)"
                    : "translateY(18px)";
            const animation = element.animate(
              [
                { opacity: 0, transform },
                { opacity: 1, transform: "none" },
              ],
              {
                duration: 720,
                delay: Number(element.dataset.delay || 0),
                easing: "cubic-bezier(.22,1,.36,1)",
                fill: "backwards",
              },
            );
            reveals.add(animation);
            animation.onfinish = () => {
              reveals.delete(animation);
              animation.cancel();
            };
            const connector = element.querySelector(".step-connector");
            if (kind === "step" && connector && fine.matches) {
              const line = connector.animate(
                [
                  { opacity: 0, transform: "scaleX(.4)" },
                  { opacity: 1, transform: "scaleX(1)" },
                ],
                {
                  duration: 650,
                  delay: 200 + Number(element.dataset.delay || 0),
                  easing: "ease-out",
                  fill: "backwards",
                },
              );
              reveals.add(line);
              line.onfinish = () => {
                reveals.delete(line);
                line.cancel();
              };
            }
          }
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));
    const floats = document.querySelectorAll<HTMLElement>("[data-float]");
    const sync = () => {
      for (const element of floats) {
        let animation = animations.get(element);
        if (disabled() || !fine.matches) {
          animation?.cancel();
          animations.delete(element);
          continue;
        }
        if (!animation) {
          const type = element.dataset.float;
          const frames =
            type === "hero"
              ? [{ transform: "translateY(0)" }, { transform: "translateY(-10px)" }]
              : type === "offer"
                ? [{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }]
                : [
                    { transform: "scale(1) translateY(0)" },
                    { transform: "scale(1.02) translateY(-2px)" },
                  ];
          animation = element.animate(frames, {
            duration: type === "hero" ? 3500 : type === "offer" ? 4000 : 4500,
            direction: "alternate",
            iterations: Infinity,
            easing: "ease-in-out",
          });
          animations.set(element, animation);
        }
        if (document.hidden || !visible.has(element)) animation.pause();
        else animation.play();
      }
      for (const animation of reveals) {
        if (disabled()) animation.finish();
        else if (document.hidden) animation.pause();
        else animation.play();
      }
      if (disabled())
        document
          .querySelectorAll<HTMLElement>("[data-parallax]")
          .forEach((el) => el.style.removeProperty("transform"));
    };
    const floatObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        sync();
      },
      { threshold: 0 },
    );
    floats.forEach((el) => floatObserver.observe(el));
    const story = document.querySelector<HTMLElement>(".story-artwork");
    const parallax = () => {
      if (parallaxFrame || disabled() || document.hidden || !fine.matches || !story) return;
      parallaxFrame = requestAnimationFrame(() => {
        parallaxFrame = 0;
        const rect = story.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const progress = Math.max(
          -1,
          Math.min(1, (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight),
        );
        story.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          el.style.transform = `translateY(${progress * (el.dataset.parallax === "background" ? 14 : -7)}px)`;
        });
      });
    };
    document.addEventListener("visibilitychange", sync);
    document.addEventListener("onyx-motion-change", sync);
    reduced.addEventListener("change", sync);
    fine.addEventListener("change", sync);
    window.addEventListener("scroll", parallax, { passive: true });
    sync();
    return () => {
      revealObserver.disconnect();
      floatObserver.disconnect();
      animations.forEach((a) => a.cancel());
      reveals.forEach((a) => a.cancel());
      cancelAnimationFrame(parallaxFrame);
      document.removeEventListener("visibilitychange", sync);
      document.removeEventListener("onyx-motion-change", sync);
      reduced.removeEventListener("change", sync);
      fine.removeEventListener("change", sync);
      window.removeEventListener("scroll", parallax);
      delete document.documentElement.dataset.motionPaused;
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
      <span>{paused ? play : pause}</span>
    </button>
  );
}
