import type { Messages } from "@/i18n/messages";
import { assets, categoryKeys, type Artwork } from "./assets";

/** Ordered, locale-resolved display data; identity is independent of its name or route. */
export interface LandingCategory {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly image: Artwork;
  readonly published: boolean;
}

/** Initial editorial source. A future provider can supply the same display collection. */
export function getLandingCategories(copy: Messages["categories"]): readonly LandingCategory[] {
  return categoryKeys.map((key) => ({
    id: key,
    slug: key,
    title: copy[key].title,
    description: copy[key].description,
    image: assets.categories[key],
    published: true,
  }));
}
