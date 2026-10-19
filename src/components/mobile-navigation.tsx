"use client";
import { useEffect, useRef } from "react";
import type { Messages } from "@/i18n/messages";
import { Icon } from "./icon";
import { navigation } from "./navigation";
export function MobileNavigation({ nav, start }: { nav: Messages["nav"]; start: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };
    const wide = matchMedia("(min-width: 1100px)");
    const resize = () => {
      if (wide.matches) menu.open = false;
    };
    document.addEventListener("keydown", close);
    wide.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", close);
      wide.removeEventListener("change", resize);
    };
  }, []);
  return (
    <details ref={ref} className="mobile-navigation">
      <summary aria-controls="mobile-menu">
        <span className="when-closed">
          <Icon name="menu" />
          <span className="sr-only">{nav.open}</span>
        </span>
        <span className="when-open">
          <Icon name="close" />
          <span className="sr-only">{nav.close}</span>
        </span>
      </summary>
      <nav
        id="mobile-menu"
        aria-label={nav.label}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a") && ref.current) ref.current.open = false;
        }}
      >
        {navigation.map(([key, href]) => (
          <a key={key} href={href}>
            {nav[key]}
            <Icon name="arrow" className="directional" />
          </a>
        ))}
        <a className="button button-primary" href="#design-studio">
          {start}
          <Icon name="arrow" className="directional" />
        </a>
      </nav>
    </details>
  );
}
