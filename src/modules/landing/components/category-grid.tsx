import Image from "next/image";
import type { Messages } from "@/i18n/messages";
import { assets, categoryKeys } from "../assets";
export function CategoryGrid({ copy }: { copy: Messages["categories"] }) {
  return (
    <section id="categories" className="categories" aria-labelledby="categories-title">
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
          {categoryKeys.map((key, index) => (
            <article
              key={key}
              className={`category-card category-${key}`}
              data-reveal="card"
              data-delay={index * 70}
            >
              <Image {...assets.categories[key]} alt="" sizes="(max-width: 767px) 46vw, 19vw" />
              <div className="category-copy">
                <h3>{copy[key].title}</h3>
                <p>{copy[key].description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
