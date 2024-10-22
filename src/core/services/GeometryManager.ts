import type { BBox } from 'rbush';
import type {
  OriginalEvent,
  Bounds,
  Point,
  RectDimension,
  PixelRatio,
  RectPosition,
} from 'core/interfaces';

class GeometryManager {
  defaultPoint: Point;

  constructor() {
    this.defaultPoint = { x: 0, y: 0 };
  }

  calculatePosition(e: OriginalEvent, pixelRatio: PixelRatio = 1): Point {
    if (window.TouchEvent && e instanceof TouchEvent) {
      return this.#getTouchPosition(e, pixelRatio);
    } else if (e instanceof MouseEvent) {
      return this.#getMousePosition(e, pixelRatio);
    }

    return this.defaultPoint;
  }

  #getMousePosition(e: MouseEvent, pixelRatio: PixelRatio = 1): Point {
    return {
      x: e.offsetX * pixelRatio,
      y: e.offsetY * pixelRatio,
    };
  }

  #getTouchPosition(e: TouchEvent, pixelRatio: PixelRatio = 1): Point {
    const { left, top } = (<Element>e.target).getBoundingClientRect();
    const { clientX, clientY } = e.changedTouches[0];
    return {
      x: (clientX - left) * pixelRatio,
      y: (clientY - top) * pixelRatio,
    };
  }

  getRectDimensionFromPath(path: Point[]): RectDimension {
    const from = path[0] ?? 0;
    const to = path[path.length - 1] ?? 0;
    return {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(from.x - to.x),
      height: Math.abs(from.y - to.y),
    };
  }

  getRectDimension(bounds: Bounds): RectDimension {
    const { x0, y0, x1, y1 } = bounds;
    return {
      x: Math.min(x0, x1),
      y: Math.min(y0, y1),
      width: Math.abs(x0 - x1),
      height: Math.abs(y0 - y1),
    };
  }

  getRectPosition(rect: RectDimension): RectPosition {
    return {
      left: rect.x,
      top: rect.y,
      bottom: rect.y + rect.height,
      right: rect.x + rect.width,
    };
  }

  getBBox(bounds: Bounds = { x0: 0, y0: 0, x1: 0, y1: 0 }): BBox {
    const { x0, y0, x1, y1 } = bounds;
    return {
      minX: Math.min(x0, x1),
      minY: Math.min(y0, y1),
      maxX: Math.max(x0, x1),
      maxY: Math.max(y0, y1),
    };
  }

  convertRectToBBox(rect: DOMRect | RectDimension): BBox {
    return {
      minX: rect.x,
      minY: rect.y,
      maxX: rect.x + rect.width,
      maxY: rect.y + rect.height,
    };
  }

  getPathBounds(path: Point[]): Bounds {
    const from = path[0] || this.defaultPoint;
    const to = path[path.length - 1] || this.defaultPoint;
    return {
      x0: from.x,
      y0: from.y,
      x1: to.x,
      y1: to.y,
    };
  }

  getMiddlePoint(from: number, to: number): number {
    return (from + to) / 2;
  }

  isPointInsideRect(p: Point, rect: DOMRect): boolean {
    return p.x > rect.left && p.x < rect.right && p.y > rect.top && p.y < rect.bottom;
  }

  isPointInsideRectDimensions(p: Point, rect: DOMRect): boolean {
    return (
      p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height
    );
  }

  overlapRect(rectA: RectPosition, rectB: RectPosition): boolean {
    return (
      rectA.left < rectB.right &&
      rectA.right > rectB.left &&
      rectA.top < rectB.bottom &&
      rectA.bottom > rectB.top
    );
  }

  isOverlapping(rectA: Bounds, rectB: Bounds) {
    const normalizeRect = (rect: Bounds) => {
      return {
        x0: Math.min(rect.x0, rect.x1),
        y0: Math.min(rect.y0, rect.y1),
        x1: Math.max(rect.x0, rect.x1),
        y1: Math.max(rect.y0, rect.y1),
      };
    };

    const rect1 = normalizeRect(rectA);
    const rect2 = normalizeRect(rectB);

    return !(
      rect1.x1 < rect2.x0 ||
      rect1.x0 > rect2.x1 ||
      rect1.y1 < rect2.y0 ||
      rect1.y0 > rect2.y1
    );
  }
}

export const geometryManager = new GeometryManager();
