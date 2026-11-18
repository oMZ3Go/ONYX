import type { LocalizedStudioProps, WorkspaceTheme } from "../types";
import { StudioIcon } from "./studio-icon";

export function AppearanceControl({
  copy,
  theme,
  onTheme,
}: Pick<LocalizedStudioProps, "copy"> & {
  theme: WorkspaceTheme;
  onTheme: (theme: WorkspaceTheme) => void;
}) {
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? copy.workspace.switchToLight : copy.workspace.switchToDark;
  return (
    <button
      className="ds-appearance-toggle"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => onTheme(next)}
    >
      <StudioIcon
        key={next}
        name={next === "light" ? "sun" : "moon"}
        data-theme-icon={next === "light" ? "sun" : "moon"}
      />
    </button>
  );
}
