export const strings = [
  "مرحبا أونيكس",
  "لا",
  "مُحَمَّد",
  "ONYX 2026 — سوريا",
  "Line one\nالسطر الثاني",
  "(123) — !؟",
];
export const family = "SpikeArabic, SpikeLatin";
export function fixture(count = 10) {
  return Array.from({ length: count }, (_, i) => ({
    id: `object-${i}`,
    kind: i < strings.length ? "text" : i === 6 ? "image" : "rect",
    text: strings[i],
    direction: i === 3 || i === 4 ? "ltr" : "rtl",
    x: i < 6 ? 150 : 40 + ((i * 31) % 220),
    y: i < 6 ? 25 + i * 32 : 230 + ((i * 13) % 95),
    width: i < 6 ? 260 : 20,
    height: i === 4 ? 40 : 20,
    angle: i < 7 ? 0 : (i * 7) % 90,
    opacity: i < 7 ? 1 : 0.6,
    locked: i === 9,
    fontSize: 13,
    fill: i < 6 ? "#102030" : "#1267ab",
  }));
}
export async function resources() {
  const arabic = new FontFace("SpikeArabic", "url(/arabic.woff2)");
  const latin = new FontFace("SpikeLatin", "url(/latin.woff2)");
  document.fonts.add(await arabic.load());
  document.fonts.add(await latin.load());
  await document.fonts.ready;
  const image = new Image();
  image.src = "/artwork.png";
  await image.decode();
  return {
    image,
    fontCss: await Promise.all(
      ["arabic", "latin"].map(async (name) => {
        const blob = await (await fetch(`/${name}.woff2`)).blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(
              `@font-face{font-family:Spike${name === "arabic" ? "Arabic" : "Latin"};src:url(${reader.result})}`,
            );
          reader.readAsDataURL(blob);
        });
      }),
    ).then((rules) => rules.join("")),
  };
}
