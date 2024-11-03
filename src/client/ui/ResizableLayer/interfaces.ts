import type { Bounds } from 'core/interfaces';

export const enum LayerEvent {
  ACTIVE = 'layer.active',
  LEAVE = 'layer.leave',
  MOVE = 'layer.move',
  TOUCH = 'layer.touch',
  ENTER = 'layer.enter',
}

export type LayerEventDetails = { bounds: Bounds } | undefined;
