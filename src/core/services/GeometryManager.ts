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

  getPathBounds(path: Point[]): Bounds | null {
    if (!path.length) return null;

    const from = path[0];
    const to = path[path.length - 1];

    return {
      x0: from.x,
      y0: from.y,
      x1: to.x,
      y1: to.y,
    };
  }

  getRectDimensionFromPath(path: Point[]): RectDimension | null {
    if (!path.length) return null;

    const from = path[0];
    const to = path[path.length - 1];

    return {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(from.x - to.x),
      height: Math.abs(from.y - to.y),
    };
  }

  getRectDimensionFromBounds(bounds: Bounds): RectDimension {
    const { x0, y0, x1, y1 } = bounds;
    return {
      x: Math.min(x0, x1),
      y: Math.min(y0, y1),
      width: Math.abs(x0 - x1),
      height: Math.abs(y0 - y1),
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

  getMiddlePoint(from: number, to: number): number {
    return (from + to) / 2;
  }

  isPointInsideRect(p: Point, rect: DOMRect | RectPosition): boolean {
    return p.x > rect.left && p.x < rect.right && p.y > rect.top && p.y < rect.bottom;
  }

  isOverlapping(rectA: Bounds, rectB: Bounds): boolean {
    const rect1 = this.getBBox(rectA);
    const rect2 = this.getBBox(rectB);

    return !(
      rect1.maxX < rect2.minX ||
      rect1.minX > rect2.maxX ||
      rect1.maxY < rect2.minY ||
      rect1.minY > rect2.maxY
    );
  }
}

export const geometryManager = new GeometryManager();
