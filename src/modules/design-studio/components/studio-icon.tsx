import type { SVGProps } from "react";

const paths = {
  centerX: "M12 2v20M3 8h18v8H3V8Z",
  centerY: "M2 12h20M8 3h8v18H8V3Z",
  forward: "M5 10h9v9H5V10Zm5-5h9v9M14 2v5m-3-3 3-3 3 3",
  backward: "M10 5h9v9h-9V5ZM5 10v9h9M5 17v5m-3-3 3 3 3-3",
  duplicate: "M8 8h12v12H8V8ZM4 16H3V3h13v1",
  delete: "M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
  lock: "M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4M12 14v3",
  unlock: "M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0M12 14v3",
  clip: "m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4M8 3l4 4 4-4M10 13l2 2 4-4",
  sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  moon: "M20 15.5A9 9 0 0 1 8.5 4a9 9 0 1 0 11.5 11.5Z",
  front: "m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4M8 3l4 4 4-4M10 15h4l1 3H9l1-3Z",
  back: "m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4M8 3q4 4 8 0M9 8h6",
  both: "m6 4-5 3 2 4 3-2v11h7V9l3 2 2-4-5-3M6 4l3.5 3L13 4m4 0 6 3-2 4-3-2v11h-3",
  width: "M3 6v12M21 6v12M4 12h16M7 9l-3 3 3 3m10-6 3 3-3 3",
  pin: "m8 3 8 0-1 7 4 4v2H5v-2l4-4-1-7Zm4 13v6",
  compact: "M4 9h16v11H4V9Zm0 0V4h16v5M8 15h8",
  panel: "M4 4h16v16H4V4Zm0 7h16",
  expand: "M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5",
  dockTop: "M4 4h16v16H4V4Zm0 5h16m-8 9v-6m-3 3 3-3 3 3",
  dockBottom: "M4 4h16v16H4V4Zm0 11h16M12 6v6m-3-3 3 3 3-3",
  dockLeft: "M4 4h16v16H4V4Zm5 0v16m9-8h-6m3-3-3 3 3 3",
  dockRight: "M4 4h16v16H4V4Zm11 0v16M6 12h6m-3-3 3 3-3 3",
  reset: "M4 10a8 8 0 1 1 0 5M4 4v6h6",
  hand: "M8 13V5a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v9-6a2 2 0 0 1 4 0v9c0 4-2 7-6 7h-2c-2 0-4-2-5-4l-4-5a2 2 0 0 1 3-3l2 3Z",
  move: "M12 2v20M2 12h20M8 6l4-4 4 4M8 18l4 4 4-4M6 8l-4 4 4 4m12-8 4 4-4 4",
  resize: "M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4",
  undo: "M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "m15 4 5 5-5 5m5-5H10a6 6 0 0 0 0 12h3",
  minus: "M5 12h14",
  plus: "M5 12h14M12 5v14",
  fit: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  fullscreen: "M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6M3 3l6 6m6 6 6 6M21 3l-6 6M9 15l-6 6",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  cloud: "M7 18H5a4 4 0 0 1-.7-7.94A7 7 0 0 1 18 9a4.5 4.5 0 0 1 1 8.9M12 21V11m-4 4 4-4 4 4",
  folder: "M3 7V4h6l3 3h9v14H3V7Zm0 3h18",
  layers: "m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5",
  bookmark: "M6 3h12v19l-6-4-6 4V3Z",
  file: "M5 3h9l5 5v13H5V3Zm9 0v6h5",
  chevron: "m9 5 7 7-7 7",
  shapes: "M8 3 2 13h12L8 3Zm8 8a5 5 0 1 1-5 5m5-10h5v5",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
} as const;
export function StudioIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
