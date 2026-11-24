import type { Side, StudioCatalog, ViewMode } from "../types";
import type { DesignObject, EditorProject, SideDocument, Transform } from "./document";
import { parseEditorProject } from "./validation";
import { catalogAsset } from "./catalog-assets";
import { apply, objectToDocument } from "./coordinates";

export const HISTORY_LIMIT = 100;
const HISTORY_BYTES = 8 * 1024 * 1024;
type Transforms = Readonly<Record<string, Transform>>;
type Entry = {
  side: Side;
  before: SideDocument;
  after: SideDocument;
  assetsBefore: EditorProject["assets"];
  assetsAfter: EditorProject["assets"];
  bytes: number;
};
export interface EditorState {
  project: EditorProject;
  activeSide: Side;
  view: ViewMode;
  clipGarment: boolean;
  selection: Record<Side, readonly string[]>;
  transient: Transforms;
  undoCount: number;
  redoCount: number;
}
export const angle = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;
export function bounds(transforms: readonly Transform[]) {
  const points = transforms.flatMap((t) =>
    [-0.5, 0.5].flatMap((x) => [-0.5, 0.5].map((y) => apply(objectToDocument(t), { x, y }))),
  );
  const left = Math.min(...points.map((p) => p.x)),
    right = Math.max(...points.map((p) => p.x));
  const top = Math.min(...points.map((p) => p.y)),
    bottom = Math.max(...points.map((p) => p.y));
  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}

