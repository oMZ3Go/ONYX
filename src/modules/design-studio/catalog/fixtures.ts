import type { StudioCatalog } from "../types";
import { referenceArtwork, referenceOriginal, workspaceAssets } from "./assets";

export const fixtureStudioCatalog: StudioCatalog = {
  revision: "studio-preview-1",
  products: [
    {
      id: "onyx-hoodie",
      name: { en: "ONYX hoodie", ar: "هودي ONYX" },
      type: "hoodie",
      active: true,
      variants: [
        {
          id: "hoodie-black",
          name: { en: "Black", ar: "أسود" },
          swatch: "#17191b",
          active: true,
          availability: "preview",
          mockups: { front: workspaceAssets.front, back: workspaceAssets.back },
          price: null,
          printSpecification: null,
        },
      ],
    },
  ],
  categories: [
    { id: "collection", name: { en: "ONYX artwork", ar: "رسومات ONYX" } },
    { id: "abstract", name: { en: "Abstract", ar: "مجردة" } },
    { id: "typography", name: { en: "Typography", ar: "خطوط" } },
  ],
  artworks: [
    {
      id: "crown",
      name: { en: "Crown", ar: "تاج" },
      categoryId: "collection",
      active: true,
      thumbnail: referenceArtwork("crown", 364, 368),
      source: referenceOriginal("crown", 364, 368),
      compatibility: { productIds: ["onyx-hoodie"], variantIds: null },
      rights: { status: "unverified", commercialUse: false, attribution: null },
    },
    {
      id: "dragon",
      name: { en: "Dragon", ar: "تنين" },
      categoryId: "collection",
      active: true,
      thumbnail: referenceArtwork("dragon", 480, 600),
      source: referenceOriginal("dragon", 1122, 1402),
      compatibility: { productIds: ["onyx-hoodie"], variantIds: null },
      rights: { status: "provisional", commercialUse: false, attribution: null },
    },
    {
      id: "nature",
      name: { en: "Nature", ar: "طبيعة" },
      categoryId: "collection",
      active: true,
      thumbnail: referenceArtwork("nature", 600, 513),
      source: referenceOriginal("nature", 1356, 1160),
      compatibility: { productIds: ["onyx-hoodie"], variantIds: null },
      rights: { status: "unverified", commercialUse: false, attribution: null },
    },
    {
      id: "space",
      name: { en: "Space", ar: "فضاء" },
      categoryId: "collection",
      active: true,
      thumbnail: referenceArtwork("space", 600, 453),
      source: referenceOriginal("space", 1443, 1090),
      compatibility: { productIds: ["onyx-hoodie"], variantIds: null },
      rights: { status: "unverified", commercialUse: false, attribution: null },
    },
  ],
};
