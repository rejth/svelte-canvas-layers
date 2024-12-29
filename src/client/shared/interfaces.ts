import type { Point } from 'core/interfaces';
import { COLOR_LIST, FONT_SIZES } from 'client/shared/constants';

export const enum Tools {
  NOTE = 'NOTE',
  AREA = 'AREA',
  TEXT = 'TEXT',
  PAN = 'PAN',
  SELECT = 'SELECT',
  CONNECT = 'CONNECT',
  DELETE = 'DELETE',
}

export type Tool = keyof typeof Tools;
export type ShapeType = 'NOTE' | 'AREA' | 'TEXT';

export interface TextEditorData {
  anchorId: string;
  position: Point;
  text: string;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  textAlign: CanvasTextAlign;
  isEditable: boolean;
}

// TODO: Get the colors values from the constants as a type
export type ColorId = (typeof COLOR_LIST)[number]['value'];

export interface Color {
  value: string;
  label: string;
}

// TODO: Get the font sizes values from the constants as a type
export type FontSizeId = (typeof FONT_SIZES)[number]['value'];

export interface FontSize {
  value: string;
  label: string;
}
