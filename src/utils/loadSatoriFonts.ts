import { fontData, experimental_getFontFileURL } from "astro:assets";
import { getFontPathByWeight } from "./getFontPathByWeight";

const OG_WEIGHTS = new Set([400, 700]);

export async function loadSatoriFonts(
  cssVariable: string,
  origin: URL,
  familyName: string
) {
  const family = fontData[cssVariable];
  if (!family?.length) {
    throw new Error(`Cannot find font data for ${cssVariable}.`);
  }

  const files: { weight: 400 | 700; url: string }[] = [];

  for (const font of family) {
    const weight = Number(font.weight);
    if (font.style !== "normal" || !OG_WEIGHTS.has(weight)) continue;

    const src =
      font.src.find(file => file.format === "woff" || file.format === "truetype") ??
      font.src[0];
    if (src) files.push({ weight: weight as 400 | 700, url: src.url });
  }

  const selected =
    files.length > 0 && files.length <= 12
      ? files
      : ([400, 700] as const)
          .map(weight => {
            const url = getFontPathByWeight(family, weight);
            return url ? { weight, url } : undefined;
          })
          .filter((file): file is { weight: 400 | 700; url: string } => Boolean(file));

  if (selected.length === 0) {
    throw new Error(`Cannot find the font path for ${cssVariable}.`);
  }

  const fonts = await Promise.all(
    selected.map(async (file, index) => {
      const data = await fetch(
        experimental_getFontFileURL(file.url, origin)
      ).then(res => res.arrayBuffer());

      return {
        name: `${familyName} ${index}`,
        data,
        weight: file.weight,
        style: "normal" as const,
      };
    })
  );

  return {
    fontFamily: fonts.map(font => font.name).join(", "),
    fonts,
  };
}
