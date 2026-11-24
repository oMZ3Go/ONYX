import { createRoot } from "react-dom/client";
import en from "../../messages/en.json";
import { fixtureStudioCatalog as catalog } from "../../src/modules/design-studio/catalog/fixtures";
import { createProject } from "../../src/modules/design-studio/state";
import { EditorController } from "../../src/modules/design-studio/editor/controller";
import EditorSurface from "../../src/modules/design-studio/editor/editor-surface";
import { migrateProject } from "../../src/modules/design-studio/editor/migration";
import { parseEditorProject } from "../../src/modules/design-studio/editor/validation";

const seed = document.getElementById("seed")!.textContent;
const controller = new EditorController(
  seed
    ? parseEditorProject(JSON.parse(seed))
    : migrateProject(createProject(catalog.revision, "onyx-hoodie", "hoodie-black"), catalog, {
        id: "reconstruction",
        now: new Date().toISOString(),
      }),
  catalog,
);
if (!seed) {
  controller.add("back", "crown");
  controller.numeric("width", 162.5);
  controller.numeric("rotationDeg", 17);
}
const state = controller.getSnapshot();
document.getElementById("result")!.textContent = JSON.stringify(state.project);
createRoot(document.getElementById("root")!).render(
  <EditorSurface
    editor={{ controller, catalog, state }}
    side="back"
    interactive
    zoom={100}
    maskSrc={catalog.products[0]!.variants[0]!.mockups.back!.originalSrc}
    copy={en.designStudio}
    locale="en"
  />,
);
