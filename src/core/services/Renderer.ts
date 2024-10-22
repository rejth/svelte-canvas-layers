import type {
  CanvasContextType,
  CanvasOptions,
  PixelRatio,
  Point,
  RectDimension,
} from 'core/interfaces';

interface TransformationMatrix {
  translationX: number;
  translationY: number;
  scaleX: number;
  scaleY: number;
  skewY: number;
  skewX: number;
  initialScale: number;
}

interface ClearRectOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Renderer {
  context: CanvasContextType | null;

  width?: number;
  height?: number;
  initialPixelRatio?: PixelRatio;
  pixelRatio?: PixelRatio;

  constructor() {
    this.context = null;
  }

  init(context: CanvasContextType | null, initialPixelRatio: PixelRatio) {
    this.context = context;
    this.initialPixelRatio = initialPixelRatio;
  }

  getContext(): CanvasContextType | null {
    return this.context;
  }

  getCanvasOptions(): CanvasOptions {
    return {
      width: this.width!,
      height: this.height!,
      initialPixelRatio: this.initialPixelRatio!,
      pixelRatio: this.pixelRatio!,
    };
  }

  getTransform(): TransformationMatrix | null {
    if (!this.context) return null;
    const transform = this.context.getTransform();

    return {
      scaleX: transform.a,
      skewY: transform.b,
      skewX: transform.c,
      scaleY: transform.d,
      translationX: transform.e,
      translationY: transform.f,
      initialScale: this.initialPixelRatio!,
    };
  }

  /*
   * https://roblouie.com/article/617/transforming-mouse-coordinates-to-canvas-coordinates/
   * This method has been modified. The original method doesn't take in account current scale.
   * https://math.hws.edu/graphicsbook/c6/s5.html#webgl.5.1
   * */
  getTransformedPoint(x: number, y: number): Point {
    const transform = this.getTransform();
    if (!transform) return { x, y };

    const inverseZoom = 1 / (transform.scaleX / transform.initialScale);

    const transformedX =
      inverseZoom * x - inverseZoom * (transform.translationX / transform.initialScale);
    const transformedY =
      inverseZoom * y - inverseZoom * (transform.translationY / transform.initialScale);

    return { x: transformedX, y: transformedY };
  }

  /**
   * This method calculates the transformed area of the canvas relative to the window.
   * The method takes into account the translation and scale of the canvas.
   */
  getTransformedArea(): RectDimension | null {
    const transform = this.getTransform();
    if (!transform) return null;

    const inverseScale = 2 / transform.scaleX < 2 ? 2 : 2 / transform.scaleX;

    return {
      x: transform.translationX > 0 ? -transform.translationX * inverseScale : 0,
      y: transform.translationY > 0 ? -transform.translationY * inverseScale : 0,
      width: window.innerWidth * inverseScale + Math.abs(transform.translationX) * inverseScale,
      height: window.innerHeight * inverseScale + Math.abs(transform.translationY) * inverseScale,
    };
  }

  scale(scaleX: number, scaleY: number) {
    const transform = this.getTransform();
    if (!this.context || !transform) return;

    this.context.scale(scaleX, scaleY);
    this.pixelRatio = transform.scaleX;
  }

  /**
   * Clear the specified rectangle of the canvas asynchronously using requestAnimationFrame.
   *
   * @param x - The x-coordinate of the top-left corner of the rectangle to clear.
   * @param y - The y-coordinate of the top-left corner of the rectangle to clear.
   * @param width - The width of the rectangle to clear.
   * @param height - The height of the rectangle to clear.
   * @param callBack - A function to be called after clearing the rectangle.
   */
  clearRect({ x, y, width, height }: ClearRectOptions, callBack: () => void) {
    requestAnimationFrame(() => {
      this.context!.clearRect(x, y, width, height);
      callBack();
    });
  }

  /**
   * Clear the specified rectangle of the canvas synchronously.
   * This method is typically slower than the asynchronous version `clearRect` because it blocks the main thread.
   * @param {{ x: number, y: number, width: number, height: number }}
   */
  clearRectSync({ x, y, width, height }: ClearRectOptions) {
    this.context!.clearRect(x, y, width, height);
  }
}
