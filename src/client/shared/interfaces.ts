import type { Point } from 'core/interfaces';
import { TextAlign } from 'client/shared/constants';

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
  font: string;
  fontSize: number;
  textAlign: TextAlign;
  isEditable: boolean;
}

export interface Color {
  value: string;
  label: string;
}

export interface Font {
  value: string;
  label: string;
}
