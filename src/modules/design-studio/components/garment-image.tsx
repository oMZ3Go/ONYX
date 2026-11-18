import Image from "next/image";
import { useEffect, useState } from "react";
import type { ImageAsset } from "../types";
const originals = new Map<string, Promise<void>>();
function loadOriginal(src: string) {
  let promise = originals.get(src);
  if (!promise) {
    const image = new window.Image();
    image.src = src;
    promise = image.decode().catch((error: unknown) => {
      originals.delete(src);
      throw error;
    });
    originals.set(src, promise);
  }
  return promise;
}
export function GarmentImage({
  asset,
  highResolution,
  renderedWidth,
  alt,
}: {
  asset: ImageAsset;
  highResolution: boolean;
  renderedWidth: number;
  alt: string;
}) {
  const [decoded, setDecoded] = useState<string | null>(null);
  // Keep the decoded preview candidate stable while the original is in flight.
  const [previewWidth, setPreviewWidth] = useState(renderedWidth);
  if (!highResolution && previewWidth !== renderedWidth) setPreviewWidth(renderedWidth);
  useEffect(() => {
    if (!highResolution) return;
    let current = true;
    void loadOriginal(asset.originalSrc)
      .then(() => {
        if (current) setDecoded(asset.originalSrc);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [asset.originalSrc, highResolution]);
  const original = decoded === asset.originalSrc;
  return (
    <Image
      // A fresh element drops the responsive candidate's density correction.
      key={original ? asset.originalSrc : asset.src}
      src={original ? asset.originalSrc : asset.src}
      width={original ? (asset.originalWidth ?? asset.width) : asset.width}
      height={original ? (asset.originalHeight ?? asset.height) : asset.height}
      unoptimized={original}
      data-resolution={original ? "original" : "preview"}
      alt={alt}
      sizes={original ? undefined : `${Math.ceil(previewWidth)}px`}
      loading="eager"
      draggable={false}
    />
  );
}
