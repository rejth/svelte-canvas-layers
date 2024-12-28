import type {
  BezierCurveDrawOptions,
  CanvasContextType,
  CanvasOptions,
  ImageDrawOptions,
  CircleDrawOptions,
  PixelRatio,
  Point,
  QuadraticCurveDrawOptions,
  RectDimension,
  RectDrawOptions,
  RoundedRectDrawOptions,
  StrokeDrawOptions,
  TextDrawOptions,
  TransformationMatrix,
  ClearRectOptions,
} from 'core/interfaces';
import { geometryManager } from 'core/services';

import { SMALL_PADDING } from 'client/shared/constants';

export class Renderer {
  ctx: CanvasContextType | null;

  width: number;
  height: number;
  initialPixelRatio: PixelRatio;
  pixelRatio: PixelRatio;

  constructor() {
    this.ctx = null;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.initialPixelRatio = window.devicePixelRatio ?? 2;
    this.pixelRatio = window.devicePixelRatio ?? 2;
  }

  init(context: CanvasContextType | null, initialPixelRatio: PixelRatio) {
    this.ctx = context;
    this.initialPixelRatio = initialPixelRatio;
  }

  getContext(): CanvasContextType | null {
    return this.ctx;
  }

  getCanvasOptions(): CanvasOptions {
    return {
      width: this.width,
      height: this.height,
      initialPixelRatio: this.initialPixelRatio,
      pixelRatio: this.pixelRatio,
    };
  }

  getTransform(): TransformationMatrix | null {
    if (!this.ctx) return null;

    const transform = this.ctx.getTransform();

    return {
      scaleX: transform.a,
      skewY: transform.b,
      skewX: transform.c,
      scaleY: transform.d,
      translationX: transform.e,
      translationY: transform.f,
      initialScale: this.initialPixelRatio,
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
    if (!this.ctx || !transform) return;

    this.ctx.scale(scaleX, scaleY);
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
      this.ctx!.clearRect(x, y, width, height);
      callBack();
    });
  }

  /**
   * Clear the specified rectangle of the canvas synchronously.
   * This method is typically slower than the asynchronous version `clearRect` because it blocks the main thread.
   * @param {{ x: number, y: number, width: number, height: number }}
   */
  clearRectSync({ x, y, width, height }: ClearRectOptions) {
    this.ctx!.clearRect(x, y, width, height);
  }

  fillRect(options: RectDrawOptions) {
    if (!this.ctx) return;

    const { x, y, width, height, color, shadowColor, shadowOffsetY, shadowOffsetX, shadowBlur } =
      options;

    this.ctx.save();

    if (color) {
      this.ctx.fillStyle = color;
    }
    if (shadowColor) {
      this.ctx.shadowColor = shadowColor;
    }
    if (shadowOffsetY) {
      this.ctx.shadowOffsetY = shadowOffsetY;
    }
    if (shadowOffsetX) {
      this.ctx.shadowOffsetX = shadowOffsetX;
    }
    if (shadowBlur) {
      this.ctx.shadowBlur = shadowBlur;
    }

    this.ctx.fillRect(x, y, width, height);
    this.ctx.restore();
  }

  fillRoundedRect(options: RoundedRectDrawOptions) {
    if (!this.ctx) return;

    const {
      x,
      y,
      width,
      height,
      radius,
      color,
      shadowColor,
      shadowOffsetY,
      shadowOffsetX,
      shadowBlur,
    } = options;

    const { topLeft, topRight, bottomLeft, bottomRight } = geometryManager.getRectCorners(
      x,
      y,
      width,
      height,
    );

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 4;

    if (shadowColor) {
      this.ctx.shadowColor = shadowColor;
    }
    if (shadowOffsetY) {
      this.ctx.shadowOffsetY = shadowOffsetY;
    }
    if (shadowOffsetX) {
      this.ctx.shadowOffsetX = shadowOffsetX;
    }
    if (shadowBlur) {
      this.ctx.shadowBlur = shadowBlur;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(topLeft.x + radius, topLeft.y);

    this.ctx.lineTo(topRight.x - radius, topRight.y);
    this.ctx.quadraticCurveTo(topRight.x, topRight.y, topRight.x, topRight.y + radius);

    this.ctx.lineTo(bottomRight.x, bottomRight.y - radius);
    this.ctx.quadraticCurveTo(bottomRight.x, bottomRight.y, bottomRight.x - radius, bottomRight.y);

    this.ctx.lineTo(bottomLeft.x + radius, bottomLeft.y);
    this.ctx.quadraticCurveTo(bottomLeft.x, bottomLeft.y, bottomLeft.x, bottomLeft.y - radius);

    this.ctx.lineTo(topLeft.x, topLeft.y + radius);
    this.ctx.quadraticCurveTo(topLeft.x, topLeft.y, topLeft.x + radius, topLeft.y);

    this.ctx.fill();
    this.ctx.closePath();

    this.ctx.restore();
  }

  strokeRect(options: StrokeDrawOptions) {
    if (!this.ctx) return;

    const { x, y, width, height, lineWidth, color } = options;

    this.ctx.save();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
  }

  fillCircle(options: CircleDrawOptions) {
    if (!this.ctx) return;

    const { x, y, radius, color } = options;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  strokeQuadraticCurve(options: QuadraticCurveDrawOptions) {
    if (!this.ctx) return;

    const { start, control, end, color, lineWidth } = options;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  strokeBezierCurve(options: BezierCurveDrawOptions) {
    if (!this.ctx) return;

    const { start, cp1, cp2, end, color, lineWidth } = options;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  drawImage(options: ImageDrawOptions) {
    if (!this.ctx || !options.image) return;

    this.ctx.save();
    this.ctx.drawImage(options.image, options.x, options.y, options.width, options.height);
    this.ctx.restore();
  }

  renderTextSnapshot(
    fragments: string[],
    textOptions: TextDrawOptions,
    canvasOptions: CanvasOptions,
  ) {
    if (!this.ctx) return;

    const { fontSize, fontStyle, textAlign, x, y, width, height, scale = 1 } = textOptions;
    const { pixelRatio, initialPixelRatio } = canvasOptions;

    const offscreenCanvas = new OffscreenCanvas(width, width);
    offscreenCanvas.width = Math.floor(width * pixelRatio);
    offscreenCanvas.height = Math.floor(height * pixelRatio);

    const ctx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

    ctx.textAlign = textAlign;
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${fontStyle ? fontStyle : 400} ${fontSize}px monospace`;
    ctx.scale(scale * pixelRatio, scale * pixelRatio);

    const textMetrics = ctx.measureText('text');
    const transform = ctx.getTransform();
    const lineHeight = textMetrics.fontBoundingBoxDescent + textMetrics.fontBoundingBoxAscent;

    let newX = SMALL_PADDING;
    if (textAlign === 'center') {
      newX = offscreenCanvas.width / transform.a / initialPixelRatio;
    }
    if (textAlign === 'right') {
      newX = offscreenCanvas.width / transform.a - SMALL_PADDING;
    }

    let newY = lineHeight;
    for (const fragment of fragments) {
      if (fragment === '') {
        newY += lineHeight;
      } else {
        ctx.fillText(fragment, newX, newY);
        newY += lineHeight;
      }
    }

    this.ctx.drawImage(offscreenCanvas, x, y, width, height);

    return offscreenCanvas;
  }
}
