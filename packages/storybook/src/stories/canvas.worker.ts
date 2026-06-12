import { exposeCanvasWorker, type WorkerRenderRegistry } from '@canvas/engine/worker-runtime'

type SquareData = { x: number; y: number; size: number; color: string }
type WorkerBox = { id: string; color: string; x0: number; y0: number; x1: number; y1: number }

const renderers = {
  helloWorld({ ctx, width, height }) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.font = `${Math.floor(width / 10)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'tomato'
    ctx.fillText('hello world', width / 2, height / 2)
  },

  pixelRatio({ ctx, width, height, pixelRatio }) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'tomato'
    ctx.font = `${Math.floor(width / 14)}px 'Fira Mono', monospace`
    ctx.fillText(`pixelRatio: ${pixelRatio.toFixed(2)}`, width / 2, width / 4)

    ctx.fillStyle = '#475569'
    ctx.font = `${Math.floor(width / 30)}px 'Fira Mono', monospace`
    ctx.fillText(
      `${width}x${height} css -> ${Math.round(width * pixelRatio)}x${Math.round(
        height * pixelRatio,
      )} device px`,
      width / 2,
      width / 4 + width / 16,
    )
  },

  colorBands({ ctx, width, height }) {
    const colors = ['#ff3b30', '#34c759', '#007aff', '#ffcc00']
    const bandW = width / colors.length
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(i * bandW, 0, bandW, height)
    }
  },

  movingSquare({ ctx, width, height, data }) {
    const square = data as SquareData
    const size = Math.max(square.size, Math.min(width, height) * 0.24)
    const margin = 32
    const maxX = Math.max(margin, width - size - margin)
    const x = Math.min(square.x, maxX)
    const y = height / 2 - size / 2

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = square.color
    ctx.fillRect(x, y, size, size)
  },

  box({ ctx, data }) {
    const box = data as WorkerBox
    ctx.globalAlpha = 0.9
    ctx.fillStyle = box.color
    ctx.fillRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0)
    ctx.globalAlpha = 1
  },
} satisfies WorkerRenderRegistry

exposeCanvasWorker(renderers)
