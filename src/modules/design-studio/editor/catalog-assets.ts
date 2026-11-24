import manifest from "../catalog/artwork-manifest.json";
import { availableVariants, compatibleArtworks } from "../catalog/selectors";
import type { StudioCatalog } from "../types";
import type { AssetRecord, EditorProject } from "./document";

export function catalogAsset(project: EditorProject, catalog: StudioCatalog, id: string) {
  const product = catalog.products.find((p) => p.id === project.garment.productId);
  if (
    catalog.revision !== project.catalogRevision ||
    !product ||
    !availableVariants(product).some((v) => v.id === project.garment.variantId)
  )
    throw new Error("Unresolved catalog or garment");
  const artwork = compatibleArtworks(catalog.artworks, product.id, project.garment.variantId).find(
    (a) => a.id === id,
  );
  const source = Object.hasOwn(manifest, id) ? manifest[id as keyof typeof manifest] : undefined;
  if (
    !artwork ||
    !source ||
    source.src !== artwork.source.originalSrc ||
    source.width !== artwork.source.width ||
    source.height !== artwork.source.height
  )
    throw new Error("Unresolved or incompatible artwork");
  const asset: AssetRecord = {
    id: `catalog-${id}-${source.sha256.slice(0, 16)}`,
    sha256: source.sha256,
    mime: "image/png",
    byteLength: source.byteLength,
    pixels: { width: source.width, height: source.height },
    source: { kind: "catalog", ref: { id, revision: catalog.revision } },
  };
  return { artwork, asset, src: source.src };
}

export function resolveCatalogSource(asset: AssetRecord): string {
  if (asset.source.kind !== "catalog") throw new Error("Unsupported asset source");
  const id = asset.source.ref.id;
  const source = Object.hasOwn(manifest, id) ? manifest[id as keyof typeof manifest] : undefined;
  if (
    !source ||
    source.sha256 !== asset.sha256 ||
    source.byteLength !== asset.byteLength ||
    source.width !== asset.pixels?.width ||
    source.height !== asset.pixels.height
  )
    throw new Error("Asset identity mismatch");
  return source.src;
}
