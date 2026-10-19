import Image from "next/image";
import { Icon } from "@/components/icon";
import type { Messages } from "@/i18n/messages";
import { assets } from "../assets";
import { HandwrittenNote } from "./handwritten-note";
export function OfferBanner({ copy, start }: { copy: Messages["offer"]; start: string }) {
  return (
    <section id="offers" className="offer-wrap section-light" aria-labelledby="offer-title">
      <div className="offer-banner" data-motion-section>
        <Image
          src={assets.offer.background.src}
          alt=""
          className="offer-background"
          fill
          sizes="95vw"
        />
        <div className="offer-copy" data-reveal="side">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="offer-title">
            {copy.title} <em>{copy.accent}</em>
          </h2>
          <p>{copy.description}</p>
          <a className="button button-primary" href="#design-studio">
            {start}
            <Icon name="arrow" className="directional" />
          </a>
        </div>
        <div className="offer-artwork">
          <div className="offer-float" data-float="offer">
            <Image
              {...assets.offer.hoodie}
              alt={copy.image}
              sizes="(max-width: 767px) 65vw, 36vw"
            />
          </div>
          <HandwrittenNote
            asset={assets.offer.note}
            className="offer-note"
            sizes="(max-width: 767px) 110px, 170px"
          />
        </div>
      </div>
    </section>
  );
}
