import {
  type HitCanvasRenderingContext2D,
  type OriginalEvent,
  type Render,
  type LayerId,
  type LayerEventDetails,
  type CanvasEvents,
  type LayerEventDispatcher,
  type RegisteredLayerMetadata,
  type CanvasContextType,
} from './types';
import { GeometryManager } from './';
import type { Renderer } from './Renderer';

export class RenderManager {
  renderer: Renderer;
  geometryManager: GeometryManager;

  currentLayerId: LayerId;
  activeLayerId: LayerId;
  layerSequence: LayerId[];
  layerContainer: HTMLDivElement | null;
  layerObserver: MutationObserver | null;

  drawers: Map<LayerId, Render>;
  dispatchers: Map<LayerId, LayerEventDispatcher>;
  needsRedraw: boolean;

  animationFrame?: number;
  layerChangeCallback?: (layerId: LayerId) => void;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
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

  getContext(): CanvasContextType | null {
    return this.renderer.getContext();
  }

  getRenderer(): Renderer {
    return this.renderer;
  }

  init(layerContainer: HTMLDivElement) {
    this.layerContainer = layerContainer;
    this.observeLayerSequence();
    this.startRenderLoop();
  }

  startRenderLoop() {
    this.render();
    this.animationFrame = requestAnimationFrame(() => this.startRenderLoop());
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

    const context = this.renderer.getContext()!;
    const options = this.renderer.getCanvasOptions();
    const useLayerEvents = this.renderer.useLayerEvents!;

    if (!useLayerEvents) {
      context.save();
    }

    context.setTransform(options.pixelRatio, 0, 0, options.pixelRatio, 0, 0);
    this.renderer.clearRectSync(this.renderer.getScaledArea());

    if (!useLayerEvents) {
      context.restore();
    }

    for (const layerId of this.layerSequence) {
      this.layerChangeCallback?.(layerId);
      this.drawers.get(layerId)?.({ context, options });
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
    const context = this.renderer.getContext();
    const point = this.geometryManager.calculatePosition(e, this.renderer.pixelRatio);
    const layerId = (<HitCanvasRenderingContext2D>context).getLayerIdAt(point.x, point.y);

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
    cancelAnimationFrame(this.animationFrame!);
  }
}
