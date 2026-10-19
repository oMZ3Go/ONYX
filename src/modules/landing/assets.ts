export interface Artwork {
  src: string;
  width: number;
  height: number;
}
const art = (path: string, width: number, height: number): Artwork => ({
  src: `/images/landing/web/${path}.webp`,
  width,
  height,
});
export const assets = {
  logo: {
    light: { src: "/brand/onyx-logo-light.png", width: 594, height: 403 },
    blue: { src: "/brand/onyx-logo-blue.png", width: 594, height: 403 },
    navy: { src: "/brand/onyx-logo-navy.png", width: 594, height: 403 },
  },
  hero: {
    background: art("hero/hero-background", 1908, 824),
    hoodies: art("hero/hero-hoodies-combined", 1536, 1024),
    note: art("hero/hero-note-more-than-hoodies", 420, 500),
  },
  product: art("products/product-drip-logo", 900, 900),
  categories: {
    cars: art("categories/category-cars", 700, 700),
    anime: art("categories/category-anime", 700, 700),
    typography: art("categories/category-typography", 700, 700),
    minimal: art("categories/category-minimal", 700, 700),
    abstract: art("categories/category-abstract", 700, 700),
  },
  offer: {
    background: art("offer/offer-background", 1800, 600),
    hoodie: art("offer/offer-hoodie", 800, 1000),
    note: art("offer/offer-note-good-ideas", 500, 500),
  },
  story: {
    background: art("story/story-background", 1600, 686),
    model: art("story/story-model", 1400, 933),
    people: art("story/story-note-people-ideas", 375, 500),
    wear: art("story/story-note-wear-your-story", 240, 600),
  },
} as const;
export const categoryKeys = ["cars", "anime", "typography", "minimal", "abstract"] as const;
