import type { RGB } from '../interfaces'

/**
 * A `#RRGGBB` uppercase HEX color string. Single source of truth for the engine;
 * `interfaces.ts` imports this type rather than redefining it.
 */
export type HEX = string

/**
 * Convert an RGB triple (or the first three channels of an ImageData buffer) to
 * an uppercase `#RRGGBB` HEX string.
 *
 * The `(1 << 24) + (r << 16) + (g << 8) + b` trick forces a 7-digit hex value so
 * `.slice(1)` always yields exactly 6 digits — this is how leading-zero channels
 * (e.g. `#000F00`) stay padded. Ported verbatim from color-dropper (do not hand-roll).
 */
export function rgbToHex([r, g, b]: Uint8ClampedArray | RGB): HEX {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

/**
 * Read the pixel color at device-pixel `(x, y)` and return it as HEX (PICK-01).
 *
 * Two paths, shared by both the main-thread and worker families:
 * - No `imageData` arg: an uncached 1x1 `getImageData(x, y, 1, 1)` read (worker-side, D-12).
 * - With `imageData`: a cached lookup into a once-per-redraw ImageData buffer (D-11),
 *   indexed by `(⌊y⌋ * canvas.width + ⌊x⌋) * 4`.
 *
 * Stays pure: callers pass in-bounds device-pixel coordinates (T-05-01) and wrap the
 * no-arg path in try/catch to survive a `SecurityError` on a tainted canvas (T-05-ID).
 */
export function pickColor(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  imageData?: Uint8ClampedArray,
): HEX {
  if (!imageData) {
    return rgbToHex(context.getImageData(x, y, 1, 1).data)
  }

  const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4
  return rgbToHex([imageData[index], imageData[index + 1], imageData[index + 2]])
}
