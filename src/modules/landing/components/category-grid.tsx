import Image from "next/image";
import type { Messages } from "@/i18n/messages";
import type { LandingCategory } from "../categories";
import { Icon } from "@/components/icon";
import type { Locale } from "@/i18n/config";
import { BrushArtwork } from "@/components/brush-artwork";
type CategoryHeading = Pick<
  Messages["categories"],
  "eyebrow" | "title" | "accent" | "description" | "soon"
>;

function imageSizes(wideOnTablet: boolean) {
  const tablet = wideOnTablet
    ? "(max-width: 767px) calc(100vw - 44px), (max-width: 899px) calc(100vw - 64px), (max-width: 1099px) calc(100vw - 96px)"
    : "(max-width: 767px) calc(50vw - 30px), (max-width: 899px) calc(50vw - 40px), (max-width: 1099px) calc(50vw - 56px)";
  return `(max-width: 359px) calc(100vw - 32px), (max-width: 599px) calc(100vw - 44px), ${tablet}, (max-width: 1352px) calc(20vw - 32px), 239px`;
}

export function CategoryGrid({
  copy,
  locale,
  categories,
}: {
  copy: CategoryHeading;
  locale: Locale;
  categories: readonly LandingCategory[];
}) {
  // Unpublished entries must not remain as hidden children: CSS counts rendered cards.
  const visible = categories.filter((category) => category.published);
  return (
    <section id="categories" className="categories" aria-labelledby="categories-title">
      <div className="category-atmosphere" aria-hidden="true">
        <BrushArtwork id="category-brush" reverse />
      </div>
      <div className="category-orbits" aria-hidden="true">
        {[0, 120, 240].map((phase, index) => (
          <span
            key={phase}
            className="category-orbit"
            data-ambient="orbit"
            data-phase={phase}
            data-period={22000 + index * 6000}
          >
            <i />
          </span>
        ))}
      </div>
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 id="categories-title">
              {copy.title} <em>{copy.accent}</em>
            </h2>
          </div>
          <p>{copy.description}</p>
        </div>
        <div className="category-grid">
          {visible.map((category, index) => (
            <article
              key={category.id}
              className="category-card"
              data-category-id={category.id}
              data-reveal="category"
              data-delay={index * 70}
            >
              <a
                className="category-link"
                href={`/${locale}/categories/${encodeURIComponent(category.slug)}`}
                aria-label={`${category.title} — ${copy.soon}`}
              >
                <Image
                  draggable={false}
                  {...category.image}
                  alt=""
                  sizes={imageSizes(visible.length % 2 === 1 && index === visible.length - 1)}
                />
                <div className="category-content">
                  <div className="category-copy">
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                  </div>
                  <span className="category-arrow">
                    <Icon name="arrow" className="directional" />
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
