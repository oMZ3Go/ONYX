"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Messages } from "@/i18n/messages";
import { Icon } from "./icon";
import { navigation, navigationIcons } from "./navigation";
export function MobileNavigation({
  nav,
  start,
  studioHref,
}: {
  nav: Messages["nav"];
  start: string;
  studioHref: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const menu = ref.current!;
    const panel = menu.querySelector<HTMLElement>("nav")!;
    const summary = menu.querySelector("summary")!;
    const wide = matchMedia("(min-width: 1100px)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const strokes = [...panel.querySelectorAll<HTMLElement>(".menu-paint i")];
    const links = [...panel.querySelectorAll<HTMLAnchorElement>("a")];
    let animations: Animation[] = [];
    let opening = menu.open;
    menu.dataset.enhanced = "true";
    const change = (open: boolean, immediate = false) => {
      const interrupted = animations.length > 0;
      const strokeStates = strokes.map((stroke) => getComputedStyle(stroke).transform);
      const linkStates = links.map((link) => getComputedStyle(link).opacity);
      animations.forEach((animation) => animation.cancel());
      animations = [];
      opening = open;
      menu.dataset.open = String(open);
      summary.setAttribute("aria-expanded", String(open));
      panel.inert = !open;
      const instant =
        immediate || reduced.matches || document.documentElement.dataset.motionPaused === "true";
      if (open) menu.open = true;
      if (instant) {
        menu.open = open;
        return;
      }
      // Overlapping bristled strokes paint in alternating directions. Each one has
      // its own transform, so this is a painted surface, not a translated panel.
      const bristles =
        "polygon(0 1%,99% 0,98.6% 9%,100% 16%,99% 29%,99.7% 43%,98.9% 58%,100% 67%,99.1% 83%,99.8% 94%,98.7% 100%,0 100%,.6% 79%,0 58%,.8% 37%,0 16%)";
      const solid =
        "polygon(0 0,100% 0,100% 9%,100% 16%,100% 29%,100% 43%,100% 58%,100% 67%,100% 83%,100% 94%,100% 100%,0 100%,0 79%,0 58%,0 37%,0 16%)";
      strokes.forEach((stroke, index) => {
        animations.push(
          stroke.animate(
            [
              {
                transform: interrupted ? strokeStates[index] : open ? "scaleX(0)" : "scaleX(1)",
                clipPath: bristles,
              },
              { transform: open ? "scaleX(.96)" : "scaleX(.05)", clipPath: bristles, offset: 0.85 },
              { transform: open ? "scaleX(1)" : "scaleX(0)", clipPath: open ? solid : bristles },
            ],
            {
              duration: open ? 340 : 230,
              delay: open ? index * 42 : (4 - index) * 24 + 65,
              easing: "cubic-bezier(.35,.05,.2,1)",
              fill: "both",
            },
          ),
        );
      });
      links.forEach((link, index) => {
        animations.push(
          link.animate(
            [
              {
                opacity: interrupted ? linkStates[index] : open ? 0 : 1,
                translate: open ? "0 7px" : "0 0",
              },
              { opacity: open ? 1 : 0, translate: open ? "0 0" : "0 -4px" },
            ],
            {
              duration: open ? 220 : 100,
              delay: open ? 150 + index * 36 : 0,
              easing: "ease-out",
              fill: "both",
            },
          ),
        );
      });
      const completion = panel.animate([{ opacity: 1 }, { opacity: 1 }], {
        duration: open ? 560 : 400,
      });
      animations.push(completion);
      completion.onfinish = () => {
        if (!opening) menu.open = false;
        animations.forEach((animation) => animation.cancel());
        animations = [];
      };
    };
    const toggle = (event: MouseEvent) => {
      event.preventDefault();
      change(!opening);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.open) {
        change(false);
        summary.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (menu.open && !menu.contains(event.target as Node)) {
        if (panel.contains(document.activeElement)) summary.focus();
        change(false);
      }
    };
    const navigate = (event: MouseEvent) => {
      if ((event.target as Element).closest("a")) {
        summary.focus();
        change(false, true);
      }
    };
    const resize = () => {
      if (wide.matches) change(false, true);
    };
    const preference = () => {
      if (
        reduced.matches ||
        document.hidden ||
        document.documentElement.dataset.motionPaused === "true"
      )
        change(opening, true);
    };
    summary.addEventListener("click", toggle);
    panel.addEventListener("click", navigate);
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    wide.addEventListener("change", resize);
    reduced.addEventListener("change", preference);
    document.addEventListener("onyx-motion-change", preference);
    document.addEventListener("visibilitychange", preference);
    return () => {
      animations.forEach((animation) => animation.cancel());
      delete menu.dataset.enhanced;
      menu.open = false;
      summary.removeEventListener("click", toggle);
      panel.removeEventListener("click", navigate);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
      wide.removeEventListener("change", resize);
      reduced.removeEventListener("change", preference);
      document.removeEventListener("onyx-motion-change", preference);
      document.removeEventListener("visibilitychange", preference);
    };
  }, []);
  return (
    <details ref={ref} className="mobile-navigation">
      <summary aria-controls="mobile-menu">
        <span className="menu-lines" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="when-closed sr-only">{nav.open}</span>
        <span className="when-open sr-only">{nav.close}</span>
      </summary>
      <nav id="mobile-menu" aria-label={nav.label}>
        <div className="mobile-menu-content">
          <span className="menu-paint" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          {navigation.map(([key, href], index) => (
            <a
              key={key}
              href={href}
              data-section-link
              style={{ "--item-index": index } as CSSProperties}
            >
              <Icon name={navigationIcons[key]} />
              <span>{nav[key]}</span>
              <Icon name="arrow" className="directional" />
            </a>
          ))}
          <a className="button button-primary design-cta" href={studioHref}>
            {start}
            <Icon name="arrow" className="directional" />
          </a>
        </div>
      </nav>
    </details>
  );
}
