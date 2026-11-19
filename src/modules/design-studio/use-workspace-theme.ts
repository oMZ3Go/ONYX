"use client";

import { useSyncExternalStore } from "react";
import { parseWorkspaceTheme, workspaceThemeKey } from "./preferences";
import type { WorkspaceTheme } from "./types";

const eventName = "onyx-workspace-theme";
let memory: WorkspaceTheme | undefined;
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("pageshow", callback);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("pageshow", callback);
  };
}
function snapshot() {
  try {
    const value = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${workspaceThemeKey}=`))
      ?.split("=")[1];
    return value ? parseWorkspaceTheme(value) : (memory ?? "dark");
  } catch {
    return memory ?? "dark";
  }
}
export function useWorkspaceTheme(initialTheme: WorkspaceTheme) {
  const theme = useSyncExternalStore(subscribe, snapshot, () => initialTheme);
  const setTheme = (next: WorkspaceTheme) => {
    memory = next;
    try {
      document.cookie = `${workspaceThemeKey}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } catch {
      // Storage restrictions must not prevent changing the current workspace.
    }
    window.dispatchEvent(new Event(eventName));
  };
  return [theme, setTheme] as const;
}
