"use client";
import { useEffect } from "react";
import { navigation } from "./navigation";
import { activeSection } from "./scroll-navigation";

/** Measures on resize/font changes; intersection callbacks select cached destinations. */
export function NavigationMotion({ locale }: { locale: string }) {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header")!;
    const nav = header.querySelector<HTMLElement>(".desktop-navigation")!;
    const indicator = nav.querySelector<HTMLElement>(".nav-indicator")!;
    const sections = navigation.map(([, href]) => document.querySelector<HTMLElement>(href)!);
    const targets = sections.map((el) => (el.id === "contact" ? el.closest("footer")! : el));
    const links = [...header.querySelectorAll<HTMLAnchorElement>("[data-section-link]")];
    let positions: number[] = [],
      current = "",
      activationLine = 0,
      documentHeight = 0,
      atBottom = false,
      observer: IntersectionObserver | undefined;
    const mark = (href: string) => {
      current = href;
      for (const link of links) {
        if (link.hash === href) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      const link = nav.querySelector<HTMLElement>(`a[href="${href}"]`);
      if (link) {
        indicator.style.width = `${link.offsetWidth}px`;
        indicator.style.transform = `translateX(${link.offsetLeft}px)`;
        indicator.style.opacity = "1";
      }
    };
    const select = () => {
      atBottom = scrollY + innerHeight >= documentHeight - 4;
      const index = atBottom
        ? navigation.length - 1
        : activeSection(positions, scrollY + activationLine);
      const href = navigation[index]![1];
      if (current !== href) mark(href);
    };
    const measure = () => {
      positions = targets.map((el) => el.getBoundingClientRect().top + scrollY);
      documentHeight = document.documentElement.scrollHeight;
      // Full-page captures and viewport teardown can briefly report a zero height.
      // Clamp geometry, then negate numbers (never concatenate a second minus sign).
      const viewportHeight = Math.max(2, innerHeight);
      activationLine = Math.max(
        0,
        Math.min(viewportHeight - 2, header.offsetHeight + viewportHeight * 0.28),
      );
      observer?.disconnect();
      observer = new IntersectionObserver(select, {
        // A narrow band detects transitions between adjacent short sections too.
        // A large zone can intersect both the offer and story before and after a jump.
        rootMargin: `${-activationLine}px 0px ${-(viewportHeight - activationLine - 1)}px 0px`,
        threshold: 0,
      });
      targets.forEach((el) => observer!.observe(el));
      select();
      if (current) mark(current);
    };
    const scroll = () => {
      const scrolled = String(scrollY > 12);
      if (header.dataset.scrolled !== scrolled) header.dataset.scrolled = scrolled;
      if (scrollY + innerHeight >= documentHeight - 4 !== atBottom) select();
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("[data-section-link]");
      if (link) mark(link.hash);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(header);
    resize.observe(document.querySelector("main")!);
    resize.observe(document.querySelector("footer")!);
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (!disposed) measure();
    });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", measure);
    header.addEventListener("click", click);
    measure();
    scroll();
    return () => {
      disposed = true;
      observer?.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", measure);
      header.removeEventListener("click", click);
    };
  }, [locale]);
  return null;
}
