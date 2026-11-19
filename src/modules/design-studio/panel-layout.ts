export type PanelSize = "compact" | "medium" | "expanded";
export type PanelDock = "bottom" | "top" | "left" | "right" | "floating";
export interface PanelPreferences {
  library: number;
  inspector: number;
  size: PanelSize;
  dock: PanelDock;
  floatX: number;
  floatY: number;
  split: number;
  mobileWidth: number;
}
export const defaultPanels: PanelPreferences = {
  library: 320,
  inspector: 320,
  size: "compact",
  dock: "bottom",
  floatX: 0.5,
  floatY: 0.85,
  split: 0.55,
  mobileWidth: 320,
};
export const panelPreferenceKey = "onyx-studio-panels-v1";
export function parsePanelPreferences(value: string): PanelPreferences {
  try {
    const raw = JSON.parse(value) as Partial<PanelPreferences>;
    const width = (v: unknown) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(260, Math.min(440, v)) : 320;
    const fraction = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
    return {
      library: width(raw.library),
      inspector: width(raw.inspector),
      size: raw.size === "medium" || raw.size === "expanded" ? raw.size : "compact",
      dock:
        raw.dock === "top" || raw.dock === "left" || raw.dock === "right" || raw.dock === "floating"
          ? raw.dock
          : "bottom",
      floatX: fraction(raw.floatX, 0.5),
      floatY: fraction(raw.floatY, 0.85),
      split: fraction(raw.split, 0.55),
      mobileWidth:
        typeof raw.mobileWidth === "number" && Number.isFinite(raw.mobileWidth)
          ? Math.max(284, Math.min(440, raw.mobileWidth))
          : 320,
    };
  } catch {
    return defaultPanels;
  }
}
export function panelWidths(
  width: number,
  preferences: PanelPreferences,
  collapsed: { library: boolean; inspector: boolean },
) {
  // Space excludes outer padding and both grid gaps. Keep a 320px camera area.
  const available = Math.max(520, width - 320);
  let library = collapsed.library ? 44 : preferences.library;
  let inspector = collapsed.inspector ? 44 : preferences.inspector;
  const excess = Math.max(0, library + inspector - available);
  if (excess) {
    const left = collapsed.library ? 0 : library - 260,
      right = collapsed.inspector ? 0 : inspector - 260;
    if (left + right) {
      library -= (excess * left) / (left + right);
      inspector -= (excess * right) / (left + right);
    }
  }
  return {
    library,
    inspector,
    libraryMaximum: Math.min(440, available - inspector),
    inspectorMaximum: Math.min(440, available - library),
  };
}
export function sheetSizes(viewportHeight: number, mainHeight: number) {
  const compact = Math.min(Math.max(172, viewportHeight * 0.27), 228, mainHeight * 0.48);
  const expanded = Math.max(compact, Math.min(mainHeight * 0.62, viewportHeight * 0.55));
  return { compact, medium: (compact + expanded) / 2, expanded };
}

export function inspectorSplit(height: number, ratio: number) {
  const available = Math.max(0, height - 12);
  const minimum = Math.min(140, available * 0.35);
  const properties = Math.max(minimum, Math.min(available - minimum, available * ratio));
  return { available, minimum, maximum: available - minimum, properties };
}

export function floatingPanel(
  width: number,
  height: number,
  requestedHeight: number,
  x: number,
  y: number,
  requestedWidth = 380,
) {
  const panelWidth = Math.max(0, Math.min(requestedWidth, width - 16));
  const panelHeight = Math.max(0, Math.min(requestedHeight, height - 16));
  const travelX = Math.max(0, width - panelWidth - 16);
  const travelY = Math.max(0, height - panelHeight - 16);
  return {
    width: panelWidth,
    height: panelHeight,
    travelX,
    travelY,
    left: 8 + Math.max(0, Math.min(1, x)) * travelX,
    top: 8 + Math.max(0, Math.min(1, y)) * travelY,
  };
}

/** Top/bottom cannot reserve useful preview height on a short landscape phone. */
export function mobileDock(dock: PanelDock, width: number, height: number): PanelDock {
  if (width >= 700 && width < 1000 && height <= 500) {
    if (dock === "top") return "left";
    if (dock === "bottom") return "right";
  }
  return dock;
}

export function mobilePanelWidth(width: number, requested: number, besidePreview: boolean) {
  const maximum = Math.max(0, Math.min(440, width - (besidePreview ? 308 : 0)));
  const minimum = Math.min(284, maximum);
  return { minimum, maximum, value: Math.max(minimum, Math.min(maximum, requested)) };
}

export function sideSheetSizes(mainHeight: number) {
  const compact = Math.min(mainHeight * 0.75, Math.max(172, Math.min(320, mainHeight * 0.6)));
  return { compact, medium: (compact + mainHeight) / 2, expanded: mainHeight };
}
export function nearestSheetSize(height: number, sizes: ReturnType<typeof sheetSizes>): PanelSize {
  return (Object.keys(sizes) as PanelSize[]).reduce(
    (best, key) => (Math.abs(sizes[key] - height) < Math.abs(sizes[best] - height) ? key : best),
    "compact",
  );
}
