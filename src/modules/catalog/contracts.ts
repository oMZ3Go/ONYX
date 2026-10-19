import type { Locale } from "@/i18n/config";
/** Read-only display projection of the documented Product / ProductVariant model. */
export type LocalizedText = Readonly<Record<Locale, string>>;
export type Availability = "available" | "unavailable";
export interface DisplayPrice {
  readonly minorUnits: number;
  readonly currency: string;
  readonly scale: number;
}
export interface ProductImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: LocalizedText;
}
export interface ProductDisplay {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description?: LocalizedText;
  readonly image?: ProductImage;
  readonly category?: { readonly slug: string; readonly title: LocalizedText };
  readonly price?: DisplayPrice;
  readonly colors?: readonly {
    readonly id: string;
    readonly label: LocalizedText;
    readonly hex: string;
  }[];
  readonly variants?: readonly { readonly id: string; readonly availability: Availability }[];
}
/** Slots are presentation identities, never additional domain products. */
export interface ProductSlot {
  readonly key: string;
  readonly product: ProductDisplay;
}
export interface FeaturedCatalog {
  readonly preview: boolean;
  readonly slots: readonly ProductSlot[];
}
export interface CatalogReader {
  getFeatured(): Promise<FeaturedCatalog>;
}
export function formatPrice(price: DisplayPrice, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: price.scale,
    maximumFractionDigits: price.scale,
  }).format(price.minorUnits / 10 ** price.scale);
}
