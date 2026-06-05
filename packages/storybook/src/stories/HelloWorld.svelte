<script lang="ts">
import type { WorkerRender } from '@canvas/engine'

import ModeCanvas from '../shared/ModeCanvas.svelte'
import type { Mode } from '../shared/modeArg'

export let mode: Mode = 'main'

const render: WorkerRender = ({ ctx, width, height }) => {
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)
  ctx.font = `${Math.floor(width / 10)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'tomato'
  ctx.fillText('hello world', width / 2, height / 2)
}
</script>

<ModeCanvas {mode} {render} />
