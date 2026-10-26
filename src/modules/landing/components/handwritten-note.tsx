import Image from "next/image";
import type { Artwork } from "../assets";
export function HandwrittenNote({
  asset,
  className = "",
  sizes,
  delay = 0,
}: {
  asset: Artwork;
  className?: string;
  sizes: string;
  delay?: number;
}) {
  return (
    <div
      className={`handwritten-note ${className}`}
      aria-hidden="true"
      data-reveal="note"
      data-delay={delay}
    >
      <Image draggable={false} {...asset} alt="" sizes={sizes} />
    </div>
  );
}
