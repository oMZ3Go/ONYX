import Image from "next/image";
import { Icon } from "@/components/icon";
import type { Messages } from "@/i18n/messages";
import { assets } from "../assets";
import { HandwrittenNote } from "./handwritten-note";
export function BrandStory({ copy }: { copy: Messages["story"] }) {
  return (
    <section
      id="about"
      className="brand-story section-light"
      aria-labelledby="story-title"
      data-motion-section
    >
      <div className="story-artwork">
        <div className="story-background" data-parallax="background">
          <Image
            src={assets.story.background.src}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </div>
        <div className="story-model-position" data-parallax="model">
          <div className="story-model" data-float="story">
            <Image
              {...assets.story.model}
              alt={copy.image}
              sizes="(max-width: 767px) 100vw, 50vw"
            />
          </div>
        </div>
        <HandwrittenNote
          asset={assets.story.people}
          className="story-people-note"
          sizes="(max-width: 767px) 80px, 110px"
        />
      </div>
      <div className="story-copy">
        <div data-reveal="side">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="story-title">
            {copy.title} <em>{copy.accent}</em>
          </h2>
          <p className="story-description">{copy.description}</p>
          <p className="story-closing">{copy.closing}</p>
          <ul className="brand-values">
            <li>
              <Icon name="spark" />
              {copy.creativity}
            </li>
            <li>
              <Icon name="person" />
              {copy.identity}
            </li>
            <li>
              <Icon name="palette" />
              {copy.expression}
            </li>
          </ul>
        </div>
        <HandwrittenNote
          asset={assets.story.wear}
          className="story-wear-note"
          sizes="65px"
          delay={180}
        />
      </div>
    </section>
  );
}
