import { v4 as uuid } from 'uuid';

import type { Bounds } from 'core/interfaces';
import { ShapeType } from 'client/shared/interfaces';
import { DEFAULT_SCALE } from 'client/shared/constants';

export interface BaseCanvasEntityInterface<O> {
  getType(): CanvasEntityType | null;
  setType(type: CanvasEntityType): void;
  getShapeType(): ShapeType;
  setShapeType(shapeType: ShapeType): void;
  getScale(): number;
  setScale(scale: number): void;
  getXY(): number[];
  setXY(x: number, y: number): void;
  getOptions(): O;
  setOptions(options: Partial<O>): void;
  getWidthHeight(): number[];
  getCalculatedScale(width: number, height: number): number;
}

export interface BaseCanvasEntityDrawOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  initialWidth?: number;
  initialHeight?: number;
  scale: number;
  canvasScale?: number;
}

export const enum CanvasEntityType {
  BASE = 'BASE',
  RECT = 'RECT',
  TEXT = 'TEXT',
}

export class BaseCanvasEntity<O extends BaseCanvasEntityDrawOptions>
  implements BaseCanvasEntityInterface<O>
{
  #id: string;
  #isSelected: boolean;
  #type: CanvasEntityType;
  #shapeType: ShapeType;
  #options: O;
  #minDimension: number;

  constructor(options: O, minDimension = 200) {
    this.#id = uuid();
    this.#type = CanvasEntityType.BASE;
    this.#shapeType = ShapeType.NOTE;
    this.#isSelected = false;

    const { initialWidth, initialHeight, width, height, scale } = options;

    this.#options = {
      ...options,
      width: width * scale,
      height: height * scale,
      initialWidth: initialWidth || width,
      initialHeight: initialHeight || height,
    };

    this.#minDimension = Math.min(minDimension, initialWidth || width, initialHeight || height);
  }

  get id(): string {
    return this.#id;
  }

  get isSelected(): boolean {
    return this.#isSelected;
  }

  set isSelected(value: boolean) {
    this.#isSelected = value;
  }

  getOptions(): O {
    return { ...this.#options };
  }

  setOptions(options: Partial<O>) {
    this.#options = { ...this.#options, ...options };
  }

  getType(): CanvasEntityType {
    return this.#type;
  }

  setType(type: CanvasEntityType) {
    this.#type = type;
  }

  getShapeType(): ShapeType {
    return this.#shapeType;
  }

  setShapeType(shapeType: ShapeType) {
    this.#shapeType = shapeType;
  }

  getScale(): number {
    return this.#options.scale;
  }

  setScale(scale: number) {
    this.#options.scale = scale;
  }

  getXY(): number[] {
    return [this.#options.x, this.#options.y];
  }

  setXY(x: number, y: number) {
    this.#options.x = x;
    this.#options.y = y;
  }

  getBounds(): Bounds {
    return {
      x0: this.#options.x,
      y0: this.#options.y,
      x1: this.#options.x + this.#options.width,
      y1: this.#options.y + this.#options.height,
    };
  }

  getWidthHeight(): number[] {
    return [this.#options.width, this.#options.height];
  }

  getCalculatedScale(width: number, height: number): number {
    if (width >= this.#minDimension && height >= this.#minDimension) {
      const { initialWidth = width, initialHeight = height } = this.#options;
      const newValue = Math.min(width, height);
      const prevValue = Math.min(initialWidth, initialHeight);
      return newValue / prevValue;
    }

    return DEFAULT_SCALE;
  }
}
