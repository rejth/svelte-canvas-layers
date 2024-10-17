import canvasSize from 'canvas-size';

export function getMaxPixelRatio(
  width: number,
  height: number,
  target: number,
  decrement: number = 0.1,
): number {
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
