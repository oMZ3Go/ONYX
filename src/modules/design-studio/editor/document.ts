import type { Side } from "../types";

export interface RevisionRef {
  readonly id: string;
  readonly revision: string;
}
/** Preview pixels are registration coordinates, never physical print dimensions. */
export type DesignSpace =
  | {
      readonly unit: "preview-px";
      readonly width: number;
      readonly height: number;
      readonly mockup: RevisionRef;
    }
  | {
      readonly unit: "mm";
      readonly width: number;
      readonly height: number;
      readonly calibration: RevisionRef;
    };
export interface Transform {
  readonly centerX: number;
  readonly centerY: number;
  readonly width: number;
  readonly height: number;
  readonly rotationDeg: number;
  readonly flipX: boolean;
  readonly flipY: boolean;
}
export interface RightsSnapshot {
  readonly status: "unverified" | "provisional" | "approved";
  readonly commercialUse: boolean;
  readonly attribution: string | null;
}
interface ObjectBase {
  readonly id: string;
  readonly name: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacity: number;
  readonly transform: Transform;
}
export type DesignObject = ObjectBase &
  (
    | {
        readonly kind: "artwork";
        readonly artwork: RevisionRef;
        readonly assetId: string;
        readonly rights: RightsSnapshot;
      }
    | {
        readonly kind: "image";
        readonly assetId: string;
        readonly crop: {
          readonly x: number;
          readonly y: number;
          readonly width: number;
          readonly height: number;
        };
      }
    | {
        readonly kind: "text";
        readonly text: string;
        readonly fontId: string;
        readonly fontSize: number;
        readonly weight: number;
        readonly style: "normal" | "italic";
        readonly lineHeight: number;
        readonly align: "left" | "center" | "right";
        readonly direction: "ltr" | "rtl";
        readonly language: string;
        readonly fill: string;
      }
  );
export interface AssetRecord {
  readonly id: string;
  readonly sha256: string;
  readonly mime: "image/png" | "image/jpeg" | "image/webp" | "font/woff2";
  readonly byteLength: number;
  readonly pixels: { readonly width: number; readonly height: number } | null;
  readonly source:
    { readonly kind: "catalog"; readonly ref: RevisionRef } | { readonly kind: "local" };
}
export interface FontRecord {
  readonly id: string;
  readonly assetId: string;
  readonly family: string;
  readonly version: string;
  readonly license: string;
  readonly redistributable: boolean;
}
export interface SideDocument {
  readonly space: DesignSpace;
  readonly objectsById: Readonly<Record<string, DesignObject>>;
  /** Back to front, every object exactly once. */
  readonly layerOrder: readonly string[];
}
export interface EditorProject {
  readonly schemaVersion: 2;
  readonly id: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly catalogRevision: string;
  readonly garment: {
    readonly productId: string;
    readonly variantId: string;
    readonly sizeId: string | null;
  };
  readonly sides: Readonly<Record<Side, SideDocument>>;
  readonly assets: Readonly<Record<string, AssetRecord>>;
  readonly fonts: Readonly<Record<string, FontRecord>>;
  readonly productionSpecRef: RevisionRef | null;
}
