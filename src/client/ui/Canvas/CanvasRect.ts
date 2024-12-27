import type { COLORS } from 'client/shared/constants';
import type { CanvasText } from 'client/ui/Canvas/CanvasText';
import {
  BaseCanvasEntity,
  CanvasEntityType,
  type BaseCanvasEntityDrawOptions,
} from 'client/ui/Canvas/BaseCanvasEntity';

export interface RectDrawOptions extends BaseCanvasEntityDrawOptions {
  color: COLORS;
  shadowColor: string;
  shadowOffsetY: number;
  shadowOffsetX: number;
  shadowBlur: number;
  editor?: CanvasText;
}

export class CanvasRect extends BaseCanvasEntity<RectDrawOptions> {
  constructor(options: RectDrawOptions) {
    super(options);
    this.setType(CanvasEntityType.RECT);
  }
}
