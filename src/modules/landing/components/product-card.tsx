import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { formatPrice, type ProductDisplay } from "@/modules/catalog/contracts";
import { Icon } from "@/components/icon";
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
      <div className="product-image">
        {product.image ? (
          <Image
            {...product.image}
            alt={product.image.alt[locale]}
            sizes="(max-width: 599px) 45vw, (max-width: 899px) 42vw, 22vw"
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
        {product.price && <p className="product-price">{formatPrice(product.price, locale)}</p>}
        {availability && <p>{labels[availability]}</p>}
        {product.colors?.length ? (
          <ul className="product-colors" aria-label={labels.colors}>
            {product.colors.map((color) => (
              <li key={color.id}>
                <span style={{ backgroundColor: color.hex }} />
                <span className="sr-only">{color.label[locale]}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <a
          className="button button-ink"
          href="#design-studio"
          aria-label={`${labels.customize} — ${product.title[locale]}`}
        >
          {labels.customize}
          <Icon name="arrow" className="directional" />
        </a>
      </div>
    </article>
  );
}
