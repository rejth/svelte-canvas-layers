<script lang="ts">
import { onDestroy } from 'svelte'

// KEPT FIXTURE / REGRESSION SMOKE TEST (D-09) — NOT throwaway.
// This is the only end-to-end runtime proof that the worker render path actually
// transfers, serializes, and paints (WRK-01..WRK-04). It also seeds the Phase 6
// demo. It imports the worker family from the PUBLIC barrel `@canvas/engine`
// (not deep relative paths) so it doubles as a public-API exercise (DEMO-03
// precedent).
import { WorkerCanvas, WorkerLayer } from '@canvas/engine'
import type { WorkerRender } from '@canvas/engine'

type SquareData = {
  x: number
  y: number
  size: number
  color: string
}

/**
 * Self-contained worker drawer (D-06). It references ONLY its argument — no
 * captured component/module variables, no imported helpers. All dynamic state
 * (position/size/color) rides through `data`. The source is serialized with
 * json-fn and reconstructed via eval in the worker global scope.
 *
 * Typed as the public `WorkerRender` (data is `unknown` at the boundary) and
 * narrowed locally to the example's `SquareData` shape inside the body.
 */
const render: WorkerRender = ({ ctx, width, height, data }) => {
  const square = data as SquareData

  ctx.fillStyle = '#101418'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = square.color
  ctx.fillRect(square.x, square.y, square.size, square.size)
}

// Animate `data` so the example also exercises the granular UPDATE_DATA path
// (D-05) and proves redraw-on-data-change. The render fn stays untouched — only
// the cloned data crosses the boundary on each tick.
let data: SquareData = { x: 20, y: 60, size: 80, color: '#4cc2ff' }

let direction = 1
const interval = setInterval(() => {
  let nextX = data.x + direction * 4
  if (nextX > 320 || nextX < 20) {
    direction *= -1
    nextX = data.x + direction * 4
  }
  data = { ...data, x: nextX }
}, 16)

onDestroy(() => clearInterval(interval))
</script>

<WorkerCanvas
  width={420}
  height={220}
  enablePicking
  style="border: 1px solid #333; border-radius: 8px;"
  on:colorpeek={(e) => console.log('peek', e.detail)}
  on:colorpick={(e) => console.log('pick', e.detail)}
>
  <WorkerLayer {render} {data} />
</WorkerCanvas>
