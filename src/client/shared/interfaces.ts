import type { Bounds } from 'core/interfaces';
import { COLOR_LIST, COLORS, FONT_SIZES } from 'client/shared/constants';

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

// TODO: rename to Entity
export type ShapeConfig = {
  uuid: string;
  type: ShapeType;
  initialBounds: Bounds;
  color: COLORS;
  isSelected: boolean;
  shadowColor?: string;
  shadowOffsetY?: number;
  shadowOffsetX?: number;
  shadowBlur?: number;
};

export interface DoubleClickData {
  x: number;
  y: number;
  layerWidth: number;
  layerHeight: number;
}

export type ColorId = keyof typeof COLOR_LIST;

export interface Color {
  value: string;
  label: string;
}

export type FontSizeId = keyof typeof FONT_SIZES;

export interface FontSize {
  value: string;
  label: string;
}
