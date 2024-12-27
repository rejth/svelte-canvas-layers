import type { Bounds } from 'core/interfaces';
import { v4 as uuid } from 'uuid';

export interface BaseCanvasEntityInterface<O> {
  getType(): CanvasEntityType | null;
  setType(type: CanvasEntityType): void;
  getScale(): number;
  setScale(scale: number): void;
  getXY(): number[];
  setXY(x: number, y: number): void;
  getOptions(): O;
  setOptions(options: Partial<O>): void;
  getWidthHeight(): number[];
  setWidthHeight(width: number, height: number): void;
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
  #options: O;
  #minDimension: number;

  constructor(options: O, minDimension = 150) {
    this.#id = uuid();
    this.#type = CanvasEntityType.BASE;
    this.#isSelected = false;
    const alignedWidth = options.width * options.scale;
    const alignedHeight = options.height * options.scale;

    this.#options = {
      ...options,
      width: alignedWidth,
      height: alignedHeight,
      initialWidth: options?.initialWidth || options.width,
      initialHeight: options?.initialHeight || options.height,
    };

    this.#minDimension = minDimension;
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

  setWidthHeight(width: number, height: number) {
    if (width >= this.#minDimension && height >= this.#minDimension) {
      const newValue = Math.min(width, height);
      const prevValue = Math.min(
        this.#options?.initialWidth || width,
        this.#options?.initialHeight || height,
      );

      const scale = newValue / prevValue;

      this.#options.width = width;
      this.#options.height = height;
      this.#options.scale = scale;
    }
  }
}
