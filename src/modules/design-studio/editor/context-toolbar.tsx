import { StudioIcon } from "../components/studio-icon";
import type { LocalizedStudioProps } from "../types";
import type { Editor } from "./use-editor";
import { bounds } from "./controller";
import { apply, documentToClient, type SurfaceGeometry } from "./coordinates";
import { toolbarPosition } from "./render-quality";

export function ContextToolbar({
  editor,
  geometry,
  copy,
}: LocalizedStudioProps & { editor: Editor; geometry: SurfaceGeometry }) {
  const { state, controller } = editor,
    side = state.activeSide,
    doc = state.project.sides[side];
  const selected = state.selection[side]
    .map((id) => doc.objectsById[id]!)
    .filter((o) => o?.visible);
  if (!selected.length) return null;
  const b = bounds(selected.map((o) => state.transient[o.id] ?? o.transform)),
    mapping = documentToClient(geometry);
  const a = apply(mapping, { x: b.left, y: b.top }),
    z = apply(mapping, { x: b.right, y: b.bottom });
  const position = toolbarPosition(
    { left: a.x, top: a.y, right: z.x, bottom: z.y },
    geometry.viewport,
    geometry.camera.zoom,
  );
  const editable = selected.every((o) => !o.locked),
    locked = selected.every((o) => o.locked),
    ids = new Set(selected.map((o) => o.id));
  const canForward = doc.layerOrder.some(
    (id, index) =>
      ids.has(id) && index < doc.layerOrder.length - 1 && !ids.has(doc.layerOrder[index + 1]!),
  );
  const canBackward = doc.layerOrder.some(
    (id, index) => ids.has(id) && index > 0 && !ids.has(doc.layerOrder[index - 1]!),
  );
  const actions = [
    {
      name: copy.editor.center,
      icon: "centerX",
      run: () => controller.centerSelection("x"),
      disabled: !editable,
    },
    {
      name: copy.editor.middle,
      icon: "centerY",
      run: () => controller.centerSelection("y"),
      disabled: !editable,
    },
    {
      name: copy.editor.forward,
      icon: "forward",
      run: () => controller.stepOrder("forward"),
      disabled: !editable || !canForward,
    },
    {
      name: copy.editor.backward,
      icon: "backward",
      run: () => controller.stepOrder("backward"),
      disabled: !editable || !canBackward,
    },
    {
      name: copy.editor.duplicate,
      icon: "duplicate",
      run: () => controller.duplicate(),
      disabled: !editable,
    },
    {
      name: locked ? copy.editor.unlock : copy.editor.lock,
      icon: locked ? "unlock" : "lock",
      run: () => controller.lockSelection(),
      disabled: false,
    },
    {
      name: copy.editor.delete,
      icon: "delete",
      run: () => controller.remove(),
      disabled: !editable,
    },
  ] as const;
  return (
    <div
      className="ds-context-toolbar"
      data-editor-toolbar
      role="toolbar"
      aria-label={copy.editor.contextActions}
      dir="ltr"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        minHeight: position.height,
      }}
    >
      {actions.map((action) => (
        <button
          type="button"
          key={action.icon === "unlock" ? "lock" : action.icon}
          aria-label={action.name}
          title={action.name}
          disabled={action.disabled}
          aria-pressed={action.icon === "lock" || action.icon === "unlock" ? locked : undefined}
          style={{ width: position.target, height: position.target }}
          onClick={(event) => {
            if (action.icon === "delete")
              event.currentTarget
                .closest<HTMLElement>(".ds-viewport")
                ?.focus({ preventScroll: true });
            action.run();
          }}
        >
          <StudioIcon name={action.icon} />
        </button>
      ))}
    </div>
  );
}
