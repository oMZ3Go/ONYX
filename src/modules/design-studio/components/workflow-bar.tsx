import Image from "next/image";
import { Icon } from "@/components/icon";
import { formatPrice } from "@/modules/catalog/contracts";
import { StudioIcon } from "./studio-icon";
import type {
  AvailableVariant,
  GarmentProduct,
  LocalizedStudioProps,
  SaveLifecycle,
} from "../types";

export function WorkflowBar({
  locale,
  copy,
  product,
  variant,
  save = { state: "notSaved" },
}: LocalizedStudioProps & {
  product: GarmentProduct;
  variant: AvailableVariant;
  save?: SaveLifecycle;
}) {
  return (
    <footer className="ds-workflow">
      <div className="ds-workflow-product">
        <span className="ds-product-thumbnail">
          <Image
            src={variant.mockups.front.src}
            width={variant.mockups.front.width}
            height={variant.mockups.front.height}
            alt=""
            sizes="84px"
          />
        </span>
        <div>
          <strong>{product.name[locale]}</strong>
          <p>
            {variant.price ? formatPrice(variant.price, locale) : copy.workflow.priceUnavailable}
          </p>
        </div>
      </div>
      <ol className="ds-steps" aria-label={copy.workflow.steps}>
        {(["design", "review", "order"] as const).map((step, index) => (
          <li key={step} aria-current={index === 0 ? "step" : undefined}>
            <span>{index + 1}</span>
            <span>{copy.workflow[step]}</span>
          </li>
        ))}
      </ol>
      <div className="ds-workflow-actions">
        <button
          type="button"
          className="ds-save"
          disabled={!save.onSave || save.state === "saving"}
          aria-busy={save.state === "saving"}
          onClick={save.onSave}
          aria-describedby="ds-workflow-note"
        >
          <StudioIcon name="bookmark" />
          <span>{save.state === "saving" ? copy.saveStates.saving : copy.workflow.save}</span>
        </button>
        <button type="button" className="ds-continue" disabled aria-describedby="ds-workflow-note">
          <span>{copy.workflow.continue}</span>
          <Icon name="arrow" className="directional" />
        </button>
      </div>
      <p id="ds-workflow-note" className="ds-accessible-help">
        {copy.deferred.workflow}
      </p>
    </footer>
  );
}
