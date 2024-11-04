import { get, type Writable, writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import type { Point } from 'core/interfaces';
import { geometryManager } from 'core/services';

import { Tools, type ShapeConfig, type ShapeType, type Tool } from 'client/shared/interfaces';
import { COLORS } from 'client/shared/constants';
import { toolbarStore } from 'client/ui/Toolbar/store';
import { connectionStore } from 'client/ui/Connection/store';

type Shapes = Map<string, ShapeConfig>;

class CanvasStore {
  shapes: Writable<Shapes> = writable(new Map());
  selectedShapes: Writable<Shapes> = writable(new Map());
  selectionPath: Writable<Point[]> = writable([]);
  isSelected: Writable<boolean> = writable(false);

  #shapeType: ShapeType | null = null;
  #tool: Tool | null = Tools.NOTE;

  constructor() {
    toolbarStore.tool.subscribe((value) => (this.#tool = value));
    toolbarStore.shapeType.subscribe((value) => (this.#shapeType = value));
  }

  #createShape(type: ShapeType, { x, y }: Point): ShapeConfig {
    return {
      uuid: uuid(),
      type: type,
      isSelected: false,
      initialBounds: { x0: x, y0: y, x1: x + 168, y1: y + 168 },
      color: COLORS.STICKER_YELLOW,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffsetY: 10,
      shadowOffsetX: 3,
      shadowBlur: 5,
    };
  }

  #removeSelectedShape(shapes: Shapes): Shapes {
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

    this.shapes.update((shapes) => shapes.set(shape.uuid, shape));
    this.resetToolbar();
  }

  deleteShape() {
    this.shapes.update((shapes) => this.#removeSelectedShape(shapes));
    this.selectedShapes.update((shapes) => this.#removeSelectedShape(shapes));
    this.resetToolbar();
  }

  selectShape(uuid: ShapeConfig['uuid']) {
    const shape = get(this.shapes).get(uuid) || null;
    if (!shape) return;

    this.selectedShapes.update((selected) => selected.set(uuid, shape));
    this.shapes.update((shapes) => shapes.set(uuid, { ...shape, isSelected: true }));
  }

  deselectShape(uuid: ShapeConfig['uuid']) {
    this.selectedShapes.update((selected) => {
      selected.delete(uuid);
      return selected;
    });

    const shape = get(this.shapes).get(uuid) || null;
    if (!shape) return;

    this.shapes.update((shapes) => shapes.set(uuid, { ...shape, isSelected: false }));
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
      this.shapes.update((shapes) => shapes.set(shape.uuid, { ...shape, isSelected: false }));
    }

    this.selectedShapes.set(new Map());
  }

  resetSelection() {
    this.selectionPath.set([]);
  }
}

export const canvasStore = new CanvasStore();
