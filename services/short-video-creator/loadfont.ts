import { continueRender, delayRender, staticFile } from "remotion";
export const BarlowCondensedBold = `BarlowCondensedBold`;
let loaded = false;
export const loadFont = async (): Promise<void> => {
  if (loaded) return;
  const waitForFont = delayRender();
  loaded = true;
  const font = new FontFace(
    BarlowCondensedBold,
    `url('${staticFile("/Fonts/BarlowCondensedBold.ttf")}') format('truetype')`
  );
  await font.load();
  document.fonts.add(font);
  continueRender(waitForFont);
};