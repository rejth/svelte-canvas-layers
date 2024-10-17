import { get, type Writable, writable } from 'svelte/store';
import { v4 as uuid } from 'uuid';

import type { Point } from 'core/interfaces';
import { GeometryManager } from 'core/index';

import { SHAPE_DIMENSIONS } from 'client/constants';
import { Tools, type ShapeConfig, type ShapeType, type Tool } from 'client/interfaces';
import { toolbarStore } from 'client/ui';

type Shapes = Map<string, ShapeConfig>;

export class CanvasStore {
  shapes: Writable<Map<string, ShapeConfig>> = writable(new Map());
  selectedShapes: Writable<Map<string, ShapeConfig>> = writable(new Map());
  selection: Writable<Point[]> = writable([]);

  #geometryManager: GeometryManager;
  shapeType: ShapeType | null = null;
  tool: Tool = Tools.PAN;

  constructor() {
    this.#geometryManager = new GeometryManager();

    toolbarStore.tool.subscribe((value) => {
      this.tool = value;
    });
    toolbarStore.shapeType.subscribe((value) => {
      this.shapeType = value;
    });
  }

  #createShape(uuid: string, type: ShapeType, { x, y }: Point): ShapeConfig {
    const { width, height } = SHAPE_DIMENSIONS[type];
    return {
      uuid,
      type,
      x,
      y,
      width,
      height,
      isSelected: true,
    };
  }

  addShape(e: MouseEvent) {
    if (!this.shapeType) return;

    const position = this.#geometryManager.calculatePosition(e);
    const shape = this.#createShape(uuid(), this.shapeType, position);
    this.selectShape(shape);

    this.shapes.update((shapes) => shapes.set(shape.uuid, shape));
    toolbarStore.tool.set(Tools.PAN);
    toolbarStore.shapeType.set(null);
  }

  selectShape(shape: ShapeConfig) {
    this.selectedShapes.update((selected) => selected.set(shape.uuid, shape));
  }

  deselectShape(shape: ShapeConfig) {
    this.selectedShapes.update((selected) => {
      selected.delete(shape.uuid);
      return selected;
    });
  }

  #removeSelectedShape(store: Shapes, selected: Shapes): Shapes {
    return new Map([...store.entries()].filter(([key]) => !selected.has(key)));
  }

  deleteShape() {
    const selected = get(this.selectedShapes);
    this.selectedShapes.update((shapes) => this.#removeSelectedShape(shapes, selected));
    this.shapes.update((shapes) => this.#removeSelectedShape(shapes, selected));
  }

  resetSelectedShapes() {
    this.selectedShapes.set(new Map());
  }

  dragSelection(e: MouseEvent, rect: DOMRect) {
    if (this.tool !== Tools.SELECT) return;
    const insideCanvas = this.#geometryManager.isPointInsideRect(e, rect);

    if (insideCanvas) {
      const point = this.#geometryManager.calculatePosition(e);
      this.selection.update((path) => [...path, point]);
    }
  }

  resetSelection() {
    this.selection.set([]);
  }
}