/** Canonical commands only. No React, canvas nodes, image bytes, camera or persistence. */
export class EditorController {
  private state: EditorState;
  private listeners = new Set<() => void>();
  private past: Entry[] = [];
  private future: Entry[] = [];
  private gestureSequence = 0;
  private gesture: { id: number; side: Side; revision: number; before: Transforms } | null = null;
  constructor(
    project: EditorProject,
    private catalog: StudioCatalog,
    private now = () => new Date().toISOString(),
    private newId = () => crypto.randomUUID(),
  ) {
    this.state = {
      project: parseEditorProject(project),
      activeSide: "back",
      view: "back",
      clipGarment: true,
      selection: { front: [], back: [] },
      transient: {},
      undoCount: 0,
      redoCount: 0,
    };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(patch: Partial<EditorState>) {
    this.state = {
      ...this.state,
      ...patch,
      undoCount: this.past.length,
      redoCount: this.future.length,
    };
    this.listeners.forEach((listener) => listener());
  }
  select(side: Side, ids: readonly string[], additive = false) {
    this.cancel();
    const current = this.state.selection[side];
    const next = additive
      ? [...current.filter((id) => !ids.includes(id)), ...ids.filter((id) => !current.includes(id))]
      : [...ids];
    this.emit({
      activeSide: side,
      selection: {
        ...this.state.selection,
        [side]: [...new Set(next)].filter((id) => this.state.project.sides[side].objectsById[id]),
      },
    });
  }
  setView(view: ViewMode) {
    this.cancel();
    this.emit({ view, activeSide: view === "both" ? this.state.activeSide : view });
  }
  setSide(side: Side) {
    this.cancel();
    this.emit({ activeSide: side });
  }
  setClip(clipGarment: boolean) {
    this.emit({ clipGarment });
  }
  lockSelection() {
    const side = this.state.activeSide,
      doc = this.state.project.sides[side],
      ids = this.state.selection[side].filter((id) => doc.objectsById[id]?.visible);
    if (!ids.length) return;
    const locked = !ids.every((id) => doc.objectsById[id]?.locked);
    const objects = { ...doc.objectsById };
    for (const id of ids) if (objects[id]) objects[id] = { ...objects[id], locked };
    this.commit(side, { ...doc, objectsById: objects });
  }
  centerSelection(axis: "x" | "y") {
    const objects = this.editable();
    if (!objects.length) return;
    const side = this.state.activeSide,
      space = this.state.project.sides[side].space,
      b = bounds(objects.map((o) => o.transform));
    const dx = axis === "x" ? space.width / 2 - b.centerX : 0,
      dy = axis === "y" ? space.height / 2 - b.centerY : 0;
    this.transforms(
      side,
      Object.fromEntries(
        objects.map((o) => [
          o.id,
          { ...o.transform, centerX: o.transform.centerX + dx, centerY: o.transform.centerY + dy },
        ]),
      ),
    );
  }
  stepOrder(direction: "forward" | "backward") {
    const side = this.state.activeSide,
      doc = this.state.project.sides[side],
      ids = new Set(this.editable().map((o) => o.id)),
      order = [...doc.layerOrder];
    if (direction === "forward") {
      for (let i = order.length - 2; i >= 0; i--)
        if (ids.has(order[i]!) && !ids.has(order[i + 1]!))
          [order[i], order[i + 1]] = [order[i + 1]!, order[i]!];
    } else {
      for (let i = 1; i < order.length; i++)
        if (ids.has(order[i]!) && !ids.has(order[i - 1]!))
          [order[i], order[i - 1]] = [order[i - 1]!, order[i]!];
    }
    this.commit(side, { ...doc, layerOrder: order });
  }
  private editable(side = this.state.activeSide) {
    return this.state.selection[side]
      .map((id) => this.state.project.sides[side].objectsById[id]!)
      .filter((o) => o && !o.locked && o.visible);
  }
  private commit(side: Side, after: SideDocument, assets = this.state.project.assets) {
    this.cancel();
    const p = this.state.project,
      before = p.sides[side];
    if (JSON.stringify(before) === JSON.stringify(after) && assets === p.assets) return;
    const next = parseEditorProject({
      ...p,
      revision: p.revision + 1,
      updatedAt: this.now(),
      sides: { ...p.sides, [side]: after },
      assets,
    });
    const entry = {
      side,
      before,
      after: next.sides[side],
      assetsBefore: p.assets,
      assetsAfter: next.assets,
      bytes: 0,
    };
    entry.bytes = new TextEncoder().encode(JSON.stringify(entry)).byteLength;
    if (entry.bytes > HISTORY_BYTES) throw new Error("Command exceeds history limit");
    this.past.push(entry);
    while (
      this.past.length > HISTORY_LIMIT ||
      this.past.reduce((sum, e) => sum + e.bytes, 0) > HISTORY_BYTES
    )
      this.past.shift();
    this.future = [];
    this.emit({ project: next, selection: this.prune(next) });
  }
  private prune(project: EditorProject) {
    return {
      front: this.state.selection.front.filter((id) => project.sides.front.objectsById[id]),
      back: this.state.selection.back.filter((id) => project.sides.back.objectsById[id]),
    };
  }
  add(side: Side, artworkId: string) {
    const { artwork, asset } = catalogAsset(this.state.project, this.catalog, artworkId);
    const doc = this.state.project.sides[side],
      width = Math.min(
        doc.space.width * 0.15,
        (doc.space.height * 0.28 * artwork.source.width) / artwork.source.height,
      );
    const id = this.newId();
    const object: DesignObject = {
      id,
      kind: "artwork",
      name: artwork.name.en,
      artwork: { id: artwork.id, revision: this.catalog.revision },
      assetId: asset.id,
      rights: { ...artwork.rights },
      visible: true,
      locked: false,
      opacity: 1,
      transform: {
        centerX: doc.space.width / 2,
        centerY: doc.space.height * 0.43,
        width,
        height: (width * artwork.source.height) / artwork.source.width,
        rotationDeg: 0,
        flipX: false,
        flipY: false,
      },
    };
    this.commit(
      side,
      {
        ...doc,
        objectsById: { ...doc.objectsById, [id]: object },
        layerOrder: [...doc.layerOrder, id],
      },
      { ...this.state.project.assets, [asset.id]: asset },
    );
    this.select(side, [id]);
  }
  transforms(side: Side, transforms: Transforms) {
    const doc = this.state.project.sides[side],
      objects = { ...doc.objectsById };
    for (const [id, transform] of Object.entries(transforms)) {
      const object = objects[id];
      if (!object || object.locked || !object.visible)
        throw new Error("Object cannot be transformed");
      objects[id] = {
        ...object,
        transform: { ...transform, rotationDeg: angle(transform.rotationDeg) },
      };
    }
    this.commit(side, { ...doc, objectsById: objects });
  }
  begin() {
    this.cancel();
    const objects = this.editable();
    if (!objects.length) return false;
    this.gesture = {
      id: ++this.gestureSequence,
      side: this.state.activeSide,
      revision: this.state.project.revision,
      before: Object.fromEntries(objects.map((o) => [o.id, o.transform])),
    };
    return true;
  }
  getGesture() {
    return this.gesture;
  }
  preview(transforms: Transforms, gestureId = this.gesture?.id) {
    if (
      !this.gesture ||
      gestureId !== this.gesture.id ||
      this.gesture.revision !== this.state.project.revision
    )
      return;
    if (
      Object.keys(transforms).length !== Object.keys(this.gesture.before).length ||
      Object.keys(transforms).some((id) => !this.gesture!.before[id])
    )
      return;
    if (
      Object.values(transforms).some(
        (t) =>
          ![t.centerX, t.centerY, t.width, t.height, t.rotationDeg].every(Number.isFinite) ||
          t.width < 1 ||
          t.height < 1 ||
          Math.max(Math.abs(t.centerX), Math.abs(t.centerY), t.width, t.height) > 1e6,
      )
    )
      return;
    this.emit({ transient: transforms });
  }
  finish(gestureId = this.gesture?.id) {
    if (gestureId !== this.gesture?.id) return;
    const gesture = this.gesture,
      transforms = this.state.transient;
    this.gesture = null;
    this.emit({ transient: {} });
    if (
      gesture &&
      gesture.revision === this.state.project.revision &&
      Object.keys(transforms).length
    )
      this.transforms(gesture.side, transforms);
  }
  cancel = () => {
    if (!this.gesture && !Object.keys(this.state.transient).length) return;
    this.gesture = null;
    this.emit({ transient: {} });
  };
  numeric(field: "centerX" | "centerY" | "width" | "height" | "rotationDeg", value: number) {
    const object = this.editable()[0];
    if (
      !object ||
      this.state.selection[this.state.activeSide].length !== 1 ||
      !Number.isFinite(value)
    )
      return;
    const t = object.transform;
    if ((field === "width" || field === "height") && value < 1) return;
    this.transforms(this.state.activeSide, {
      [object.id]: {
        ...t,
        [field]: value,
        ...(field === "width"
          ? { height: (t.height * value) / t.width }
          : field === "height"
            ? { width: (t.width * value) / t.height }
            : {}),
      },
    });
  }
  duplicate() {
    const side = this.state.activeSide,
      doc = this.state.project.sides[side];
    const objects = { ...doc.objectsById },
      order = [...doc.layerOrder],
      ids: string[] = [];
    for (const o of this.editable()) {
      const id = this.newId();
      ids.push(id);
      objects[id] = {
        ...o,
        id,
        transform: {
          ...o.transform,
          centerX: o.transform.centerX + 20,
          centerY: o.transform.centerY + 20,
        },
      };
      order.push(id);
    }
    this.commit(side, { ...doc, objectsById: objects, layerOrder: order });
    if (ids.length) this.select(side, ids);
  }
  remove() {
    const side = this.state.activeSide,
      doc = this.state.project.sides[side],
      ids = this.editable().map((o) => o.id);
    this.commit(side, {
      ...doc,
      objectsById: Object.fromEntries(
        Object.entries(doc.objectsById).filter(([id]) => !ids.includes(id)),
      ),
      layerOrder: doc.layerOrder.filter((id) => !ids.includes(id)),
    });
  }
  flag(id: string, flag: "locked" | "visible") {
    const side = this.state.activeSide,
      doc = this.state.project.sides[side],
      o = doc.objectsById[id];
    if (!o || (flag === "visible" && o.locked)) return;
    this.commit(side, {
      ...doc,
      objectsById: { ...doc.objectsById, [id]: { ...o, [flag]: !o[flag] } },
    });
  }
  order(direction: "front" | "back") {
    const side = this.state.activeSide,
      doc = this.state.project.sides[side],
      ids = this.editable().map((o) => o.id),
      selected = doc.layerOrder.filter((id) => ids.includes(id)),
      rest = doc.layerOrder.filter((id) => !ids.includes(id));
    this.commit(side, {
      ...doc,
      layerOrder: direction === "front" ? [...rest, ...selected] : [...selected, ...rest],
    });
  }
  align(edge: "left" | "center" | "right" | "top" | "middle" | "bottom") {
    const objects = this.editable();
    if (!objects.length) return;
    const side = this.state.activeSide,
      space = this.state.project.sides[side].space;
    const target =
      objects.length > 1
        ? bounds(objects.map((o) => o.transform))
        : {
            left: 0,
            right: space.width,
            top: 0,
            bottom: space.height,
            centerX: space.width / 2,
            centerY: space.height / 2,
          };
    this.transforms(
      side,
      Object.fromEntries(
        objects.map((o) => {
          const b = bounds([o.transform]);
          const dx =
            edge === "left"
              ? target.left - b.left
              : edge === "right"
                ? target.right - b.right
                : edge === "center"
                  ? target.centerX - b.centerX
                  : 0;
          const dy =
            edge === "top"
              ? target.top - b.top
              : edge === "bottom"
                ? target.bottom - b.bottom
                : edge === "middle"
                  ? target.centerY - b.centerY
                  : 0;
          return [
            o.id,
            {
              ...o.transform,
              centerX: o.transform.centerX + dx,
              centerY: o.transform.centerY + dy,
            },
          ];
        }),
      ),
    );
  }
  history(direction: "undo" | "redo") {
    this.cancel();
    const from = direction === "undo" ? this.past : this.future,
      to = direction === "undo" ? this.future : this.past,
      entry = from.at(-1);
    if (!entry) return;
    const p = this.state.project,
      undo = direction === "undo";
    const project = parseEditorProject({
      ...p,
      revision: p.revision + 1,
      updatedAt: this.now(),
      sides: { ...p.sides, [entry.side]: undo ? entry.before : entry.after },
      assets: undo ? entry.assetsBefore : entry.assetsAfter,
    });
    from.pop();
    to.push(entry);
    this.emit({
      project,
      selection: this.prune(project),
      activeSide: entry.side,
      view: this.state.view === "both" ? "both" : entry.side,
    });
  }
}
