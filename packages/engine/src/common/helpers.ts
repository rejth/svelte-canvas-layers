import canvasSize from 'canvas-size'

export type CanvasPixelRatio = number | 'auto' | null

export function getMaxPixelRatio(
  width: number,
  height: number,
  target: number,
  decrement: number = 0.1,
): number {
  if (typeof window === 'undefined') return target

  /**
   * Canvas-size runs tests using a set of predefined size values for a variety of browser and platform combinations.
   * Tests validate the ability to read pixel data from canvas element of the predefined dimension by decreasing canvas height and/or width until a test succeeds.
   */
  while (!canvasSize.test({ sizes: [[width * target, height * target]] })) {
    target -= decrement
  }

  return target
}

export const createResizeAction =
  (onResize: (width: number, height: number) => void) => (node: HTMLElement) => {
    const observer = new ResizeObserver(([{ contentRect }]) => {
      onResize(contentRect.width, contentRect.height)
    })

    observer.observe(node)

    return {
      destroy: () => observer.disconnect(),
    }
  }

export const derivePixelRatio = (opts: {
  width: number
  height: number
  devicePixelRatio: number | undefined
  pixelRatio: CanvasPixelRatio
}): number => {
  const { width, height, devicePixelRatio, pixelRatio } = opts

  if (typeof pixelRatio === 'number') {
    return pixelRatio
  }

  if (devicePixelRatio && pixelRatio === 'auto') {
    return getMaxPixelRatio(width, height, devicePixelRatio)
  }

  return devicePixelRatio ?? 2
}
