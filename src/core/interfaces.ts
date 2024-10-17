import type { BBox } from 'rbush';
import type { createEventDispatcher } from 'svelte';
import type { RenderManager } from 'core/services';

export type AppContext = {
  renderManager: RenderManager;
};

export type CanvasType = HTMLCanvasElement | OffscreenCanvas;
export type CanvasContextType = CanvasRenderingContext2D | HitCanvasRenderingContext2D;

export type LayerId = number;
export type Point = Pick<DOMRect, 'x' | 'y'>;
export type Dimension = Pick<DOMRect, 'width' | 'height'>;
export type RectPosition = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>;
export type RectDimension = Point & Dimension;

export interface LayerBBox extends BBox {
  layerId: LayerId;
}

export type PixelRatio = number;
export type Bounds = { x0: number; y0: number; x1: number; y1: number };
export type RGB = [number, number, number];

export interface HitCanvasRenderingContext2D extends Omit<CanvasRenderingContext2D, 'canvas'> {
  getLayerIdAt: (x: number, y: number) => number;
  setActiveLayerId: (id: LayerId) => void;
}

export type CanvasOptions = {
  initialPixelRatio: PixelRatio;
  pixelRatio: PixelRatio;
  width: number;
  height: number;
};

export type RenderProps = {
  context: CanvasContextType;
  options: CanvasOptions;
};

export type RenderManagerOptions = {
  useLayerEvents: boolean;
};

export interface Render {
  (data: RenderProps): void;
}

export interface RegisteredLayerMetadata {
  render: Render;
  dispatcher?: LayerEventDispatcher;
  bounds?: Bounds;
}

export interface RegisterLayer {
  (data: RegisteredLayerMetadata): void;
}

export type OriginalEvent = MouseEvent | TouchEvent;

export type ResizeEvent = {
  resize: {
    width: number;
    height: number;
    pixelRatio: PixelRatio;
  };
};

export type CanvasEvents =
  | 'click'
  | 'contextmenu'
  | 'wheel'
  | 'mousedown'
  | 'mousemove'
  | 'mouseup'
  | 'mouseenter'
  | 'mouseleave'
  | 'touchstart'
  | 'touchmove'
  | 'touchend'
  | 'touchcancel'
  | 'pointerdown'
  | 'pointermove'
  | 'pointerup'
  | 'pointercancel'
  | 'pointerenter'
  | 'pointerleave';

export type LayerEvents = Record<CanvasEvents, LayerEventDetails>;
export type LayerEventDispatcher = ReturnType<typeof createEventDispatcher<LayerEvents>>;
export type LayerEventDetails = Point & { originalEvent: OriginalEvent };
