import type { CanvasContextType, Point } from 'core/interfaces';
import type { Renderer } from './Renderer';
import type { RenderManager } from './RenderManager';

export class Viewport {
  context: CanvasContextType | null;
  renderer: Renderer | null;
  renderManager: RenderManager | null;

  currentTransformedCursor: Point;
  currentPosition: Point;
  dragStartPosition: Point;
  isDragging = false;

  constructor(renderManager: RenderManager) {
    this.context = null;
    this.renderManager = renderManager;
    this.renderer = renderManager.getRenderer();

    this.dragStartPosition = { x: 0, y: 0 };
    this.currentTransformedCursor = { x: 0, y: 0 };
    this.currentPosition = { x: 0, y: 0 };

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  init(context: CanvasContextType | null) {
    this.context = context;
  }

  onMouseDown(e: MouseEvent) {
    this.isDragging = true;
    this.dragStartPosition = this.renderer!.getTransformedPoint(e.pageX, e.pageY);
  }

  onMouseUp(_e: MouseEvent) {
    this.isDragging = false;
  }

  onMouseMove(e: MouseEvent) {
    if (!this.context || !this.isDragging) return;

    const renderManager = this.renderManager!;
    const renderer = this.renderer!;

    this.currentTransformedCursor = renderer.getTransformedPoint(e.pageX, e.pageY);

    this.context.translate(
      this.currentTransformedCursor.x - this.dragStartPosition.x,
      this.currentTransformedCursor.y - this.dragStartPosition.y,
    );

    renderManager.searchVisibleLayers();
  }

  onWheel(e: WheelEvent) {
    if (!this.context) return;

    const renderer = this.renderer!;

    this.dragStartPosition = renderer.getTransformedPoint(e.pageX, e.pageY);
    this.currentPosition = { x: e.pageX, y: e.pageY };

    if (e.ctrlKey) {
      this.#zoom(e);
    } else {
      this.#move(e);
    }
  }

  #move(e: WheelEvent) {
    if (!this.context) return;

    const renderManager = this.renderManager!;
    const renderer = this.renderer!;

    this.currentPosition = {
      x: this.currentPosition.x + e.deltaX * -1,
      y: this.currentPosition.y + e.deltaY * -1,
    };

    this.currentTransformedCursor = renderer.getTransformedPoint(
      this.currentPosition.x,
      this.currentPosition.y,
    );
    this.context.translate(
      this.currentTransformedCursor.x - this.dragStartPosition.x,
      this.currentTransformedCursor.y - this.dragStartPosition.y,
    );

    renderManager.searchVisibleLayers();
  }

  #zoom(e: WheelEvent) {
    if (!this.context) return;

    const renderManager = this.renderManager!;
    const renderer = this.renderer!;

    this.currentPosition = {
      x: this.currentPosition.x + e.deltaX * -1,
      y: this.currentPosition.y + e.deltaY * -1,
    };

    this.currentTransformedCursor = renderer.getTransformedPoint(e.clientX, e.clientY);

    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    const transform = renderer.getTransform();

    if (!transform) return;

    const nextZoomPercentage = this.#canvasScaleToPercentage(transform.scaleX * zoom);
    const scale = this.#zoomPercentageToScale(nextZoomPercentage) / transform.scaleX;

    if (nextZoomPercentage <= 200 && nextZoomPercentage >= 10) {
      this.context.translate(this.currentTransformedCursor.x, this.currentTransformedCursor.y);
      renderer.scale(scale, scale);
      this.context.translate(-this.currentTransformedCursor.x, -this.currentTransformedCursor.y);
      renderManager.searchVisibleLayers();
    }
  }

  #canvasScaleToPercentage(scale: number): number {
    return Math.max(10, Math.min(Math.ceil((scale * 200) / 10), 200));
  }

  #zoomPercentageToScale(percentage: number): number {
    return (percentage * 10) / 200;
  }
}
