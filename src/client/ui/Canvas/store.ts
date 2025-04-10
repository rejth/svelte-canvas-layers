import { type Writable, get, writable } from 'svelte/store';

import type { Point, RectDimension } from 'core/interfaces';
import { geometryManager } from 'core/services';

import { Tools, ShapeType, type TextEditorData, type Tool } from 'client/shared/interfaces';
import { toolbarStore } from 'client/ui/Toolbar/store';
import { connectionStore } from 'client/ui/Connection/store';
import * as constants from 'client/shared/constants';

import { type BaseCanvasEntity, type BaseCanvasEntityDrawOptions } from './BaseCanvasEntity';
import { CanvasText, type TextDrawOptions } from './CanvasText';
import { CanvasRect, type RectDrawOptions } from './CanvasRect';
import { COLOR_LIST, COLORS } from 'client/shared/constants';

export type Shapes<T extends BaseCanvasEntityDrawOptions> = Map<string, BaseCanvasEntity<T>>;
export type DrawOptions = RectDrawOptions | TextDrawOptions;

class CanvasStore {
  shapes: Writable<Shapes<DrawOptions>> = writable(new Map());
  selectedShapes: Writable<Shapes<DrawOptions>> = writable(new Map());
  textEditor: Writable<TextEditorData | null> = writable(null);
  selectionPath: Writable<Point[]> = writable([]);
  isSelected: Writable<boolean> = writable(false);

  clickOutsideExcludedIds: string[] = [
    'trash',
    'text-editor-menu',
    'text-editor-menu-dropdown',
    'text-editor',
  ];

  #shapeType: ShapeType | null = null;
  #tool: Tool | null = Tools.NOTE;

