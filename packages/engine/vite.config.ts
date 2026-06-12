import path from 'path'

import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: {
        index: path.resolve('./src/index.ts'),
        'worker-runtime': path.resolve('./src/worker-runtime.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['svelte', 'svelte/internal', 'comlink', 'canvas-size'],
    },
  },
})
