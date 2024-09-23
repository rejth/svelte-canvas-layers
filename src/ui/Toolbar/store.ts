import { type Writable, writable } from 'svelte/store';
import type { ShapeType, Tool } from './types';

class ToolbarStore {
  tool: Writable<Tool> = writable('PAN');
  shapeType: Writable<ShapeType | null> = writable(null);

  changeTool(tool: Tool): void {
    this.tool.set(tool);
    this.setShapeType(tool);
  }

  setShapeType(tool: Tool): void {
    if (this.isShapeToolSelected(tool)) {
      this.shapeType.set(<ShapeType>tool);
    } else {
      this.shapeType.set(null);
    }
  }

  isShapeToolSelected(tool: Tool): boolean {
    return ['NOTE', 'TEXT'].includes(tool);
  }

  isServiceToolSelected(tool: Tool): boolean {
    return ['PAN', 'SELECT'].includes(tool);
  }
}

export const toolbarStore = new ToolbarStore();
