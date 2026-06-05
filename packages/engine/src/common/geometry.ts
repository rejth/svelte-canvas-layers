import type { OriginalEvent, PixelRatio, Point, RectCorners } from './types'

const defaultPoint: Point = { x: 0, y: 0 }

function getMousePosition(e: MouseEvent, pixelRatio: PixelRatio = 1): Point {
  return {
    x: e.pageX * pixelRatio,
    y: e.pageY * pixelRatio,
  }
}

function getTouchPosition(e: TouchEvent, pixelRatio: PixelRatio = 1): Point {
  const { left, top } = (<Element>e.target).getBoundingClientRect()
  const { clientX, clientY } = e.changedTouches[0]
  return {
    x: (clientX - left) * pixelRatio,
    y: (clientY - top) * pixelRatio,
  }
}

export function calculatePosition(e: OriginalEvent, pixelRatio: PixelRatio = 1): Point {
  if (window.TouchEvent && e instanceof TouchEvent) {
    return getTouchPosition(e, pixelRatio)
  } else if (e instanceof MouseEvent) {
    return getMousePosition(e, pixelRatio)
  }
  return defaultPoint
}

export function getRectCorners(x: number, y: number, w: number, h: number): RectCorners {
  return {
    topLeft: { x, y },
    topRight: { x: x + w, y },
    bottomLeft: { x, y: y + h },
    bottomRight: { x: x + w, y: y + h },
  }
}
