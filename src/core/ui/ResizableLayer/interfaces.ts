import type { Bounds } from 'core/interfaces';

export const enum LayerEvent {
  ACTIVE = 'layer.active',
  LEAVE = 'layer.leave',
  MOVE = 'layer.move',
  TOUCH = 'layer.touch',
}

export type LayerEventDetails = { bounds: Bounds } | undefined;
