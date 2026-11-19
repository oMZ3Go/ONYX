import type { ImageAsset } from "../types";

function preview(path: string, width: number, height: number): ImageAsset {
  return {
    src: `/images/design-studio/web/${path}.webp`,
    originalSrc: `/images/design-studio/${path}.png`,
    width,
    height,
    originalWidth: path.startsWith("hoodies/") ? 1774 : width,
    originalHeight: path.startsWith("hoodies/") ? 887 : height,
  };
}
export const workspaceAssets = {
  front: preview("hoodies/hoodie-black-front", 1600, 800),
  back: preview("hoodies/hoodie-black-back", 1600, 800),
  dark: preview("backgrounds/canvas-dark", 1536, 1024),
  light: preview("backgrounds/canvas-light", 1536, 1024),
} as const;

// These are the existing four showcase references, not new commercial artwork.
export function referenceArtwork(name: string, width: number, height: number): ImageAsset {
  return {
    src: `/images/landing/web/design-studio/prints/print-${name}.webp`,
    originalSrc: `/images/landing/design-studio/prints/print-${name}.png`,
    width,
    height,
  };
}

export function referenceOriginal(name: string, width: number, height: number): ImageAsset {
  const asset = referenceArtwork(name, width, height);
  return { ...asset, src: asset.originalSrc };
}
