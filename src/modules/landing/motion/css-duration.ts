/** Production CSS minification can serialize millisecond tokens as seconds. */
export function durationMilliseconds(value: string, fallback: number): number {
  const match = /^(\d*\.?\d+)(ms|s)$/i.exec(value.trim());
  if (!match) return fallback;
  const milliseconds = Number(match[1]) * (match[2]?.toLowerCase() === "s" ? 1000 : 1);
  return Number.isFinite(milliseconds) ? milliseconds : fallback;
}
