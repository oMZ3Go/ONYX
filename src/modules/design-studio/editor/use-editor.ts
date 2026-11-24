"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { StudioCatalog } from "../types";
import { createProject } from "../state";
import { migrateProject } from "./migration";
import { EditorController } from "./controller";

// Browser memory only: survives locale navigation; reload intentionally starts a new project.
let session: EditorController | undefined;
export function useEditor(catalog: StudioCatalog, productId: string, variantId: string) {
  const [controller] = useState(() => {
    if (
      typeof window !== "undefined" &&
      session?.getSnapshot().project.catalogRevision === catalog.revision &&
      session.getSnapshot().project.garment.productId === productId
    )
      return session;
    const created = new EditorController(
      migrateProject(createProject(catalog.revision, productId, variantId), catalog, {
        id: "studio-session",
        now: new Date().toISOString(),
      }),
      catalog,
    );
    if (typeof window !== "undefined") session = created;
    return created;
  });
  const [serverSnapshot] = useState(() => controller.getSnapshot());
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    () => serverSnapshot,
  );
  useEffect(() => {
    let nudging: number | undefined;
    const key = (event: KeyboardEvent) => {
      if (
        event.isComposing ||
        (event.target instanceof HTMLElement &&
          (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)))
      )
        return;
      if (event.key === "Escape") {
        controller.cancel();
        nudging = undefined;
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        controller.history(event.shiftKey ? "redo" : "undo");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        controller.duplicate();
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        controller.remove();
        return;
      }
      const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[
        event.key
      ];
      if (
        !delta ||
        (event.target instanceof HTMLElement &&
          event.target.closest("button:not(.ds-object-hit), [role=slider]"))
      )
        return;
      if (!nudging && controller.begin()) nudging = controller.getGesture()!.id;
      const gesture = controller.getGesture();
      if (!nudging || !gesture || nudging !== gesture.id) return;
      event.preventDefault();
      const transforms = controller.getSnapshot().transient;
      controller.preview(
        Object.fromEntries(
          Object.entries(gesture.before).map(([id, original]) => {
            const t = transforms[id] ?? original;
            return [
              id,
              {
                ...t,
                centerX: t.centerX + delta[0]! * (event.shiftKey ? 10 : 1),
                centerY: t.centerY + delta[1]! * (event.shiftKey ? 10 : 1),
              },
            ];
          }),
        ),
      );
    };
    const up = (event: KeyboardEvent) => {
      if (nudging && event.key.startsWith("Arrow")) {
        const id = nudging;
        nudging = undefined;
        controller.finish(id);
      }
    };
    const cancel = () => {
      nudging = undefined;
      controller.cancel();
    };
    const hidden = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      cancel();
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [controller]);
  return { controller, state, catalog };
}
export type Editor = ReturnType<typeof useEditor>;
