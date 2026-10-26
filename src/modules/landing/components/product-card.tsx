import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { formatPrice, type ProductDisplay } from "@/modules/catalog/contracts";
import { Icon } from "@/components/icon";
import { PerimeterLight } from "@/components/perimeter-light";
export function ProductCard({
  product,
  locale,
  labels,
}: {
  product: ProductDisplay;
  locale: Locale;
  labels: Messages["common"];
}) {
  const availability = product.variants?.length
    ? product.variants.some((v) => v.availability === "available")
      ? "available"
      : "unavailable"
    : undefined;
  return (
    <article className="product-card" data-product-id={product.id}>
      <PerimeterLight product />
      <div className="product-surface">
        <div className="product-image">
          <span className="product-ambient" data-ambient="product-surface" aria-hidden="true" />
          <span className="product-badge">
            <Icon name="grid" />
            <bdi>{product.category?.title[locale] ?? labels.preview}</bdi>
          </span>
          {product.image ? (
            <Image
              draggable={false}
              {...product.image}
              alt={product.image.alt[locale]}
              sizes="(max-width: 479px) 90vw, (max-width: 1099px) 45vw, 22vw"
            />
          ) : (
            <p>{labels.imageMissing}</p>
          )}
        </div>
        <div className="product-details">
          <h3>
            <bdi>{product.title[locale]}</bdi>
          </h3>
          {product.description && <p>{product.description[locale]}</p>}
          {availability && <p>{labels[availability]}</p>}
          <dl className="product-metadata">
            <div>
              <dt>{labels.colors}</dt>
              <dd>
                {product.colors?.length ? (
                  <ul className="product-colors" aria-label={labels.colors}>
                    {product.colors.map((color) => (
                      <li key={color.id} title={color.label[locale]}>
                        <span style={{ backgroundColor: color.hex }} />
                        <span className="sr-only">{color.label[locale]}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="product-pending">{labels.colorsSoon}</span>
                )}
              </dd>
            </div>
            <div>
              <dt>{labels.sizes}</dt>
              <dd>
                {product.sizes?.length ? (
                  <ul className="product-sizes" aria-label={labels.sizes}>
                    {product.sizes.map((size) => (
                      <li key={size.id}>
                        <bdi>{size.label[locale]}</bdi>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="product-pending">{labels.sizesSoon}</span>
                )}
              </dd>
            </div>
          </dl>
          <p className={`product-price ${product.price ? "" : "product-pending"}`}>
            {product.price ? <bdi>{formatPrice(product.price, locale)}</bdi> : labels.priceSoon}
          </p>
          <a
            className="button button-ink"
            href="#design-studio"
            aria-label={`${labels.customize} — ${product.title[locale]}`}
          >
            {labels.customize}
            <Icon name="arrow" className="directional" />
          </a>
        </div>
      </div>
    </article>
  );
}
