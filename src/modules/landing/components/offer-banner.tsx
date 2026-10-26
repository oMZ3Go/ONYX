import Image from "next/image";
import { Icon } from "@/components/icon";
import type { Messages } from "@/i18n/messages";
import { assets } from "../assets";
import { HandwrittenNote } from "./handwritten-note";
import type { Locale } from "@/i18n/config";
import type { CampaignDisplay } from "@/modules/catalog/contracts";
import { PerimeterLight } from "@/components/perimeter-light";
export function OfferBanner({
  copy,
  start,
  locale,
  campaign,
}: {
  copy: Messages["offer"];
  start: string;
  locale: Locale;
  campaign?: CampaignDisplay;
}) {
  return (
    <section id="offers" className="offer-wrap section-light" aria-labelledby="offer-title">
      <div className="offer-frame">
        <PerimeterLight />
        <div className="offer-banner" data-motion-section>
          <Image
            draggable={false}
            src={assets.offer.background.src}
            alt=""
            className="offer-background"
            fill
            sizes="95vw"
          />
          <div className="offer-copy" data-reveal="side">
            <p className="eyebrow">{campaign?.label?.[locale] ?? copy.eyebrow}</p>
            <h2 id="offer-title">
              {campaign ? (
                campaign.headline[locale]
              ) : (
                <>
                  {copy.title} <em>{copy.accent}</em>
                </>
              )}
            </h2>
            <p>{campaign?.description[locale] ?? copy.description}</p>
            <a
              className={`button button-primary ${campaign ? "" : "design-cta"}`}
              href={campaign?.cta.href ?? "#design-studio"}
            >
              {campaign?.cta.label[locale] ?? start}
              <Icon name="arrow" className="directional" />
            </a>
          </div>
          <div className="offer-artwork" data-reveal="garment" data-delay="150">
            <div className="offer-float" data-float="offer">
              <div className="offer-hover">
                <span className="offer-glow" aria-hidden="true" />
                <Image
                  draggable={false}
                  {...assets.offer.hoodie}
                  alt={copy.image}
                  sizes="(max-width: 767px) 65vw, 36vw"
                />
              </div>
            </div>
            <HandwrittenNote
              asset={assets.offer.note}
              className="offer-note"
              sizes="(max-width: 767px) 110px, 170px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
