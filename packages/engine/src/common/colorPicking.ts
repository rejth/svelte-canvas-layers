export type HEX = string

export type RGB = [number, number, number]

/**
 * Convert an RGB triple (or the first three channels of an ImageData buffer) to an uppercase `#RRGGBB` HEX string.
 */
export function rgbToHex([r, g, b]: Uint8ClampedArray | RGB): HEX {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

/**
 * Read the pixel color at device-pixel `(x, y)` and return it as HEX.
 */
export function pickColor(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
): HEX {
  return rgbToHex(ctx.getImageData(x, y, 1, 1).data)
}

type PickingCoordCallback = (deviceX: number, deviceY: number, cssX: number, cssY: number) => void

export function createPickingWiring(opts: {
  onPick: PickingCoordCallback
  getPixelRatio: () => number
}) {
  return (node: HTMLCanvasElement) => {
    const { onPick, getPixelRatio } = opts

    const toDevice = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      const pixelRatio = getPixelRatio()
      return {
        dx: (e.clientX - rect.left) * pixelRatio,
        dy: (e.clientY - rect.top) * pixelRatio,
        cssX: e.clientX,
        cssY: e.clientY,
      }
    }

    const handleClick = (e: PointerEvent) => {
      const { dx, dy, cssX, cssY } = toDevice(e)
      onPick(dx, dy, cssX, cssY)
    }

    node.addEventListener('click', handleClick as EventListener)

    return {
      destroy: () => {
        node.removeEventListener('click', handleClick as EventListener)
      },
    }
  }
}
