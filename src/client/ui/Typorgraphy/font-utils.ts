import * as opentype from 'opentype.js';

export type OpentypePath = Awaited<ReturnType<typeof loadFont>>;

export const loadFont = async (text: string, options: { fontSize: number }) => {
  const data = await fetch('/fonts/Modak-Regular.ttf').then((response) => response.arrayBuffer());
  const font = opentype.parse(data);
  return font.getPath(text, 300, 300, options.fontSize);
};

const defaultFontDescriptor = {
  style: 'normal',
  weight: 'normal',
};

/**
 * Loads a custom font from a given path and returns the font data and whether it is loaded
 * @param fontFamily - The name of the font family. e.g. "Modak".
 * @param fontSize - The size of the font
 * @param pathToFont - The path to the font file. e.g. "/fonts/Modak-Regular.ttf".
 * @param fontDescriptor - The font descriptor
 */
export const loadCustomFont = async (
  fontFamily: string,
  fontSize: number,
  pathToFont: string,
  fontDescriptor?: FontFaceDescriptors,
) => {
  try {
    const fontFace = new FontFace(
      fontFamily,
      `url(${pathToFont})`,
      fontDescriptor || defaultFontDescriptor,
    );

    const loadedFont = await fontFace.load();
    document.fonts.add(loadedFont);

    await document.fonts.ready;

    const isFontReady = document.fonts.check(`${fontSize}px ${fontFamily}`);

    if (isFontReady) {
      return {
        data: `${fontSize}px ${fontFamily}, sans-serif`,
        isLoaded: true,
      };
    } else {
      throw new Error('Font failed to load properly');
    }
  } catch (error) {
    return {
      data: null,
      isLoaded: true,
    };
  }
};
