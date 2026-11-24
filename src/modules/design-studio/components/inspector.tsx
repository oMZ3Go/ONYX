import Image from "next/image";
import { Icon } from "@/components/icon";
import { StudioIcon } from "./studio-icon";
import { InspectorLayout } from "./inspector-layout";
import { SideTarget, TransformControls, LayerControls } from "../editor/editor-controls";
import type { Editor } from "../editor/use-editor";
import { useState } from "react";
import type {
  AvailableVariant,
  CatalogArtwork,
  GarmentProduct,
  LocalizedStudioProps,
} from "../types";

interface Props extends LocalizedStudioProps {
  editor: Editor;
  compact: boolean;
  split: number;
  onSplit: (ratio: number) => void;
  product: GarmentProduct;
  variants: readonly AvailableVariant[];
  variant: AvailableVariant;
  artwork: CatalogArtwork | undefined;
  tab: "element" | "garment" | "layers";
  onTab: (tab: "element" | "garment" | "layers") => void;
  onVariant: (id: string) => void;
}
export function Inspector({
  editor,
  locale,
  copy,
  product,
  variants,
  variant,
  artwork,
  tab,
  onTab,
  onVariant,
  compact,
  split,
  onSplit,
}: Props) {
  const [placementError, setPlacementError] = useState(false);
  const count = editor.state.project.sides[editor.state.activeSide].layerOrder.length;
  return (
    <InspectorLayout
      compact={compact}
      ratio={split}
      onRatio={onSplit}
      label={copy.resizeSplit}
      tab={tab}
      properties={
        <section className="ds-properties ds-surface" aria-label={copy.properties.title}>
          <div className="ds-property-tabs" aria-label={copy.properties.title}>
            <button type="button" aria-pressed={tab === "element"} onClick={() => onTab("element")}>
              {copy.properties.element}
            </button>
            <button type="button" aria-pressed={tab === "garment"} onClick={() => onTab("garment")}>
              {copy.properties.garment}
            </button>
            <button
              className="ds-layers-tab"
              type="button"
              aria-pressed={tab === "layers"}
              onClick={() => onTab("layers")}
            >
              {copy.layers.title}
            </button>
          </div>
          <div className="ds-property-content" hidden={compact && tab === "layers"}>
            {tab === "garment" || tab === "layers" ? (
              <div className="ds-garment-settings">
                <div className="ds-product-heading">
                  <Icon name="shirt" />
                  <div>
                    <h3>{product.name[locale]}</h3>
                    <p>{copy.properties.mockup}</p>
                  </div>
                </div>
                <div className="ds-mini-views">
                  {(["front", "back"] as const).map((side) => (
                    <figure key={side}>
                      <Image
                        src={variant.mockups[side].src}
                        width={variant.mockups[side].width}
                        height={variant.mockups[side].height}
                        alt=""
                        sizes="150px"
                      />
                      <figcaption>{copy.workspace[side]}</figcaption>
                    </figure>
                  ))}
                </div>
                <fieldset className="ds-variants">
                  <legend>{copy.properties.color}</legend>
                  {variants.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={variant.id === item.id}
                      onClick={() => onVariant(item.id)}
                    >
                      <i style={{ backgroundColor: item.swatch }} aria-hidden="true" />
                      <span>{item.name[locale]}</span>
                      {variant.id === item.id && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </fieldset>
                <p className="ds-subtle">{copy.properties.colorHint}</p>
              </div>
            ) : artwork ? (
              <div className="ds-artwork-detail">
                <div className="ds-artwork-summary">
                  <Image
                    src={artwork.thumbnail.src}
                    width={artwork.thumbnail.width}
                    height={artwork.thumbnail.height}
                    alt=""
                    sizes="96px"
                  />
                  <div>
                    <h3>{artwork.name[locale]}</h3>
                    <p>{copy.properties.catalogPreview}</p>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>{copy.properties.sourceSize}</dt>
                    <dd>
                      <bdi>
                        {artwork.source.width} × {artwork.source.height} px
                      </bdi>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.properties.rights}</dt>
                    <dd>
                      {artwork.rights.status === "provisional"
                        ? copy.properties.provisional
                        : artwork.rights.status === "approved" && artwork.rights.commercialUse
                          ? copy.properties.approved
                          : copy.properties.unverified}
                    </dd>
                  </div>
                </dl>
                <p className="ds-subtle">{copy.editor.rightsNote}</p>
                <SideTarget editor={editor} copy={copy} locale={locale} />
                <button
                  type="button"
                  className="ds-disabled-action"
                  onClick={() => {
                    try {
                      editor.controller.add(editor.state.activeSide, artwork.id);
                      setPlacementError(false);
                    } catch {
                      setPlacementError(true);
                    }
                  }}
                  aria-describedby="ds-placement-note"
                >
                  <Icon name="image" />
                  {copy.properties.add}
                </button>
                <p className="ds-subtle" id="ds-placement-note">
                  {placementError ? copy.editor.invalid : copy.editor.previewNote}
                </p>
              </div>
            ) : (
              <div className="ds-empty">
                <Icon name="image" />
                <h3>{copy.properties.noSelection}</h3>
                <p>{copy.properties.selectHint}</p>
              </div>
            )}
            {tab === "element" && editor.state.selection[editor.state.activeSide].length > 0 && (
              <TransformControls editor={editor} copy={copy} locale={locale} />
            )}
          </div>
        </section>
      }
      layers={
        <section className="ds-layers ds-surface" aria-labelledby="ds-layers-title">
          <div className="ds-panel-title">
            <h2 id="ds-layers-title">
              {copy.layers.title} <span>({count})</span>
            </h2>
            <StudioIcon name="layers" />
          </div>
          {count > 0 ? (
            <LayerControls editor={editor} copy={copy} locale={locale} />
          ) : (
            <div className="ds-empty">
              <StudioIcon name="layers" />
              <h3>{copy.layers.empty}</h3>
              <p>{copy.layers.hint}</p>
            </div>
          )}
          <div className="ds-layer-footnote">
            <StudioIcon name="eye" />
            <span>{copy.layers.separateSides}</span>
          </div>
        </section>
      }
    />
  );
}
