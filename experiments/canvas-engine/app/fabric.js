import { Canvas, StaticCanvas, Rect, Textbox, FabricImage } from "fabric";
import { family } from "./fixtures";

function object(n, assets) {
  const props = {
    left: n.x,
    top: n.y,
    originX: "center",
    originY: "center",
    width: n.width,
    height: n.height,
    angle: n.angle,
    opacity: n.opacity,
    fill: n.fill,
    selectable: !n.locked,
    evented: !n.locked,
    objectCaching: false,
  };
  const result =
    n.kind === "text"
      ? new Textbox(n.text, {
          ...props,
          fontFamily: family,
          fontSize: n.fontSize,
          direction: n.direction,
          textAlign: "center",
        })
      : n.kind === "image"
        ? new FabricImage(assets.image, {
            ...props,
            width: assets.image.width,
            height: assets.image.height,
            scaleX: n.width / assets.image.width,
            scaleY: n.height / assets.image.height,
          })
        : new Rect(props);
  result.data = { id: n.id, kind: n.kind };
  return result;
}
export function mount(host, assets, commit) {
  const element = document.createElement("canvas");
  host.append(element);
  const canvas = new Canvas(element, { width: 600, height: 700, renderOnAddRemove: false });
  canvas.setZoom(2);
  canvas.on("object:modified", ({ target }) =>
    commit(target.data.id, {
      x: target.left,
      y: target.top,
      width: Math.abs(target.width * target.scaleX),
      height: Math.abs(target.height * target.scaleY),
      angle: target.angle,
    }),
  );
  return {
    render(nodes, selected) {
      // Reuse nodes during transforms; canonical data remains authoritative.
      const current = new Map(canvas.getObjects().map((o) => [o.data.id, o]));
      if (current.size !== nodes.length) {
        canvas.clear();
        for (const n of nodes) canvas.add(object(n, assets));
      } else
        for (const n of nodes) {
          const o = current.get(n.id);
          if (!o) continue;
          o.set({
            left: n.x,
            top: n.y,
            angle: n.angle,
            ...(n.kind === "text"
              ? { text: n.text, width: n.width, fontSize: n.fontSize, scaleX: 1, scaleY: 1 }
              : { scaleX: n.width / o.width, scaleY: n.height / o.height }),
          });
          o.setCoords();
        }
      const active = canvas.getObjects().find((o) => o.data.id === selected);
      if (active) canvas.setActiveObject(active);
      else canvas.discardActiveObject();
      canvas.renderAll();
    },
    rect(id) {
      const b = canvas
        .getObjects()
        .find((o) => o.data.id === id)
        .getBoundingRect();
      return { x: b.left * 2, y: b.top * 2, width: b.width * 2, height: b.height * 2 };
    },
    handles() {
      const o = canvas.getActiveObject();
      o.setCoords();
      return {
        resize: { x: o.oCoords.br.x, y: o.oCoords.br.y },
        rotate: { x: o.oCoords.mtr.x, y: o.oCoords.mtr.y },
      };
    },
    async destroy() {
      await canvas.dispose();
      host.replaceChildren();
    },
  };
}
export async function artwork(nodes, assets, scale) {
  const canvas = new StaticCanvas(document.createElement("canvas"), {
    width: Math.ceil(300 * scale),
    height: Math.ceil(350 * scale),
    renderOnAddRemove: false,
    enableRetinaScaling: false,
  });
  canvas.setZoom(scale);
  try {
    for (const n of nodes) canvas.add(object(n, assets));
    canvas.renderAll();
    return canvas.toCanvasElement(1);
  } finally {
    await canvas.dispose();
  }
}
