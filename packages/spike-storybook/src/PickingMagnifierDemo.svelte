<script lang="ts">
import type { ColorPickEventDetail, WorkerRender } from '@canvas/engine'
import { WorkerCanvas, WorkerLayer } from '@canvas/engine'

type Band = { color: string }

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
</script>

<div class="story-viewport">
  <WorkerCanvas
    enablePicking
    style="display:block;cursor:crosshair;"
    on:colorpeek={onPeek}
    on:colorpick={onPick}
  >
    <WorkerLayer {render} {data} />
  </WorkerCanvas>

  <div class="readout">
    <div class="readout-item">
      <div class="label">PEEK (hover)</div>
      <div class="value">
        <span class="swatch" style:background={peek?.hex ?? 'transparent'}></span>
        <code>{peek?.hex ?? '—'}</code>
      </div>
    </div>
    <div class="readout-item">
      <div class="label">PICK (click)</div>
      <div class="value">
        <span class="swatch" style:background={picked?.hex ?? 'transparent'}></span>
        <code>{picked?.hex ?? '—'}</code>
      </div>
    </div>
  </div>
</div>

<style>
  .story-viewport {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #fff;
  }

  .readout {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 16px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.88);
    color: #111827;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  }

  .readout-item {
    min-width: 112px;
  }

  .label {
    margin-bottom: 4px;
    font-size: 11px;
    opacity: 0.65;
  }

  .value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .swatch {
    display: inline-block;
    width: 28px;
    height: 28px;
    border: 1px solid #334155;
    border-radius: 6px;
  }
</style>
