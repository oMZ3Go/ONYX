import type { StudioCatalogReader } from "../types";
import { fixtureStudioCatalog } from "./fixtures";

// Replace this read adapter when an admin-managed catalog exists; components need no fixtures.
export const studioCatalog: StudioCatalogReader = {
  async getCatalog() {
    return fixtureStudioCatalog;
  },
};
