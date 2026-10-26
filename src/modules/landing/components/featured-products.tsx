import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import type { FeaturedCatalog } from "@/modules/catalog/contracts";
import { ProductCard } from "./product-card";
import { BrushArtwork } from "@/components/brush-artwork";
export function FeaturedProducts({
  locale,
  messages: m,
  catalog,
}: {
  locale: Locale;
  messages: Messages;
  catalog: FeaturedCatalog;
}) {
  return (
    <section id="collection" className="featured section-light" aria-labelledby="featured-title">
      <div className="paper-atmosphere" aria-hidden="true">
        <span className="atmosphere-light" data-ambient="paper" />
        <BrushArtwork id="featured-brush" />
      </div>
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">{m.featured.eyebrow}</p>
            <h2 id="featured-title">
              {m.featured.title} <em>{m.featured.accent}</em>
            </h2>
          </div>
          <p>{m.featured.description}</p>
        </div>
        <div className="product-grid">
          {catalog.slots.map((slot, index) => (
            <div key={slot.key} data-reveal="card" data-delay={index * 85}>
              <ProductCard product={slot.product} locale={locale} labels={m.common} />
            </div>
          ))}
        </div>
        {catalog.preview && <p className="preview-notice">{m.featured.preview}</p>}
      </div>
    </section>
  );
}
