import { type Writable, writable } from 'svelte/store'
import type { CanvasContextType, Point, Renderer } from '@canvas/engine'

export interface ActiveLayer {
  id: symbol
  name: string
}

export interface RenderProps {
  ctx: CanvasContextType
  renderer: Renderer
  width: number
  height: number
  active: () => boolean
}

export interface Render {
  (data: RenderProps): void
}

export const position: Writable<Point> = writable({ x: 0, y: 0 })
export const activeLayer: Writable<ActiveLayer | null> = writable(null)
