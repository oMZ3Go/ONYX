import { family } from "./fixtures";
const ns = "http://www.w3.org/2000/svg";
function element(name, props) {
  const e = document.createElementNS(ns, name);
  for (const [k, v] of Object.entries(props)) e.setAttribute(k, String(v));
  return e;
}
function tree(nodes, assets) {
  const svg = element("svg", { xmlns: ns, width: 600, height: 700, viewBox: "0 0 300 350" });
  const style = element("style", {});
  style.textContent = assets.fontCss;
  svg.append(style);
  for (const n of nodes) {
    const g = element("g", {
      "data-id": n.id,
      transform: `translate(${n.x} ${n.y}) rotate(${n.angle})`,
      opacity: n.opacity,
    });
    if (n.kind === "text") {
      const lines = n.text.split("\n");
      lines.forEach((line, i) => {
        const t = element("text", {
          x: 0,
          y: (i - (lines.length - 1) / 2) * n.fontSize * 1.16,
          "dominant-baseline": "central",
          "text-anchor": "middle",
          "font-family": family,
          "font-size": n.fontSize,
          direction: n.direction,
          fill: n.fill,
        });
        t.textContent = line;
        g.append(t);
      });
    } else
      g.append(
        element(n.kind === "image" ? "image" : "rect", {
          x: -n.width / 2,
          y: -n.height / 2,
          width: n.width,
          height: n.height,
          fill: n.fill,
          ...(n.kind === "image" ? { href: assets.image.src } : {}),
        }),
      );
    svg.append(g);
  }
  return svg;
}
export function mount(host, assets, commit) {
  let svg, nodes, selected, gesture;
  function render(next, id) {
    nodes = next;
    selected = id;
    svg = tree(nodes, assets);
    const n = nodes.find((n) => n.id === selected);
    if (n) {
      const g = element("g", {
        transform: `translate(${n.x} ${n.y}) rotate(${n.angle})`,
        "data-controls": "",
      });
      g.append(
        element("rect", {
          x: -n.width / 2,
          y: -n.height / 2,
          width: n.width,
          height: n.height,
          fill: "none",
          stroke: "#00aaff",
          "stroke-width": 0.5,
        }),
      );
      for (const [type, x, y] of [
        ["resize", n.width / 2, n.height / 2],
        ["rotate", 0, -n.height / 2 - 20],
      ])
        g.append(
          element("circle", {
            "data-handle": type,
            cx: x,
            cy: y,
            r: 3,
            fill: "white",
            stroke: "#00aaff",
          }),
        );
      svg.append(g);
    }
    host.replaceChildren(svg);
  }
  const point = (e) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return p;
  };
  const down = (e) => {
    const id = e.target.closest("[data-id]")?.getAttribute("data-id") ?? selected;
    const n = nodes.find((n) => n.id === id);
    if (!n || n.locked) return;
    gesture = { n, start: point(e), mode: e.target.getAttribute("data-handle") || "drag" };
    host.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const move = (e) => {
    if (!gesture) return;
    const p = point(e),
      { n, start, mode } = gesture;
    const patch =
      mode === "drag"
        ? { x: n.x + p.x - start.x, y: n.y + p.y - start.y }
        : mode === "resize"
          ? {
              width: Math.max(1, n.width + p.x - start.x),
              height: Math.max(1, n.height + p.y - start.y),
            }
          : { angle: (Math.atan2(p.y - n.y, p.x - n.x) * 180) / Math.PI + 90 };
    gesture.patch = patch;
    render(
      nodes.map((o) => (o.id === n.id ? { ...o, ...patch } : o)),
      selected,
    );
  };
  const up = () => {
    if (gesture?.patch) commit(gesture.n.id, gesture.patch);
    gesture = null;
  };
  const cancel = () => {
    if (gesture)
      render(
        nodes.map((o) => (o.id === gesture.n.id ? gesture.n : o)),
        selected,
      );
    gesture = null;
  };
  host.style.touchAction = "none";
  for (const [name, fn] of Object.entries({
    pointerdown: down,
    pointermove: move,
    pointerup: up,
    pointercancel: cancel,
  }))
    host.addEventListener(name, fn);
  return {
    render,
    handles() {
      return Object.fromEntries(
        ["resize", "rotate"].map((type) => {
          const b = svg.querySelector(`[data-handle="${type}"]`).getBoundingClientRect(),
            h = host.getBoundingClientRect();
          return [type, { x: b.x + b.width / 2 - h.x, y: b.y + b.height / 2 - h.y }];
        }),
      );
    },
    rect(id) {
      const b = svg.querySelector(`[data-id="${id}"]`).getBoundingClientRect(),
        h = host.getBoundingClientRect();
      return { x: b.x - h.x, y: b.y - h.y, width: b.width, height: b.height };
    },
    destroy() {
      for (const [name, fn] of Object.entries({
        pointerdown: down,
        pointermove: move,
        pointerup: up,
        pointercancel: cancel,
      }))
        host.removeEventListener(name, fn);
      host.replaceChildren();
    },
  };
}
export async function artwork(nodes, assets, scale) {
  const source = document.createElement("canvas");
  source.width = assets.image.width;
  source.height = assets.image.height;
  source.getContext("2d").drawImage(assets.image, 0, 0);
  const svg = tree(nodes, { ...assets, image: { src: source.toDataURL() } });
  svg.setAttribute("width", Math.ceil(300 * scale));
  svg.setAttribute("height", Math.ceil(350 * scale));
  svg.setAttribute(
    "viewBox",
    `0 0 ${Math.ceil(300 * scale) / scale} ${Math.ceil(350 * scale) / scale}`,
  );
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const c = document.createElement("canvas");
    c.width = Math.ceil(300 * scale);
    c.height = Math.ceil(350 * scale);
    c.getContext("2d").drawImage(image, 0, 0);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}
