import type { SVGProps } from "react";
type IconName =
  "arrow" | "menu" | "close" | "hanger" | "palette" | "box" | "spark" | "person" | "pause" | "play";
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
