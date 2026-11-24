import { availableVariants } from "../catalog/selectors";
import type { StudioCatalog } from "../types";
import type { DesignSpace, EditorProject } from "./document";
import { parseEditorProject } from "./validation";

/** The only supported v1 shape is the empty Phase 03.1 shell. Never drop unknown artwork. */
export function migrateProject(
  input: unknown,
  catalog: StudioCatalog,
  identity: { id: string; now: string },
): EditorProject {
  if (typeof input !== "object" || input === null) throw new Error("Invalid project");
  const p = input as Record<string, unknown>;
  if (p.schemaVersion === 2) return parseEditorProject(input);
  const keys = (v: unknown, expected: string[]) =>
    !!v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.keys(v).length === expected.length &&
    expected.every((key) => Object.hasOwn(v, key));
  if (
    p.schemaVersion !== 1 ||
    !keys(p, ["schemaVersion", "catalogRevision", "garment", "sides"]) ||
    !keys(p.garment, ["productId", "variantId"]) ||
    !keys(p.sides, ["front", "back"]) ||
    p.catalogRevision !== catalog.revision
  )
    throw new Error("Unsupported shell or catalog revision");
  const garment = p.garment as { productId: string; variantId: string };
  const product = catalog.products.find((product) => product.id === garment.productId);
  const variant =
    product && availableVariants(product).find((variant) => variant.id === garment.variantId);
  if (!variant) throw new Error("Unresolved garment reference");
  const sides = p.sides as Record<string, unknown>;
  const side = (name: "front" | "back") => {
    const value = sides[name];
    if (
      !keys(value, ["elements"]) ||
      !Array.isArray((value as { elements: unknown }).elements) ||
      (value as { elements: unknown[] }).elements.length
    )
      throw new Error("Only empty v1 sides can migrate");
    const image = variant.mockups[name];
    const space: DesignSpace = {
      unit: "preview-px",
      width: image.originalWidth ?? image.width,
      height: image.originalHeight ?? image.height,
      mockup: {
        id: `${garment.productId}:${garment.variantId}:${name}`,
        revision: catalog.revision,
      },
    };
    return { space, objectsById: {}, layerOrder: [] };
  };
  return parseEditorProject({
    schemaVersion: 2,
    id: identity.id,
    revision: 0,
    createdAt: identity.now,
    updatedAt: identity.now,
    catalogRevision: p.catalogRevision,
    garment: { ...garment, sizeId: null },
    sides: { front: side("front"), back: side("back") },
    assets: {},
    fonts: {},
    productionSpecRef: null,
  });
}
