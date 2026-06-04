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
