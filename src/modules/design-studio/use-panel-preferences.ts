import { useMemo, useSyncExternalStore } from "react";
import {
  defaultPanels,
  panelPreferenceKey,
  parsePanelPreferences,
  type PanelPreferences,
} from "./panel-layout";
const fallback = JSON.stringify(defaultPanels);
let memory = fallback;
const eventName = "onyx-panel-preferences";
function snapshot() {
  try {
    return localStorage.getItem(panelPreferenceKey) ?? memory;
  } catch {
    return memory;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}
export function usePanelPreferences() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => fallback);
  const preferences = useMemo(() => parsePanelPreferences(raw), [raw]);
  const update = (patch: Partial<PanelPreferences>) => {
    memory = JSON.stringify({ ...parsePanelPreferences(snapshot()), ...patch });
    try {
      localStorage.setItem(panelPreferenceKey, memory);
    } catch {
      /* This visit still works when storage is unavailable. */
    }
    window.dispatchEvent(new Event(eventName));
  };
  return [preferences, update] as const;
}
