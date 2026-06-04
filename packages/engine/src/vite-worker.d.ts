// Ambient declaration for Vite's `?worker` virtual module suffix
// (https://vite.dev/guide/features#web-workers). `import Worker from './x?worker'`
// yields a zero-arg constructor returning a Web Worker. Mirrors the declaration
// vite/client provides; declared locally because the engine package does not
// reference vite/client in its tsconfig. The worker is bundled by the consumer's
// Vite graph at build time (WorkerRenderManager.ts).
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}

declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}
