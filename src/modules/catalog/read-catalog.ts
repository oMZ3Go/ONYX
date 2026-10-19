import { fixtureCatalog } from "./fixture-provider";
import type { CatalogReader } from "./contracts";
/** Replace this adapter with published catalog reads, removing preview repetition before release. */
export const catalog: CatalogReader = fixtureCatalog;
