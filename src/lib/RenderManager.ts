import {
  type HitCanvasRenderingContext2D,
  type OriginalEvent,
  type Render,
  type LayerId,
  type LayerEventDetails,
  type CanvasEvents,
  type LayerEventDispatcher,
  type CanvasContextType,
  type RegisteredLayerMetadata,
} from './types';
import { GeometryManager } from './';

export class RenderManager {
  canvas: HTMLCanvasElement | null;
  context: CanvasContextType | null;
  geometryManager: GeometryManager;

  currentLayerId: LayerId;
  activeLayerId: LayerId;
  layerSequence: LayerId[];
  layerContainer: HTMLDivElement | null;
  layerObserver: MutationObserver | null;

  drawers: Map<LayerId, Render>;
  dispatchers: Map<LayerId, LayerEventDispatcher>;
  needsRedraw: boolean;

  width?: number;
  height?: number;
  pixelRatio?: number;
  frame?: number;
  layerChangeCallback?: (layerId: LayerId) => void;

  constructor() {
    this.canvas = null;
    this.context = null;
    this.geometryManager = new GeometryManager();

    this.currentLayerId = 1;
    this.activeLayerId = 0;
    this.layerSequence = [];
    this.layerContainer = null;
    this.layerObserver = null;

    this.drawers = new Map();
    this.dispatchers = new Map();
    this.needsRedraw = true;

    this.render = this.render.bind(this);
    this.redraw = this.redraw.bind(this);
  }

  init(context: CanvasContextType | null, layerContainer: HTMLDivElement) {
    this.context = context;
    this.layerContainer = layerContainer;

    this.observeLayerSequence();
    this.startRenderLoop();
  }

  startRenderLoop() {
    this.render();
    this.frame = requestAnimationFrame(() => this.startRenderLoop());
  }

  observeLayerSequence() {
    this.layerObserver = new MutationObserver(() => this.getLayerSequence());
    this.layerObserver.observe(this.layerContainer!, { childList: true });
    this.getLayerSequence();
  }

  getLayerSequence() {
    const layers = <HTMLElement[]>[...this.layerContainer!.children];
    this.layerSequence = layers.map((layer) => +layer.dataset.layerId!);
    this.redraw();
  }

  register({ render, dispatcher }: RegisteredLayerMetadata) {
    this.addDrawer(this.currentLayerId, render);

    if (dispatcher) {
      this.addDispatcher(this.currentLayerId, dispatcher);
    }

    this.redraw();

    return {
      unregister: () => this.unregister(this.currentLayerId),
      layerId: this.currentLayerId++,
    };
  }

  unregister(layerId: LayerId) {
    this.removeDrawer(layerId);
    this.removeDispatcher(layerId);
    this.redraw();
  }

  addDrawer(layerId: LayerId, render: Render) {
    this.drawers.set(layerId, render);
  }

  addDispatcher(layerId: LayerId, dispatcher: LayerEventDispatcher) {
    this.dispatchers.set(layerId, dispatcher);
  }

  removeDrawer(layerId: LayerId) {
    this.drawers.delete(layerId);
  }

  removeDispatcher(layerId: LayerId) {
    this.dispatchers.delete(layerId);
  }

  /**
   * The main render function which is responsible for drawing, clearing and canvas's transformation matrix adjustment.
   * Renders the canvas only when width, height or pixelRatio change.
   * */
  render() {
    if (!this.needsRedraw) return;

    const context = this.context!;
    const width = this.width!;
    const height = this.height!;
    const scale = this.pixelRatio!;

    context.save();
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);
    context.restore();

    for (const layerId of this.layerSequence) {
      this.layerChangeCallback?.(layerId);
      this.drawers.get(layerId)?.({ context, geometry: this.geometryManager, scale });
    }

    this.needsRedraw = false;
  }

  /**
   * Forces canvas's transformation matrix adjustment to scale drawings according to the new width, height or device's pixel ratio.
   */
  redraw() {
    this.needsRedraw = true;
  }

  /**
   * Handles "mousemove", "pointermove" and "touchstart" events on the canvas to identify the layer.
   * Then re-dispatch the events to the Layer component and sets the active layer.
   */

  findActiveLayer(e: OriginalEvent) {
    const point = this.geometryManager.calculatePosition(e);
    const layerId = (this.context as HitCanvasRenderingContext2D).getLayerIdAt(point.x, point.y);

    if (this.activeLayerId === layerId) return;

    if (e instanceof MouseEvent) {
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerleave', e),
        ...point,
      });
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseleave', e),
        ...point,
      });
    }

    this.activeLayerId = layerId;

    if (e instanceof MouseEvent) {
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new PointerEvent('pointerenter', e),
        ...point,
      });
      this.dispatchLayerEvent(this.activeLayerId, {
        originalEvent: new MouseEvent('mouseenter', e),
        ...point,
      });
    }
  }

  /**
   * Handles events on the canvas and then re-dispatch the events to the corresponding layer
   */
  dispatchEvent(e: OriginalEvent) {
    if (!this.activeLayerId) return;
    const point = this.geometryManager.calculatePosition(e);
    this.dispatchLayerEvent(this.activeLayerId, { originalEvent: e, ...point });
  }

  /**
   * Dispatches events to the Layer component.
   */
  dispatchLayerEvent(layerId: LayerId, details: LayerEventDetails) {
    const dispatch = this.dispatchers.get(layerId);
    dispatch?.(<CanvasEvents>details.originalEvent.type, details);
  }

  onLayerChange(callback: (layerId: LayerId) => void) {
    this.layerChangeCallback = callback;
  }

  destroy() {
    if (typeof window === 'undefined') return;

    this.layerObserver?.disconnect();
    cancelAnimationFrame(this.frame!);
  }
}
