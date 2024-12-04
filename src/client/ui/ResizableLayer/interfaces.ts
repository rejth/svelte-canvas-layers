import type { Bounds, LayerEventDetails } from 'core/interfaces';

export const enum ResizableLayerEvent {
  ACTIVE = 'layer.active',
  LEAVE = 'layer.leave',
  MOVE = 'layer.move',
  TOUCH = 'layer.touch',
  ENTER = 'layer.enter',
  DOUBLE_CLICK = 'layer.dblclick',
}

interface EventDetails {
  bounds: Bounds;
  data?: LayerEventDetails;
}

export type ResizableLayerEventDetails = EventDetails | undefined;

export type ResizableLayerEventDispatcher = Record<ResizableLayerEvent, ResizableLayerEventDetails>;
