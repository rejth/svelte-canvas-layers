import type { LayerId } from '../layerTypes'

import type { RGB } from './colorPicking'

/**
 * Shared color-id conversion used by both the main-thread hit canvas
 * (`createHitCanvas`) and the worker-resident hit canvas (`worker.ts`) so that
 * a layer's encoded color stays identical across rendering modes.
 */

// https://blog.logrocket.com/guide-javascript-bitwise-operators/#sign-propagating-right-shift
export function convertRGBtoLayerId([r, g, b]: RGB): LayerId {
  const id = ((r << 16) | (g << 8) | b) / 2
  return id % 1 ? 0 : id
}

export function convertLayerIdToRGB(id: LayerId): RGB {
  const id2 = id * 2
  const r = (id2 >> 16) & 0xff
  const g = (id2 >> 8) & 0xff
  const b = id2 & 0xff
  return [r, g, b]
}
