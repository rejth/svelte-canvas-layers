<script lang="ts">
// Spike 001 — worker render via OffscreenCanvas, imported ONLY from the public barrel.
// Ported from packages/engine/src/examples/WorkerExample.svelte to prove the
// `?worker` + transferControlToOffscreen chain bundles inside a Storybook story iframe.
import { onDestroy } from 'svelte'
import { WorkerCanvas, WorkerLayer } from '@canvas/engine'
import type { WorkerRender } from '@canvas/engine'

type SquareData = { x: number; y: number; size: number; color: string }

const render: WorkerRender = ({ ctx, width, height, data }) => {
  const square = data as SquareData
  ctx.fillStyle = '#101418'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = square.color
  ctx.fillRect(square.x, square.y, square.size, square.size)
}

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

<WorkerCanvas width={420} height={220} style="border: 1px solid #333; border-radius: 8px;">
  <WorkerLayer {render} {data} />
</WorkerCanvas>
