import { writable, type Writable } from 'svelte/store';

import type { CanvasContextType, Point } from 'core/interfaces';
import type { Drawer } from 'core/services';

export interface ActiveLayer {
  id: symbol;
  name: string;
}

export interface RenderProps {
  ctx: CanvasContextType;
  drawer: Drawer;
  width: number;
  height: number;
  active: () => boolean;
}

export interface Render {
  (data: RenderProps): void;
}

export const position: Writable<Point> = writable({ x: 0, y: 0 });
export const activeLayer: Writable<ActiveLayer | null> = writable(null);
