export const createStoryWorker = () =>
  new Worker(new URL('../stories/canvas.worker.ts', import.meta.url), { type: 'module' })
