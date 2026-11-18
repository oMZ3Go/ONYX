import Image from "next/image";
import { Icon, type IconName } from "@/components/icon";
import type { Messages } from "@/i18n/messages";
import type { Locale } from "@/i18n/config";
import { studioAssets } from "../studio/artworks";
import { StudioScene } from "../studio/studio-scene";
import { StudioEntryLink } from "@/modules/design-studio/components/studio-entry-link";
import "@/styles/studio.css";

const steps = [
  ["choose", "pencil"],
  ["customize", "adjustments"],
  ["preview", "shirt"],
] as const satisfies ReadonlyArray<readonly [string, IconName]>;

export function DesignStudioShowcase({
  copy,
  locale,
}: {
  copy: Messages["studio"];
  locale: Locale;
}) {
  return (
    <section
      id="design-studio"
      className="offer-wrap studio-showcase section-light"
      aria-labelledby="studio-title"
      tabIndex={-1}
    >
      <div className="offer-frame studio-panel">
        <div className="studio-atmosphere" aria-hidden="true" />
        <div className="studio-intro">
          <div data-reveal="side">
            <p className="eyebrow studio-eyebrow">{copy.eyebrow}</p>
            <h2 id="studio-title">
              {copy.title}
              <em>{copy.accent}</em>
            </h2>
          </div>
          <p className="studio-description" data-reveal="up" data-delay="100">
            {copy.description}
          </p>
        </div>
        <div className="studio-scene-slot">
          <div className="studio-brush studio-brush-stroke" aria-hidden="true" data-reveal="up">
            <Image
              {...studioAssets.stroke}
              alt=""
              draggable={false}
              sizes="(max-width: 767px) 100vw, 650px"
            />
          </div>
          <StudioScene copy={copy} locale={locale} />
        </div>
        <ol className="studio-steps" data-reveal="up" data-delay="180">
          {steps.map(([key, icon]) => (
            <li key={key}>
              <Icon name={icon} />
              <div>
                <h3>{copy.steps[key].title}</h3>
                <p>{copy.steps[key].description}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="studio-action" data-reveal="up" data-delay="240">
          <div className="studio-coming-soon">
            <StudioEntryLink href={`/${locale}/design-studio`} loadingLabel={copy.opening}>
              <span className="studio-cta-icon">
                <Icon name="pencil" />
              </span>
              <span className="studio-cta-copy">
                <strong>{copy.cta}</strong>
                <small>{copy.ctaSupport}</small>
              </span>
              <span className="studio-cta-arrow">
                <Icon name="arrow" className="directional" />
              </span>
            </StudioEntryLink>
          </div>
        </div>
      </div>
    </section>
  );
}
