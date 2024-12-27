import type { CanvasContextType, CanvasOptions, Point } from 'core/interfaces';
import { geometryManager } from 'core/services';

import { SMALL_PADDING } from 'client/shared/constants';

interface RectDrawOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  shadowColor?: string;
  shadowOffsetY?: number;
  shadowOffsetX?: number;
  shadowBlur?: number;
}

interface RoundedRectDrawOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  color: string;
  shadowColor?: string;
  shadowOffsetY?: number;
  shadowOffsetX?: number;
  shadowBlur?: number;
}

interface StrokeDrawOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  lineWidth: number;
  color: string;
}

interface CircleDrawOptions {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface QuadraticCurveDrawOptions {
  start: Point;
  control: Point;
  end: Point;
  color: string;
  lineWidth: number;
}

interface BezierCurveDrawOptions {
  start: Point;
  cp1: Point;
  cp2: Point;
  end: Point;
  color: string;
  lineWidth: number;
}

interface ImageDrawOptions {
  image: CanvasImageSource;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextDrawOptions {
  fontSize: number;
  fontStyle: string;
  textAlign: CanvasTextAlign;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export class Drawer {
  ctx: CanvasContextType;

  constructor(context: CanvasContextType) {
    this.ctx = context;
  }

  fillRect(options: RectDrawOptions) {
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
    const { x, y, width, height, lineWidth, color } = options;

    this.ctx.save();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.restore();
  }

  fillCircle(options: CircleDrawOptions) {
    const { x, y, radius, color } = options;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = color;
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  strokeQuadraticCurve(options: QuadraticCurveDrawOptions) {
    const { start, control, end, color, lineWidth } = options;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  strokeBezierCurve(options: BezierCurveDrawOptions) {
    const { start, cp1, cp2, end, color, lineWidth } = options;

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  drawImage(options: ImageDrawOptions) {
    if (!options.image) return;

    this.ctx.save();
    this.ctx.drawImage(options.image, options.x, options.y, options.width, options.height);
    this.ctx.restore();
  }

  renderTextSnapshot(
    fragments: string[],
    textOptions: TextDrawOptions,
    canvasOptions: CanvasOptions,
  ) {
    const { fontSize, fontStyle, textAlign, x, y, width, height, scale = 1 } = textOptions;
    const { pixelRatio, initialPixelRatio } = canvasOptions;

    const offscreenCanvas = new OffscreenCanvas(width, width);
    offscreenCanvas.width = Math.floor(width * pixelRatio);
    offscreenCanvas.height = Math.floor(height * pixelRatio);

    const context = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;

    context.textAlign = textAlign;
    context.textBaseline = 'alphabetic';
    context.font = `${fontStyle ? fontStyle : 400} ${fontSize}px monospace`;
    context.scale(scale * pixelRatio, scale * pixelRatio);

    const textMetrics = context.measureText('text');
    const transform = context.getTransform();
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
        context.fillText(fragment, newX, newY);
        newY += lineHeight;
      }
    }

    this.ctx.drawImage(offscreenCanvas, x, y, width, height);

    return offscreenCanvas;
  }
}
