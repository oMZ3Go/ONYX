"use client";
import { useEffect, useRef, useState } from "react";
import { fixture, resources, strings, family } from "./fixtures";
const loaders = {
  konva: () => import("./konva"),
  fabric: () => import("./fabric"),
  svg: () => import("./svg"),
};
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
export default function Harness() {
  const host = useRef(null);
  const api = useRef(null);
  const [text, setText] = useState(strings[0]);
  useEffect(() => {
    let disposed = false,
      adapter;
    const run = async () => {
      const kind = new URLSearchParams(location.search).get("engine") || "konva";
      const [engine, assets] = await Promise.all([loaders[kind](), resources()]);
      if (disposed) return;
      let nodes = fixture(),
        commits = 0,
        selected = null;
      const commit = (id, patch) => {
        nodes = nodes.map((n) => (n.id === id && !n.locked ? { ...n, ...patch } : n));
        commits++;
        adapter.render(nodes, selected);
      };
      adapter = engine.mount(host.current, assets, commit);
      adapter.render(nodes, selected);
      api.current = window.spike = {
        kind,
        get nodes() {
          return nodes;
        },
        get commits() {
          return commits;
        },
        select(id) {
          selected = id;
          adapter.render(nodes, selected);
        },
        reset(count = 10) {
          nodes = fixture(count);
          selected = null;
          commits = 0;
          adapter.render(nodes, selected);
        },
        rect(id) {
          return adapter.rect(id);
        },
        handles() {
          return adapter.handles();
        },
        patch(id, patch) {
          commit(id, patch);
        },
        text(value) {
          nodes = nodes.map((n, i) => (i === 0 ? { ...n, text: value } : n));
          adapter.render(nodes, selected);
        },
        async benchmark(count, milliseconds = 1000) {
          this.reset(count);
          const samples = [];
          const start = performance.now();
          while (performance.now() - start < milliseconds) {
            const t = performance.now();
            nodes = nodes.map((n, i) => (i === 7 ? { ...n, x: 150 + Math.sin(t / 100) * 50 } : n));
            adapter.render(nodes, selected);
            await frame();
            samples.push(performance.now() - t);
          }
          return samples;
        },
        async export(scale = 300 / 25.4) {
          const t = performance.now();
          const c = await engine.artwork(nodes, assets, scale);
          const renderMs = performance.now() - t;
          const blob = await new Promise((resolve) => c.toBlob(resolve));
          const encodeMs = performance.now() - t - renderMs;
          const data = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
          const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          const result = {
            width: c.width,
            height: c.height,
            renderMs,
            encodeMs,
            bytes: blob.size,
            cornerAlpha: [data[3], data[(c.width - 1) * 4 + 3], data[data.length - 1]],
            digest,
            png: c.toDataURL(),
          };
          c.width = 0;
          c.height = 0;
          return result;
        },
        async remount() {
          await adapter.destroy();
          adapter = engine.mount(host.current, assets, commit);
          adapter.render(nodes, selected);
          return {
            canvases: host.current.querySelectorAll("canvas").length,
            svg: host.current.querySelectorAll("svg").length,
          };
        },
      };
    };
    run().catch((e) => {
      window.spikeError = String(e.stack);
    });
    return () => {
      disposed = true;
      delete window.spike;
      if (adapter) void adapter.destroy();
    };
  }, []);
  return (
    <main style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h1>ONYX isolated engine experiment — synthetic geometry</h1>
      <nav>
        {["konva", "fabric", "svg"].map((e) => (
          <a key={e} href={`/?engine=${e}`} style={{ marginRight: 20 }}>
            {e}
          </a>
        ))}
      </nav>
      <label>
        Arabic text{" "}
        <textarea
          aria-label="Arabic text"
          dir="rtl"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            api.current?.text(e.target.value);
          }}
        />
      </label>
      <label>
        X{" "}
        <input
          aria-label="X"
          type="number"
          defaultValue={fixture()[7].x}
          onChange={(e) => api.current?.patch("object-7", { x: e.target.valueAsNumber })}
        />
      </label>
      <button onClick={() => api.current?.select("object-7")}>Select object 7</button>
      <div style={{ display: "flex", gap: 20 }}>
        <div
          id="surface"
          ref={host}
          style={{
            width: 600,
            height: 700,
            flexShrink: 0,
            background: "#eee",
            touchAction: "none",
          }}
        />
        <section aria-label="Native text reference" style={{ fontFamily: family, fontSize: 26 }}>
          {strings.map((s, i) => (
            <p key={i} dir={i === 3 || i === 4 ? "ltr" : "rtl"} style={{ whiteSpace: "pre-wrap" }}>
              {s}
            </p>
          ))}
        </section>
      </div>
      <output aria-live="polite">Synthetic test surface; not production artwork</output>
    </main>
  );
}
