import type { COLORS } from 'client/shared/constants';
import type { CanvasText } from 'client/ui/Canvas/CanvasText';
import type { ShapeType } from 'client/shared/interfaces';
import type { BaseCanvasEntityDrawOptions } from 'client/ui/Canvas/BaseCanvasEntity';
import { BaseCanvasEntity, CanvasEntityType } from 'client/ui/Canvas/BaseCanvasEntity';
export interface RectDrawOptions extends BaseCanvasEntityDrawOptions {
  color: COLORS;
  shadowColor?: string;
  shadowOffsetY?: number;
  shadowOffsetX?: number;
  shadowBlur?: number;
  editor?: CanvasText;
}

export class CanvasRect extends BaseCanvasEntity<RectDrawOptions> {
  constructor(shapeType: ShapeType, options: RectDrawOptions) {
    super(options);
    this.setType(CanvasEntityType.RECT);
    this.setShapeType(shapeType);
  }
}
