import type { CatalogReader, ProductDisplay } from "./contracts";
import { assets } from "@/modules/landing/assets";
export const sampleProduct: ProductDisplay = {
  id: "preview-drip-logo",
  title: { ar: "Drip Logo", en: "Drip Logo" },
  image: {
    ...assets.product,
    alt: {
      ar: "هودي كحلي يحمل تصميم Drip Logo بشعار ONYX بالأزرق الفاتح",
      en: "Navy Drip Logo hoodie with a light blue ONYX graphic",
    },
  },
};
export const fixtureCatalog: CatalogReader = {
  async getFeatured() {
    return {
      preview: true,
      slots: Array.from({ length: 4 }, (_, index) => ({
        key: `preview-slot-${index + 1}`,
        product: sampleProduct,
      })),
    };
  },
};
