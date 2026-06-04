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
 *
 * Two paths, shared by both the main-thread and worker families:
 * - No `imageData` arg: an uncached 1x1 `getImageData(x, y, 1, 1)` read (worker-side).
 * - With `imageData`: a cached lookup into a once-per-redraw ImageData buffer, indexed by `(⌊y⌋ * canvas.width + ⌊x⌋) * 4`.
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

type PickingCoordCallback = (deviceX: number, deviceY: number, cssX: number, cssY: number) => void

export function createPickingWiring(opts: {
  onPeek: PickingCoordCallback
  onPick: PickingCoordCallback
  getPixelRatio: () => number
}) {
  return (node: HTMLCanvasElement) => {
    const { onPeek, onPick, getPixelRatio } = opts

    let pending: { dx: number; dy: number; cssX: number; cssY: number } | null = null
    let frame: number | null = null

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

    const handlePointerMove = (e: PointerEvent) => {
      pending = toDevice(e)
      if (frame !== null) return
      frame = requestAnimationFrame(() => {
        frame = null
        if (!pending) return
        const { dx, dy, cssX, cssY } = pending
        onPeek(dx, dy, cssX, cssY)
      })
    }

    const handleClick = (e: PointerEvent) => {
      const { dx, dy, cssX, cssY } = toDevice(e)
      onPick(dx, dy, cssX, cssY)
    }

    node.addEventListener('pointermove', handlePointerMove)
    node.addEventListener('click', handleClick as EventListener)

    return {
      destroy: () => {
        node.removeEventListener('pointermove', handlePointerMove)
        node.removeEventListener('click', handleClick as EventListener)
        if (frame !== null) cancelAnimationFrame(frame)
      },
    }
  }
}
