<script lang="ts">
// Spike 002 — demo-owned magnifier driven by the engine's public colorpeek/colorpick
// events (the D-13 split: engine emits HEX + pointer pos, demo renders the UI).
// Barrel-only import.
import { onDestroy } from 'svelte'
import { WorkerCanvas, WorkerLayer } from '@canvas/engine'
import type { WorkerRender, ColorPickEventDetail } from '@canvas/engine'

type Band = { color: string }

// Self-contained drawer: paints 4 vertical color bands so picked HEX is predictable.
const render: WorkerRender = ({ ctx, width, height }) => {
  const colors = ['#ff3b30', '#34c759', '#007aff', '#ffcc00']
  const bandW = width / colors.length
  for (let i = 0; i < colors.length; i++) {
    ctx.fillStyle = colors[i]
    ctx.fillRect(i * bandW, 0, bandW, height)
  }
}

const data: Band = { color: 'static' }

let peek: ColorPickEventDetail | null = null
let picked: ColorPickEventDetail | null = null

const onPeek = (e: CustomEvent<ColorPickEventDetail>) => (peek = e.detail)
const onPick = (e: CustomEvent<ColorPickEventDetail>) => (picked = e.detail)

onDestroy(() => {})
</script>

<div style="display:flex; gap:16px; align-items:flex-start; font-family: ui-monospace, monospace;">
  <WorkerCanvas
    width={420}
    height={220}
    enablePicking
    style="border: 1px solid #333; border-radius: 8px; cursor: crosshair;"
    on:colorpeek={onPeek}
    on:colorpick={onPick}
  >
    <WorkerLayer {render} {data} />
  </WorkerCanvas>

  <!-- demo-owned magnifier / readout -->
  <div style="min-width:180px;">
    <div style="margin-bottom:12px;">
      <div style="font-size:11px; opacity:0.6;">PEEK (hover)</div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span
          style="width:28px; height:28px; border-radius:6px; border:1px solid #333; display:inline-block; background:{peek?.hex ?? 'transparent'};"
        ></span>
        <code>{peek?.hex ?? '—'}</code>
      </div>
      <div style="font-size:11px; opacity:0.5;">{peek ? `(${peek.x}, ${peek.y})` : ''}</div>
    </div>
    <div>
      <div style="font-size:11px; opacity:0.6;">PICK (click)</div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span
          style="width:28px; height:28px; border-radius:6px; border:1px solid #333; display:inline-block; background:{picked?.hex ?? 'transparent'};"
        ></span>
        <code>{picked?.hex ?? '—'}</code>
      </div>
      <div style="font-size:11px; opacity:0.5;">{picked ? `(${picked.x}, ${picked.y})` : ''}</div>
    </div>
  </div>
</div>
