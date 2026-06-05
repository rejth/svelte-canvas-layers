<script lang="ts">
import type { Bounds, Render } from '@canvas/engine'
import { Layer } from '@canvas/engine'

export let bounds: Bounds
export let show = false

const render: Render = ({ ctx }) => {
  const { x0, y0, x1, y1 } = bounds

  if (show) {
    ctx.strokeStyle = 'rgba(17,24,39,0.72)'
    ctx.lineWidth = 2
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0)
  }

  ctx.globalAlpha = 0
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
  ctx.globalAlpha = 1
}
</script>

<Layer
  {render}
  on:mouseenter
  on:mouseleave
  on:mousedown
  on:touchstart
/>