  constructor() {
    toolbarStore.tool.subscribe((value) => (this.#tool = value));
    toolbarStore.shapeType.subscribe((value) => (this.#shapeType = value));
    this.generateTestShapes();
  }

  generateTestShapes() {
    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const colors = COLOR_LIST.map((color) => color.value);

    for (let i = 0; i < 3000; i++) {
      const position = (i + 1) * 85;
      const initialBounds = { x0: position, y0: position, x1: position + 200, y1: position + 200 };
      const dimensions = geometryManager.getRectDimensionFromBounds(initialBounds);
      const color = colors[random(0, 10)] || COLORS.STICKER_YELLOW;
      const shape = this.#createTestSticker(dimensions, color as COLORS);
      this.shapes.update((shapes) => shapes.set(shape.id, shape));
    }
  }

  #createShape(type: ShapeType, { x, y }: Point): BaseCanvasEntity<DrawOptions> | null {
    if (type === ShapeType.NOTE) {
      return this.createSticker({ x, y });
    }
    if (type === ShapeType.AREA) {
      return this.createTextArea({ x, y });
    }
    if (type === ShapeType.TEXT) {
      return this.createTextBlock({ x, y });
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

  addShape(e: MouseEvent, transformedPoint: Point) {
    if (!this.#shapeType) {
      this.saveAddedShape();
      return;
    }

    const shape = this.#createShape(this.#shapeType, transformedPoint);
    const position = geometryManager.calculatePosition(e);
    if (!shape) return;

    this.initTextEditor(shape.id, position);
    this.shapes.update((shapes) => shapes.set(shape.id, shape));
    this.resetToolbar();
  }

  addShapes(shapes: Shapes<DrawOptions>) {
    for (const shape of shapes.values()) {
      this.shapes.update((shapes) => shapes.set(shape.id, shape));
    }
    this.resetToolbar();
  }

  saveAddedShape() {
    this.saveText();
    this.resetTextEditor();
    if (!get(this.selectionPath).length) {
      this.resetSelectedShapes();
    }
  }

  updateShape(entityId: string, data: Partial<DrawOptions>) {
    this.shapes.update((shapes) => {
      const shape = shapes.get(entityId);
      if (!shape) return shapes;

      shape.setOptions(data);
      return shapes.set(entityId, shape);
    });
  }

  deleteShapes() {
    this.shapes.update((shapes) => this.#removeSelectedShape(shapes));
    this.selectedShapes.update((shapes) => this.#removeSelectedShape(shapes));
    this.resetToolbar();
  }

  selectShape(entityId: string) {
    if (get(this.selectedShapes).has(entityId)) return;

    const shape = get(this.shapes).get(entityId) || null;
    if (!shape) return;

    shape.isSelected = true;
    this.selectedShapes.update((selected) => selected.set(entityId, shape));
    this.shapes.update((shapes) => shapes.set(entityId, shape));
  }

  selectAllShapes() {
    const shapes = get(this.shapes);

    for (const shape of shapes.values()) {
      shape.isSelected = true;
      this.shapes.update((shapes) => shapes.set(shape.id, shape));
      this.selectedShapes.update((selected) => selected.set(shape.id, shape));
    }
  }

  deselectShape(entityId: string) {
    if (!get(this.selectedShapes).has(entityId)) return;

    this.selectedShapes.update((selected) => {
      selected.delete(entityId);
      return selected;
    });

    const shape = get(this.shapes).get(entityId) || null;
    if (!shape) return;

    shape.isSelected = false;
    this.shapes.update((shapes) => shapes.set(entityId, shape));
  }

  setIsSelected(value: boolean) {
    this.isSelected.set(value);
  }

  dragSelection(e: MouseEvent, rect: DOMRect, transformedPoint: Point) {
    if (this.#tool !== Tools.SELECT) return;
    if (get(this.isSelected)) return;

    const isPointInsideCanvas = geometryManager.isPointInsideRect(e, rect);

    if (isPointInsideCanvas) {
      this.selectionPath.update((path) => [...path, transformedPoint]);
    }
  }

  resetToolbar() {
    toolbarStore.changeTool(Tools.SELECT);
    toolbarStore.shapeType.set(null);
  }

  resetSelectedShapes() {
    if (!get(this.selectedShapes).size) return;

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

  #createTestSticker(dimensions: RectDimension, color: COLORS): CanvasRect {
    return new CanvasRect(ShapeType.NOTE, {
      x: dimensions.x,
      y: dimensions.y,
      width: dimensions.width,
      height: dimensions.height,
      color,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffsetY: 10,
      shadowOffsetX: 3,
      shadowBlur: 5,
      scale: 1,
    });
  }

  createSticker({ x, y }: Point): CanvasRect {
    return new CanvasRect(ShapeType.NOTE, {
      x,
      y,
      width: constants.DEFAULT_RECT_SIZE,
      height: constants.DEFAULT_RECT_SIZE,
      color: constants.COLORS.STICKER_YELLOW,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffsetY: 10,
      shadowOffsetX: 3,
      shadowBlur: 5,
      scale: 1,
    });
  }

  createTextArea({ x, y }: Point): CanvasRect {
    return new CanvasRect(ShapeType.AREA, {
      x,
      y,
      width: constants.DEFAULT_TEXT_AREA_WIDTH,
      height: constants.DEFAULT_TEXT_AREA_HEIGHT,
      color: constants.COLORS.TEXT_AREA,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffsetY: 10,
      shadowOffsetX: 3,
      shadowBlur: 5,
      scale: 1,
    });
  }

  createTextBlock({ x, y }: Point): CanvasRect {
    return new CanvasRect(ShapeType.TEXT, {
      x,
      y,
      width: constants.DEFAULT_TEXT_BLOCK_WIDTH,
      height: constants.DEFAULT_TEXT_BLOCK_HEIGHT,
      color: constants.COLORS.TRANSPARENT,
      scale: 1,
    });
  }

  saveText() {
    const textEditor = get(this.textEditor);
    if (!textEditor) return;

    const anchorEntity = get(this.shapes).get(textEditor.anchorId);
    if (!anchorEntity || !textEditor.isEditable) return;

    const textEntity = (anchorEntity.getOptions() as RectDrawOptions)?.editor;
    if (textEntity && !(textEntity instanceof CanvasText)) return;

    const { text, font, fontSize, textAlign, bold, italic, underline } = textEditor;
    const options = textEntity?.getOptions();

    if (text && !textEntity) {
      const [x, y] = anchorEntity.getXY();
      this.createText({ x, y });
    } else if (textEntity && (text || text !== options?.text)) {
      const { TextDecoration } = constants;
      const textDecoration = underline ? TextDecoration.UNDERLINE : TextDecoration.NONE;
      let fontStyle = '';

      if (italic) fontStyle = `${fontStyle} italic`;
      if (bold) fontStyle = `${fontStyle} bold`;

      textEntity.setText(text, font, fontSize, fontStyle, textAlign, textDecoration);
    }

    this.resetTextEditor();
  }

  createText({ x, y }: Point): CanvasText | null {
    const textEditor = get(this.textEditor);
    if (!textEditor) return null;

    const anchorEntity = get(this.shapes).get(textEditor.anchorId);
    if (!anchorEntity || !textEditor.isEditable) return null;

    const { TextDecoration } = constants;
    const { width, height } = anchorEntity.getOptions();
    const { text, font, fontSize, textAlign, bold, italic, underline } = textEditor;

    let fontStyle = '';
    if (italic) fontStyle = `${fontStyle} italic`;
    if (bold) fontStyle = `${fontStyle} bold`;

    const canvasText = new CanvasText({
      x,
      y,
      width,
      height,
      text,
      font,
      fontSize,
      fontStyle,
      textAlign,
      textDecoration: underline ? TextDecoration.UNDERLINE : TextDecoration.NONE,
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

  initTextEditor(entityId: string, position: Point) {
    const shape = get(this.shapes).get(entityId) as BaseCanvasEntity<RectDrawOptions>;
    const editorData = shape?.getOptions()?.editor?.getOptions();

    this.textEditor.set({
      anchorId: entityId,
      text: editorData?.text || '',
      font: editorData?.font || constants.DEFAULT_FONT,
      fontSize: editorData?.fontSize || constants.DEFAULT_FONT_SIZE,
      textAlign: editorData?.textAlign || constants.TextAlign.LEFT,
      bold: Boolean(/bold/.test(editorData?.fontStyle || '')),
      italic: Boolean(/italic/.test(editorData?.fontStyle || '')),
      underline: Boolean(/underline/.test(editorData?.textDecoration || '')),
      isEditable: true,
      position,
    });
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
