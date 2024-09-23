export type Tool = keyof typeof Tools;

export type ShapeType = 'NOTE' | 'TEXT';
export type ServiceTool = 'PAN' | 'SELECT';

export const enum Tools {
  NOTE = 'NOTE',
  TEXT = 'TEXT',
  PAN = 'PAN',
  SELECT = 'SELECT',
}
