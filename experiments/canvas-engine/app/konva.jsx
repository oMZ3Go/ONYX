import React, { useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Stage, Layer, Rect, Text, Image, Transformer } from "react-konva";
import Konva from "konva";
import { family } from "./fixtures";

function Scene({ nodes, selected, image, commit, stageRef }) {
  const transformer = useRef(null);
  useLayoutEffect(() => {
    transformer.current.nodes(
      selected ? [stageRef.current.findOne(`#${selected}`)].filter(Boolean) : [],
    );
  }, [nodes, selected, stageRef]);
  function changed(node) {
    commit(node.id(), {
      x: node.x(),
      y: node.y(),
      width: Math.abs(node.width() * node.scaleX()),
      height: Math.abs(node.height() * node.scaleY()),
      angle: node.rotation(),
    });
    node.scale({ x: 1, y: 1 });
  }
  return (
    <Stage ref={stageRef} width={600} height={700} scaleX={2} scaleY={2}>
      <Layer>
        {nodes.map((n) => {
          const props = {
            id: n.id,
            x: n.x,
            y: n.y,
            width: n.width,
            height: n.height,
            offsetX: n.width / 2,
            offsetY: n.height / 2,
            rotation: n.angle,
            opacity: n.opacity,
            draggable: !n.locked,
            onDragEnd: (e) => changed(e.target),
            onTransformEnd: (e) => changed(e.target),
            _useStrictMode: true,
          };
          return n.kind === "text" ? (
            <Text
              key={n.id}
              {...props}
              text={n.text}
              fontFamily={family}
              fontSize={n.fontSize}
              direction={n.direction}
              align="center"
              verticalAlign="middle"
              fill={n.fill}
            />
          ) : n.kind === "image" ? (
            <Image key={n.id} {...props} image={image} />
          ) : (
            <Rect key={n.id} {...props} fill={n.fill} />
          );
        })}
        <Transformer ref={transformer} flipEnabled={false} keepRatio />
      </Layer>
    </Stage>
  );
}
export function mount(host, assets, commit) {
  const root = createRoot(host);
  const stageRef = { current: null };
  return {
    render(nodes, selected) {
      flushSync(() =>
        root.render(
          <React.StrictMode>
            <Scene
              nodes={nodes}
              selected={selected}
              image={assets.image}
              commit={commit}
              stageRef={stageRef}
            />
          </React.StrictMode>,
        ),
      );
      stageRef.current.draw();
    },
    rect(id) {
      return stageRef.current.findOne(`#${id}`).getClientRect();
    },
    handles() {
      const stage = stageRef.current;
      return {
        resize: stage.findOne(".bottom-right").getAbsolutePosition(),
        rotate: stage.findOne(".rotater").getAbsolutePosition(),
      };
    },
    destroy() {
      flushSync(() => root.unmount());
    },
  };
}
export async function artwork(nodes, assets, scale) {
  const host = document.createElement("div");
  const stage = new Konva.Stage({
    container: host,
    width: Math.ceil(300 * scale),
    height: Math.ceil(350 * scale),
  });
  const layer = new Konva.Layer({ scaleX: scale, scaleY: scale });
  stage.add(layer);
  try {
    for (const n of nodes) {
      const props = {
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
        offsetX: n.width / 2,
        offsetY: n.height / 2,
        rotation: n.angle,
        opacity: n.opacity,
        fill: n.fill,
      };
      layer.add(
        n.kind === "text"
          ? new Konva.Text({
              ...props,
              text: n.text,
              fontFamily: family,
              fontSize: n.fontSize,
              direction: n.direction,
              align: "center",
              verticalAlign: "middle",
            })
          : n.kind === "image"
            ? new Konva.Image({ ...props, image: assets.image })
            : new Konva.Rect(props),
      );
    }
    layer.draw();
    return stage.toCanvas({ pixelRatio: 1 });
  } finally {
    stage.destroy();
  }
}
