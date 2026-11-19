import type { AvailableVariant, CatalogArtwork, GarmentProduct, ImageAsset } from "../types";

function hasImage(asset: ImageAsset | undefined): asset is ImageAsset {
  return !!asset?.src && !!asset.originalSrc && asset.width > 0 && asset.height > 0;
}
export function availableVariants(product: GarmentProduct): AvailableVariant[] {
  if (!product.active) return [];
  return product.variants.filter(
    (variant): variant is AvailableVariant =>
      variant.active &&
      variant.availability !== "unavailable" &&
      hasImage(variant.mockups.front) &&
      hasImage(variant.mockups.back),
  );
}
export function compatibleArtworks(
  artworks: readonly CatalogArtwork[],
  productId: string,
  variantId: string,
) {
  return artworks.filter(
    (artwork) =>
      artwork.active &&
      artwork.compatibility.productIds.includes(productId) &&
      (artwork.compatibility.variantIds === null ||
        artwork.compatibility.variantIds.includes(variantId)),
  );
}
