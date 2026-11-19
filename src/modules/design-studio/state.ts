import type { ProjectDocument, WorkspaceState } from "./types";

export function initialWorkspace(categoryId: string): WorkspaceState {
  return {
    view: "back",
    grid: false,
    categoryId,
    section: "artwork",
    inspectedArtworkId: null,
    inspectorTab: "garment",
    panel: null,
  };
}
export function createProject(
  catalogRevision: string,
  productId: string,
  variantId: string,
): ProjectDocument {
  return {
    schemaVersion: 1,
    catalogRevision,
    garment: { productId, variantId },
    sides: { front: { elements: [] }, back: { elements: [] } },
  };
}
