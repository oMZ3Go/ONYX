import type { Side } from "../types";
import type { AssetRecord, EditorProject, FontRecord, SideDocument, Transform } from "./document";
import type { SurfaceGeometry } from "./coordinates";

export type GestureCancellation =
  | "escape"
  | "pointercancel"
  | "lostcapture"
  | "pinch"
  | "blur"
  | "hidden"
  | "side-change"
  | "geometry-change"
  | "unmount";
/** Proposals only. The controller validates IDs, locks, revision and geometry before a commit. */
export type SurfaceIntent =
  | {
      readonly type: "select";
      readonly side: Side;
      readonly ids: readonly string[];
      readonly additive: boolean;
    }
  | {
      readonly type: "begin-transform";
      readonly gestureId: string;
      readonly side: Side;
      readonly ids: readonly string[];
      readonly baseRevision: number;
      readonly operation: "drag" | "resize" | "rotate";
    }
  | {
      readonly type: "preview-transform";
      readonly gestureId: string;
      readonly transforms: Readonly<Record<string, Transform>>;
    }
  | { readonly type: "commit-transform"; readonly gestureId: string }
  | {
      readonly type: "cancel-transform";
      readonly gestureId: string;
      readonly reason: GestureCancellation;
    };
/** Planned client surface props; no engine classes, persistence handles or catalog mutations. */
export interface EditorSurfaceProps {
  readonly side: Side;
  readonly document: SideDocument;
  readonly revision: EditorProject["revision"];
  readonly assets: Readonly<Record<string, AssetRecord>>;
  readonly fonts: Readonly<Record<string, FontRecord>>;
  readonly geometry: SurfaceGeometry;
  readonly selectedIds: readonly string[];
  readonly transientTransforms: Readonly<Record<string, Transform>>;
  readonly interactive: boolean;
  readonly onIntent: (intent: SurfaceIntent) => void;
}
/** Asset decoding belongs to a disposable runtime resolver, outside saved project data. */
export interface EditorAssetResolver {
  resolve(asset: AssetRecord, signal: AbortSignal): Promise<Blob>;
}
