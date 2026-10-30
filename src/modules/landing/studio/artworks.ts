import type { Artwork } from "../assets";

const asset = (name: string, width: number, height: number): Artwork => ({
  src: `/images/landing/web/design-studio/${name}.webp`,
  width,
  height,
});

export const studioAssets = {
  hoodie: asset("hoodie-back-navy", 1200, 1026),
  stroke: asset("decorations/brush-stroke", 1000, 563),
  wave: asset("decorations/brush-wave", 1000, 333),
};

/** Percentages within the fixed back-print region; retain each raster's native ratio. */
export const studioArtworks = [
  { id: "crown", image: asset("prints/print-crown", 364, 368), width: 82, x: -1.5, y: 0 },
  { id: "space", image: asset("prints/print-space", 600, 453), width: 94, x: -3, y: -1 },
  { id: "nature", image: asset("prints/print-nature", 600, 513), width: 96, x: -1, y: -4 },
  { id: "dragon", image: asset("prints/print-dragon", 480, 600), width: 78, x: -2, y: 1 },
] as const;
export type StudioArtworkId = (typeof studioArtworks)[number]["id"];
