"use client";
import { useLayoutEffect, useRef } from "react";
import { Icon } from "@/components/icon";
import { initializeHeadline } from "./headline-dom";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
export function AnimatedHeroHeadline({
  locale,
  copy,
  common,
}: {
  locale: Locale;
  copy: Messages["hero"];
  common: Messages["common"];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current) return initializeHeadline(ref.current, locale);
  }, [locale]);
  return (
    <div ref={ref} className="hero-copy" data-locale={locale} data-phase="static">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1 id="hero-title" className="hero-headline" aria-label={`${copy.line1} ${copy.line2}`}>
        <span className="headline-line" aria-hidden="true">
          <span className="headline-echo">{copy.line1}</span>
          <span className="headline-echo">{copy.line1}</span>
          {copy.line1}
          <Selection />
        </span>
        <span className="headline-line headline-accent" aria-hidden="true">
          <span className="headline-echo">{copy.line2}</span>
          <span className="headline-echo">{copy.line2}</span>
          {copy.line2}
          <Selection />
        </span>
        <Selection group />
      </h1>
      <p className="hero-description">{copy.description}</p>
      <div className="hero-actions">
        <a href="#design-studio" className="button button-primary design-cta hero-cta">
          {common.start}
          <Icon name="arrow" className="directional" />
        </a>
        <a href="#collection" className="button button-outline">
          {common.explore}
        </a>
      </div>
      <p className="hero-detail">
        <span />
        {copy.detail}
      </p>
      <ul className="hero-values">
        {(["freedom", "design", "identity"] as const).map((key, index) => (
          <li key={key} data-reveal="value" data-delay={index * 100}>
            <Icon name={key === "freedom" ? "spark" : key === "design" ? "palette" : "person"} />
            <span>{copy.values[key]}</span>
          </li>
        ))}
      </ul>
      <div className="color-menu" aria-hidden="true">
        {(
          [
            ["white", copy.white, "#FFFFFF"],
            ["gray", copy.gray, "#DDDDDD"],
            ["blue", copy.blue, "#8AA9BA"],
          ] as const
        ).map(([key, label, hex]) => (
          <div key={key} data-color={key}>
            <i />
            <span>{label}</span>
            <code>{hex}</code>
          </div>
        ))}
      </div>
      <div className="designer-cursor" aria-hidden="true">
        <svg width="25" height="31" viewBox="0 0 25 31" fill="none">
          <path
            d="M2 2v23l6-6 5 10 5-3-5-9h9L2 2Z"
            fill="var(--onyx-white)"
            stroke="var(--onyx-canvas)"
            strokeWidth="1.5"
          />
        </svg>
        <span />
      </div>
    </div>
  );
}
function Selection({ group = false }: { group?: boolean }) {
  return (
    <span className={`selection-box ${group ? "group-selection" : ""}`} aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <i key={index} />
      ))}
    </span>
  );
}
