import canvasSize from 'canvas-size';
import type { RGB } from './types';

export function getMaxPixelRatio(width: number, height: number, target: number, decrement: number = 0.1): number {
  if (typeof window === 'undefined') return target;

  /**
   * Canvas-size runs tests using a set of predefined size values for a variety of browser and platform combinations.
   * Tests validate the ability to read pixel data from canvas element of the predefined dimension by decreasing canvas height and/or width until a test succeeds.
   */
  while (!canvasSize.test({ sizes: [[width * target, height * target]] })) {
    target -= decrement;
  }

  return target;
}

// https://blog.logrocket.com/guide-javascript-bitwise-operators/#sign-propagating-right-shift
export function convertRGBtoLayerId([r, g, b]: RGB): number {
  const id = ((r << 16) | (g << 8) | b) / 2;
  return id % 1 ? 0 : id;
}

export function convertLayerIdToRGB(id: number): RGB {
  const id2 = id * 2;
  const r = (id2 >> 16) & 0xff;
  const g = (id2 >> 8) & 0xff;
  const b = id2 & 0xff;
  return [r, g, b];
}
