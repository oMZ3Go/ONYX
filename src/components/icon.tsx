import type { SVGProps } from "react";
export type IconName =
  | "arrow"
  | "menu"
  | "close"
  | "hanger"
  | "palette"
  | "box"
  | "spark"
  | "person"
  | "pause"
  | "play"
  | "home"
  | "grid"
  | "tag"
  | "mail"
  | "pin"
  | "message"
  | "globe"
  | "instagram"
  | "whatsapp"
  | "facebook"
  | "tiktok";
const paths: Record<IconName, string> = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M6 18 18 6",
  hanger: "M9 6a3 3 0 1 1 3 3v3L3 18a1 1 0 0 0 .6 2h16.8a1 1 0 0 0 .6-2l-9-6",
  palette:
    "M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.5 1.5 0 0 1 1-2.6h2a4 4 0 0 0 4-4C21 6.3 17 3 12 3ZM7 10h.01M10 7h.01M15 7h.01M17 10h.01",
  box: "m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 10 9-5M12 13 3 8m9 5v9M7.5 5.5l9 5V15",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  person:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m15-6a4 4 0 0 1 3 4v2M14 3a4 4 0 0 1 0 8M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  pause: "M8 5v14M16 5v14",
  play: "m8 4 12 8-12 8V4Z",
  home: "m3 10 9-7 9 7v10H3V10Zm6 10v-7h6v7",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  tag: "M3 3h8l10 10-8 8L3 11V3Zm5 4h.01",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  message: "M21 11a9 9 0 0 1-13 8L3 21l1-5A9 9 0 1 1 21 11ZM8 10h8M8 14h5",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  instagram:
    "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM17 7h.01",
  whatsapp:
    "M21 12a9 9 0 0 1-13 8l-5 1 1-5A9 9 0 1 1 21 12ZM8 7l2 3-1 1c1 2 2 3 4 4l1-1 3 1c0 3-3 3-6 1-3-2-5-5-4-7l1-2Z",
  facebook: "M14 21v-8h3l1-4h-4V7c0-1 1-1 3-1V3h-3c-3 0-5 2-5 5v1H6v4h3v8",
  tiktok: "M14 3v12a4 4 0 1 1-4-4M14 3c1 4 3 5 7 5v4c-3 0-5-1-7-3",
};
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
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
