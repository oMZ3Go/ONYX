import type { WorkspaceTheme } from "./types";

// A UI preference only. A cookie allows the server to paint the correct theme.
export const workspaceThemeKey = "onyx-studio-workspace-theme-v1";
export function parseWorkspaceTheme(value: string | undefined): WorkspaceTheme {
  return value === "light" ? "light" : "dark";
}
