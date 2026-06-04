import { getMaxPixelRatio } from '../services'

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

type PickingCoordCallback = (deviceX: number, deviceY: number, cssX: number, cssY: number) => void

/**
 * Shared Svelte action wiring pointer events to color-picking callbacks — consumed by
 * both the main-thread Canvas (Plan 02) and the worker WorkerCanvas (Plan 03).
 *
 * Coordinate conversion is rect-relative `(clientX - rect.left) * pixelRatio` (LOCKED, OQ1):
 * `getBoundingClientRect()` accounts for scroll/offset, whereas geometry.ts:getMousePosition
 * uses `pageX` which is scroll-unsafe and wrong for a pixel index. Callbacks receive BOTH the
 * device-pixel coords (for the pixel read) and the raw CSS-pixel client coords (for the payload, OQ2).
 *
 * `pointermove` is rAF-coalesced to at most one `onPeek` per animation frame (D-05) to bound
 * the read rate; `click` fires `onPick` immediately with no rAF (D-06). No listener runs at
 * module scope — overhead is zero until a component applies `use:createPickingWiring` (D-02).
 */
export const createPickingWiring =
  (opts: { onPeek: PickingCoordCallback; onPick: PickingCoordCallback; getPixelRatio: () => number }) =>
  (node: HTMLCanvasElement) => {
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

export const derivePixelRatio = (opts: {
  width: number
  height: number
  devicePixelRatio: number | undefined
  pixelRatio: 'auto' | null
}): number => {
  const { width, height, devicePixelRatio, pixelRatio } = opts

  if (devicePixelRatio && pixelRatio === 'auto') {
    return getMaxPixelRatio(width, height, devicePixelRatio)
  }

  return devicePixelRatio ?? 2
}
