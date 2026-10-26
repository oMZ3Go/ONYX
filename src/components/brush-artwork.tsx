import Image from "next/image";
import type { CSSProperties } from "react";

/** Original, alpha-preserving campaign textures; lazy decoration never affects layout. */
export function BrushArtwork({
  id,
  gesture = false,
  reverse = false,
}: {
  id: string;
  gesture?: boolean;
  reverse?: boolean;
}) {
  const path = gesture
    ? "M -.08 .36 C .18 1.08 .47 1.03 1.15 -.06"
    : "M -.16 .5 C .25 .78 .6 .84 1.18 .08";
  return (
    <span
      className="brush-art"
      data-brush={gesture ? "gesture" : "wide"}
      data-brush-reverse={reverse || undefined}
      style={
        {
          "--brush-mask": `url(#${id})`,
          "--brush-ratio": gesture ? 1100 / 629 : 1400 / 467,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      <svg className="brush-mask" aria-hidden="true" width="0" height="0">
        <defs>
          <mask
            id={id}
            maskUnits="objectBoundingBox"
            maskContentUnits="objectBoundingBox"
            x="0"
            y="0"
            width="1"
            height="1"
          >
            {[-3, -2, -1, 0, 1, 2, 3].map((band) => (
              <path
                key={band}
                className="brush-reveal-path"
                d={path}
                transform={`translate(0 ${band * (gesture ? 0.08 : 0.14)})`}
                fill="none"
                stroke="white"
                strokeWidth={gesture ? 0.18 : 0.22}
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1 1"
              />
            ))}
          </mask>
        </defs>
      </svg>
      <Image
        src={`/images/atmosphere/dry-brush-${gesture ? "gesture" : "wide"}.webp`}
        alt=""
        width={gesture ? 1100 : 1400}
        height={gesture ? 629 : 467}
        sizes="(max-width: 767px) 85vw, 800px"
        loading="lazy"
        draggable={false}
      />
    </span>
  );
}
