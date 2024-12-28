import type { Bounds, CanvasContextType, LayerEventDetails, Point } from 'core/interfaces';
import { type LayerManager, type Renderer } from 'core/services';

export class Viewport {
  ctx: CanvasContextType | null;
  renderer: Renderer | null;
  layerManager: LayerManager | null;

  currentTransformedCursor: Point;
  currentPosition: Point;
  dragStartPosition: Point;
  isDragging = false;

  constructor(layerManager: LayerManager) {
    this.ctx = null;
    this.layerManager = layerManager;
    this.renderer = layerManager.getRenderer();

    this.dragStartPosition = { x: 0, y: 0 };
    this.currentTransformedCursor = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleWheelChange = this.handleWheelChange.bind(this);
  }

  init(context: CanvasContextType | null) {
    this.ctx = context;
  }

  handleMouseDown(e: MouseEvent) {
    if (!this.renderer) return;
    this.isDragging = true;
    this.dragStartPosition = this.renderer.getTransformedPoint(e.pageX, e.pageY);
  }

  handleMouseUp(_e: MouseEvent) {
    this.isDragging = false;
  }

  handleMouseMove(e: MouseEvent) {
    if (!this.ctx || !this.renderer || !this.isDragging) return;

    this.currentTransformedCursor = this.renderer.getTransformedPoint(e.pageX, e.pageY);

    this.ctx.translate(
      this.currentTransformedCursor.x - this.dragStartPosition.x,
      this.currentTransformedCursor.y - this.dragStartPosition.y,
    );

    this.layerManager?.redraw();
  }

  handleLayerDoubleClick(e: LayerEventDetails, layerBounds: Bounds): Point {
    if (!this.renderer) return { x: e.x, y: e.y };

    const { pageX, pageY } = e.originalEvent as MouseEvent;
    const transformedPoint = this.renderer.getTransformedPoint(pageX, pageY);
    const transform = this.renderer.getTransform();

    if (!transform) return { x: e.x, y: e.y };

    const { scaleX, initialScale } = transform;
    const scale = scaleX !== initialScale ? scaleX / initialScale : 1;

    const x = pageX + (layerBounds.x0 - transformedPoint.x) * scale;
    const y = pageY + (layerBounds.y0 - transformedPoint.y) * scale;

    return { x, y };
  }

  handleWheelChange(e: WheelEvent) {
    if (!this.ctx || !this.renderer) return;

    this.dragStartPosition = this.renderer.getTransformedPoint(e.pageX, e.pageY);
    this.currentPosition = { x: e.pageX, y: e.pageY };

    if (e.ctrlKey) {
      this.#zoomCanvas(e);
    } else {
      this.#moveCanvas(e);
    }
  }

  #moveCanvas(e: WheelEvent) {
    if (!this.ctx || !this.renderer) return;

    this.currentPosition = {
      x: this.currentPosition.x + e.deltaX * -1,
      y: this.currentPosition.y + e.deltaY * -1,
    };

    this.currentTransformedCursor = this.renderer.getTransformedPoint(
      this.currentPosition.x,
      this.currentPosition.y,
    );

    this.ctx.translate(
      this.currentTransformedCursor.x - this.dragStartPosition.x,
      this.currentTransformedCursor.y - this.dragStartPosition.y,
    );

    this.layerManager?.redraw();
  }

  #zoomCanvas(e: WheelEvent) {
    if (!this.ctx || !this.renderer) return;

    this.currentPosition = {
      x: this.currentPosition.x + e.deltaX * -1,
      y: this.currentPosition.y + e.deltaY * -1,
    };

    this.currentTransformedCursor = this.renderer.getTransformedPoint(e.clientX, e.clientY);

    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    const transform = this.renderer.getTransform();

    if (!transform) return;

    const nextZoomPercentage = this.#canvasScaleToPercentage(transform.scaleX * zoom);
    const scale = this.#zoomPercentageToScale(nextZoomPercentage) / transform.scaleX;

    if (nextZoomPercentage <= 200 && nextZoomPercentage >= 10) {
      this.ctx.translate(this.currentTransformedCursor.x, this.currentTransformedCursor.y);
      this.renderer.scale(scale, scale);
      this.ctx.translate(-this.currentTransformedCursor.x, -this.currentTransformedCursor.y);
      this.layerManager?.redraw();
    }
  }

  #canvasScaleToPercentage(scale: number): number {
    return Math.max(10, Math.min(Math.ceil((scale * 200) / 10), 200));
  }

  #zoomPercentageToScale(percentage: number): number {
    return (percentage * 10) / 200;
  }
}
