export const enum Tools {
  NOTE = 'NOTE',
  TEXT = 'TEXT',
  PAN = 'PAN',
  SELECT = 'SELECT',
}

export type Tool = keyof typeof Tools;
export type ShapeType = 'NOTE' | 'TEXT';
export type ToolbarTool = 'PAN' | 'SELECT';

export type ShapeConfig = {
  uuid: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
};
