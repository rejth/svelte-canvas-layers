import type { Bounds } from 'core/interfaces';
import { COLORS } from 'client/constants';

export const enum Tools {
  NOTE = 'NOTE',
  TEXT = 'TEXT',
  PAN = 'PAN',
  SELECT = 'SELECT',
  CONNECT = 'CONNECT',
  DELETE = 'DELETE',
}

export type Tool = keyof typeof Tools;
export type ShapeType = 'NOTE' | 'TEXT';

export type ShapeConfig = {
  uuid: string;
  type: ShapeType;
  initialBounds: Bounds;
  color: COLORS;
  isSelected: boolean;
};
