import { useState } from "react";
import type { LocalizedStudioProps } from "../types";
import type { Editor } from "./use-editor";

export function SideTarget({
  editor,
  copy,
  label,
}: { editor: Editor; label: string } & LocalizedStudioProps) {
  return (
    <fieldset className="ds-editor-side">
      <legend>{label}</legend>
      {(["front", "back"] as const).map((side) => (
        <button
          type="button"
          key={side}
          aria-label={`${copy.workspace[side]} · ${label}`}
          aria-pressed={editor.state.activeSide === side}
          onClick={() => {
            if (editor.state.view === "both") editor.controller.setSide(side);
            else editor.controller.setView(side);
          }}
        >
          {copy.workspace[side]}
        </button>
      ))}
    </fieldset>
  );
}
function Numeric({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  const displayValue = String(Number(value.toFixed(3)));
  const [draft, setDraft] = useState(displayValue);
  return (
    <label>
      {label}
      <input
        type="number"
        dir="ltr"
        step="any"
        disabled={disabled}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const n = Number(draft);
          if (draft !== displayValue && draft.trim() && Number.isFinite(n)) onCommit(n);
          setDraft(displayValue);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(String(Number(value.toFixed(3))));
            event.stopPropagation();
          }
        }}
      />
    </label>
  );
}
export function TransformControls({ editor, copy }: { editor: Editor } & LocalizedStudioProps) {
  const { state, controller } = editor,
    doc = state.project.sides[state.activeSide],
    selected = state.selection[state.activeSide].map((id) => doc.objectsById[id]!).filter(Boolean);
  const object = selected.length === 1 ? selected[0] : undefined;
  const editable = selected.some((o) => !o.locked && o.visible);
  const [error, setError] = useState(false);
  const run = (fn: () => void) => {
    try {
      fn();
      setError(false);
    } catch {
      setError(true);
    }
  };
  return (
    <section className="ds-transform-controls" aria-label={copy.editor.transform}>
      <p role="status">
        {selected.length
          ? `${copy.editor.selected}: ${selected.length} · ${copy.workspace[state.activeSide]}`
          : copy.properties.noSelection}
      </p>
      {object && (
        <div className="ds-numeric-grid">
          {(["centerX", "centerY", "width", "height", "rotationDeg"] as const).map((field) => (
            <Numeric
              key={`${object.id}-${field}-${object.transform[field]}`}
              label={copy.editor[field]}
              value={object.transform[field]}
              disabled={!editable}
              onCommit={(n) => run(() => controller.numeric(field, n))}
            />
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <>
          <p className="ds-subtle">{copy.editor.units}</p>
          <div className="ds-editor-actions">
            <button
              type="button"
              disabled={!editable}
              onClick={() => run(() => controller.duplicate())}
            >
              {copy.editor.duplicate}
            </button>
            <button
              type="button"
              disabled={!editable}
              onClick={() => run(() => controller.remove())}
            >
              {copy.editor.delete}
            </button>
            <button
              type="button"
              disabled={!editable}
              onClick={() => run(() => controller.order("front"))}
            >
              {copy.editor.bringFront}
            </button>
            <button
              type="button"
              disabled={!editable}
              onClick={() => run(() => controller.order("back"))}
            >
              {copy.editor.sendBack}
            </button>
          </div>
          <fieldset className="ds-editor-actions">
            <legend>{copy.editor.align}</legend>
            {(["left", "center", "right", "top", "middle", "bottom"] as const).map((edge) => (
              <button
                key={edge}
                type="button"
                disabled={!editable}
                onClick={() => run(() => controller.align(edge))}
              >
                {copy.editor[edge]}
              </button>
            ))}
          </fieldset>
        </>
      )}
      {error && <p role="alert">{copy.editor.invalid}</p>}
    </section>
  );
}
export function LayerControls({ editor, copy, locale }: { editor: Editor } & LocalizedStudioProps) {
  const { state, controller } = editor,
    side = state.activeSide,
    doc = state.project.sides[side];
  return (
    <div className="ds-editor-layers" aria-label={`${copy.layers.title}: ${copy.workspace[side]}`}>
      <SideTarget editor={editor} copy={copy} locale={locale} label={copy.editor.layerSide} />
      {[...doc.layerOrder].reverse().map((id) => {
        const o = doc.objectsById[id]!;
        const name =
          o.kind === "artwork"
            ? (editor.catalog.artworks.find((a) => a.id === o.artwork.id)?.name[locale] ?? o.name)
            : o.name;
        return (
          <div
            className="ds-editor-layer"
            key={id}
            data-layer-id={id}
            data-locked={o.locked}
            data-visible={o.visible}
          >
            <label>
              <input
                type="checkbox"
                checked={state.selection[side].includes(id)}
                onChange={() => controller.select(side, [id], true)}
                aria-label={`${copy.editor.select}: ${name}`}
              />
              <span>{name}</span>
            </label>
            <button
              type="button"
              aria-label={`${copy.editor.lock}: ${name}`}
              aria-pressed={o.locked}
              onClick={() => controller.flag(id, "locked")}
            >
              {o.locked ? copy.editor.unlock : copy.editor.lock}
            </button>
            <button
              type="button"
              disabled={o.locked}
              aria-label={`${copy.editor.visibility}: ${name}`}
              aria-pressed={o.visible}
              onClick={() => controller.flag(id, "visible")}
            >
              {o.visible ? copy.editor.hide : copy.editor.show}
            </button>
          </div>
        );
      })}
      <p className="ds-subtle">{copy.editor.multiHint}</p>
    </div>
  );
}
