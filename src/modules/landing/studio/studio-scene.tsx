"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon, type IconName } from "@/components/icon";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { DesignerCursorGraphic } from "../motion/designer-cursor-graphic";
import { initializeStudioDemo } from "../motion/studio-dom";
import { studioArtworks, studioAssets } from "./artworks";

type Copy = Messages["studio"];
const tools = [
  ["text", "text"],
  ["image", "image"],
  ["artwork", "palette"],
  ["garment", "shirt"],
  ["adjustments", "adjustments"],
] as const satisfies ReadonlyArray<readonly [string, IconName]>;
const colors = ["navy", "blue", "gray", "white"] as const;

export function StudioScene({ copy, locale }: { copy: Copy; locale: Locale }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof initializeStudioDemo> | null>(null);
  const loaded = useRef(new Set<number>());
  const requested = useRef(0);
  const printImages = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const demo = initializeStudioDemo(root.current!, (index) => {
      requested.current = index;
      setActive(index);
      const image = printImages.current[index];
      if (loaded.current.has(index) || (image?.complete && image.naturalWidth > 0)) setShown(index);
    });
    controller.current = demo;
    return () => {
      demo.dispose();
      controller.current = null;
    };
  }, []);

  const select = (index: number) => {
    controller.current?.select(index);
    setAnnouncement(`${copy.selected}: ${copy.artworks[studioArtworks[index]!.id]}`);
  };
  return (
    <div
      className="studio-scene"
      ref={root}
      data-active-artwork={studioArtworks[active]!.id}
      data-demo-phase="idle"
      data-locale={locale}
    >
      <div className="studio-grid" aria-hidden="true" />
      <div className="studio-garment-position">
        <div className="studio-garment-reveal" data-reveal="garment" data-delay="120">
          <div className="studio-garment" data-float="studio-garment">
            <Image
              {...studioAssets.hoodie}
              alt={copy.hoodieAlt}
              sizes="(max-width: 600px) 100vw, (max-width: 1023px) 560px, 600px"
              draggable={false}
              className="studio-hoodie"
            />
            <div className="studio-print-region" aria-hidden="true">
              {studioArtworks.map((artwork, index) => (
                <div
                  key={artwork.id}
                  className="studio-print"
                  data-artwork={artwork.id}
                  data-visible={shown === index}
                  style={
                    {
                      "--print-width": `${artwork.width}%`,
                      "--print-x": `${artwork.x}%`,
                      "--print-y": `${artwork.y}%`,
                    } as CSSProperties
                  }
                >
                  <Image
                    {...artwork.image}
                    alt=""
                    sizes="(max-width: 600px) 30vw, 190px"
                    draggable={false}
                    ref={(image) => {
                      printImages.current[index] = image;
                    }}
                    onLoad={() => {
                      loaded.current.add(index);
                      if (requested.current === index) setShown(index);
                    }}
                  />
                </div>
              ))}
              <div className="studio-selection">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        </div>
        <div className="studio-brush-foreground" aria-hidden="true">
          <Image
            {...studioAssets.wave}
            alt=""
            draggable={false}
            sizes="(max-width: 600px) 75vw, 470px"
          />
        </div>
      </div>
      <div className="studio-tools-position" data-reveal="up" data-delay="260">
        <div
          className="studio-tools studio-floating-panel"
          role="group"
          aria-label={copy.tools.label}
          data-float="studio-panel"
          data-studio-travel="4"
        >
          {tools.map(([key, icon]) => (
            <div className="studio-tool" key={key}>
              <button
                type="button"
                aria-label={copy.tools[key]}
                aria-pressed={key === "image"}
                aria-disabled={key !== "image" || undefined}
                aria-describedby={`studio-tool-${key}`}
              >
                <Icon name={icon} />
              </button>
              <span className="studio-tooltip" id={`studio-tool-${key}`} role="tooltip">
                {copy.tools[key]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="studio-palette-position" data-reveal="up" data-delay="320">
        <div
          className="studio-palette studio-floating-panel"
          role="group"
          aria-label={copy.colors.label}
          data-float="studio-panel"
          data-studio-travel="3"
        >
          <div className="studio-swatches">
            {colors.map((color) => (
              <button
                type="button"
                key={color}
                className="studio-swatch"
                data-color={color}
                aria-pressed={color === "navy"}
                aria-disabled={color !== "navy" || undefined}
                aria-label={copy.colors[color]}
              >
                <span />
                {color === "navy" && (
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m4 8 3 3 5-6" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="studio-artworks-position" data-reveal="up" data-delay="380">
        <div
          className="studio-artworks studio-floating-panel"
          data-float="studio-panel"
          data-studio-travel="5"
        >
          <p className="studio-selector-label" id="studio-artworks-label">
            {copy.artworksLabel}
          </p>
          <div
            className="studio-artwork-options"
            role="group"
            aria-labelledby="studio-artworks-label"
          >
            {studioArtworks.map((artwork, index) => (
              <button
                type="button"
                key={artwork.id}
                data-studio-option={index}
                aria-label={copy.artworks[artwork.id]}
                aria-pressed={active === index}
                aria-describedby={artwork.id === "dragon" ? "studio-provisional" : undefined}
                onClick={() => select(index)}
              >
                <Image {...artwork.image} alt="" sizes="48px" draggable={false} />
              </button>
            ))}
          </div>
          <div className="studio-selector-caption">
            <span>{copy.artworks[studioArtworks[active]!.id]}</span>
            <span aria-hidden="true">0{active + 1} / 04</span>
          </div>
          <div className="studio-cursor" aria-hidden="true">
            <DesignerCursorGraphic />
          </div>
        </div>
      </div>
      <p className="sr-only" id="studio-provisional">
        {copy.provisional}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <p className="studio-scene-note">{copy.previewNote}</p>
    </div>
  );
}
