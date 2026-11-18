import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import type { DisplayPrice, LocalizedText } from "@/modules/catalog/contracts";

export type StudioCopy = Messages["designStudio"];
export type Side = "front" | "back";
export type ViewMode = Side | "both";
export type WorkspaceTheme = "dark" | "light";
export type LibrarySection = "artwork" | "upload" | "text" | "shapes" | "saved";
export type Panel = "library" | "inspector" | null;

export interface ImageAsset {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly originalSrc: string;
  readonly originalWidth?: number;
  readonly originalHeight?: number;
}
/** Physical production geometry is absent until supplier calibration is approved. */
export interface PrintSpecification {
  readonly revision: string;
  readonly unit: "mm";
  readonly regions: Readonly<Record<Side, { width: number; height: number }>>;
}
export interface GarmentVariant {
  readonly id: string;
  readonly name: LocalizedText;
  readonly swatch: string;
  readonly active: boolean;
  readonly availability: "preview" | "available" | "unavailable";
  readonly mockups: Readonly<Partial<Record<Side, ImageAsset>>>;
  readonly price: DisplayPrice | null;
  readonly printSpecification: PrintSpecification | null;
}
export interface GarmentProduct {
  readonly id: string;
  readonly name: LocalizedText;
  readonly type: "hoodie" | "tshirt" | "sweatshirt";
  readonly active: boolean;
  readonly variants: readonly GarmentVariant[];
}
export interface ArtworkCategory {
  readonly id: string;
  readonly name: LocalizedText;
}
export interface CatalogArtwork {
  readonly id: string;
  readonly name: LocalizedText;
  readonly categoryId: string;
  readonly active: boolean;
  readonly thumbnail: ImageAsset;
  readonly source: ImageAsset;
  readonly compatibility: {
    readonly productIds: readonly string[];
    readonly variantIds: readonly string[] | null;
  };
  readonly rights: {
    readonly status: "unverified" | "provisional" | "approved";
    readonly commercialUse: boolean;
    readonly attribution: string | null;
  };
}
export interface StudioCatalog {
  readonly revision: string;
  readonly products: readonly GarmentProduct[];
  readonly categories: readonly ArtworkCategory[];
  readonly artworks: readonly CatalogArtwork[];
}
export interface StudioCatalogReader {
  getCatalog(): Promise<StudioCatalog>;
}
export type AvailableVariant = GarmentVariant & {
  mockups: Readonly<Record<Side, ImageAsset>>;
};
/** Shell document only; no engine objects, viewport settings or uncalibrated print values. */
export interface ProjectDocument {
  readonly schemaVersion: 1;
  readonly catalogRevision: string;
  readonly garment: { readonly productId: string; readonly variantId: string };
  readonly sides: Readonly<Record<Side, { readonly elements: readonly never[] }>>;
}
/** Browsing an artwork is not adding it to the document. */
export interface WorkspaceState {
  view: ViewMode;
  grid: boolean;
  categoryId: string;
  section: LibrarySection;
  inspectedArtworkId: string | null;
  inspectorTab: "element" | "garment" | "layers";
  panel: Panel;
}
export interface LocalizedStudioProps {
  locale: Locale;
  copy: StudioCopy;
}

/** Only a future real persistence adapter may advance this lifecycle. */
export type SaveState = "notSaved" | "saving" | "saved" | "unsaved" | "failed";
export interface SaveLifecycle {
  state: SaveState;
  onSave?: () => void;
}
