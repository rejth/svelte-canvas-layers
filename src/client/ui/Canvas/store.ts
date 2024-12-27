import { get, type Writable, writable } from 'svelte/store';

import type { Point } from 'core/interfaces';
import { geometryManager } from 'core/services';

import { Tools, type ShapeType, type TextEditorData, type Tool } from 'client/shared/interfaces';
import { toolbarStore } from 'client/ui/Toolbar/store';
import { connectionStore } from 'client/ui/Connection/store';
import { COLORS, DEFAULT_RECT_SIZE } from 'client/shared/constants';

import { type BaseCanvasEntity, type BaseCanvasEntityDrawOptions } from './BaseCanvasEntity';
import { CanvasText, type TextDrawOptions } from './CanvasText';
import { CanvasRect, type RectDrawOptions } from './CanvasRect';

export type Shapes<T extends BaseCanvasEntityDrawOptions> = Map<string, BaseCanvasEntity<T>>;
export type DrawOptions = RectDrawOptions | TextDrawOptions;

class CanvasStore {
  shapes: Writable<Shapes<DrawOptions>> = writable(new Map());
  selectedShapes: Writable<Shapes<DrawOptions>> = writable(new Map());
  textEditor: Writable<TextEditorData | null> = writable(null);
  selectionPath: Writable<Point[]> = writable([]);
  isSelected: Writable<boolean> = writable(false);

  #shapeType: ShapeType | null = null;
  #tool: Tool | null = Tools.NOTE;

  constructor() {
    toolbarStore.tool.subscribe((value) => (this.#tool = value));
    toolbarStore.shapeType.subscribe((value) => (this.#shapeType = value));
  }

  #createShape(type: ShapeType, { x, y }: Point): BaseCanvasEntity<DrawOptions> | null {
    if (type === Tools.NOTE) {
      return this.createSticker({ x, y });
    }
    if (type === Tools.TEXT) {
      return this.createText({ x, y });
    }
    return null;
  }

  getShape(uuid: string): BaseCanvasEntity<DrawOptions> | null {
    if (!uuid) return null;
    return get(this.shapes).get(uuid) || null;
  }

  #removeSelectedShape(shapes: Shapes<DrawOptions>): Shapes<DrawOptions> {
    const selected = get(this.selectedShapes);

    for (const [uuid] of selected) {
      if (selected.has(uuid)) {
        shapes.delete(uuid);
        connectionStore.removeConnectionsByBoxId(uuid);
      }
    }

    return shapes;
  }

  addShape(e: MouseEvent) {
    if (!this.#shapeType) return;

    const position = geometryManager.calculatePosition(e);
    const shape = this.#createShape(this.#shapeType, position);
    if (!shape) return;

    this.shapes.update((shapes) => shapes.set(shape.id, shape));
    this.resetToolbar();
  }

  updateShape(uuid: string, data: Partial<DrawOptions>) {
    this.shapes.update((shapes) => {
      const shape = shapes.get(uuid);
      if (!shape) return shapes;

      shape.setOptions(data);
      return shapes.set(uuid, shape);
    });
  }

  deleteShape() {
    this.shapes.update((shapes) => this.#removeSelectedShape(shapes));
    this.selectedShapes.update((shapes) => this.#removeSelectedShape(shapes));
    this.resetToolbar();
  }

  selectShape(uuid: string) {
    const shape = get(this.shapes).get(uuid) || null;
    if (!shape) return;

    shape.isSelected = true;
    this.selectedShapes.update((selected) => selected.set(uuid, shape));
    this.shapes.update((shapes) => shapes.set(uuid, shape));
  }

  deselectShape(uuid: string) {
    this.selectedShapes.update((selected) => {
      selected.delete(uuid);
      return selected;
    });

    const shape = get(this.shapes).get(uuid) || null;
    if (!shape) return;

    shape.isSelected = false;
    this.shapes.update((shapes) => shapes.set(uuid, shape));
  }

  setIsSelected(value: boolean) {
    this.isSelected.set(value);
  }

  dragSelection(e: MouseEvent, rect: DOMRect) {
    if (this.#tool !== Tools.SELECT) return;
    if (get(this.isSelected)) return;

    const isPointInsideCanvas = geometryManager.isPointInsideRect(e, rect);

    if (isPointInsideCanvas) {
      const point = geometryManager.calculatePosition(e);
      this.selectionPath.update((path) => [...path, point]);
    }
  }

  resetToolbar() {
    toolbarStore.changeTool(Tools.SELECT);
    toolbarStore.shapeType.set(null);
  }

  resetSelectedShapes() {
    const shapes = get(this.shapes);

    for (const shape of shapes.values()) {
      shape.isSelected = false;
      this.shapes.update((shapes) => shapes.set(shape.id, shape));
    }

    this.selectedShapes.set(new Map());
  }

  resetSelection() {
    this.selectionPath.set([]);
  }

  createSticker({ x, y }: Point): CanvasRect {
    return new CanvasRect({
      x,
      y,
      width: DEFAULT_RECT_SIZE,
      height: DEFAULT_RECT_SIZE,
      color: COLORS.STICKER_YELLOW,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffsetY: 10,
      shadowOffsetX: 3,
      shadowBlur: 5,
      scale: 1,
    });
  }

  saveText() {
    const textEditor = get(this.textEditor);
    if (!textEditor) return;

    const { anchorId, text, fontSize, textAlign, bold, italic, isEditable } = textEditor;
    const anchorEntity = get(this.shapes).get(anchorId);
    if (!anchorEntity || !isEditable) return;

    let fontStyle = '';
    if (italic) fontStyle = `${fontStyle} italic`;
    if (bold) fontStyle = `${fontStyle} bold`;

    const textEntity = (anchorEntity.getOptions() as RectDrawOptions)?.editor;
    if (textEntity && !(textEntity instanceof CanvasText)) return;

    const options = textEntity?.getOptions();

    if (text && !textEntity) {
      const [x, y] = anchorEntity.getXY();
      this.createText({ x, y });
    } else if (textEntity && (text || text !== options?.text)) {
      textEntity.setText(text, fontSize, fontStyle, textAlign);
    }

    this.resetTextEditor();
  }

  createText({ x, y }: Point): CanvasText | null {
    const textEditor = get(this.textEditor);
    if (!textEditor) return null;

    const { anchorId, text, fontSize, textAlign, bold, italic, isEditable } = textEditor;
    const anchorEntity = get(this.shapes).get(anchorId);
    if (!anchorEntity || !isEditable) return null;

    let fontStyle = '';
    if (italic) fontStyle = `${fontStyle} italic`;
    if (bold) fontStyle = `${fontStyle} bold`;

    const canvasText = new CanvasText({
      x,
      y,
      width: DEFAULT_RECT_SIZE,
      height: DEFAULT_RECT_SIZE,
      text,
      fontSize,
      fontStyle,
      textAlign,
      scale: anchorEntity.getScale(),
      canvasScale: window.devicePixelRatio,
    });

    this.shapes.update((shapes) => {
      const shape = shapes.get(anchorEntity.id);
      if (!shape) return shapes;
      shape.setOptions({ editor: canvasText });
      return shapes.set(anchorEntity.id, shape);
    });

    return canvasText;
  }

  updateTextEditor(data: Partial<TextEditorData>) {
    this.textEditor.update((state) => ({
      ...state,
      ...(data as TextEditorData),
    }));
  }

  resetTextEditor() {
    this.textEditor.set(null);
  }
}

export const canvasStore = new CanvasStore();
