import path from 'path'

import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      client: path.resolve('./src/client'),
      core: path.resolve('./src/core'),
      $lib: path.resolve('./src/lib'),
    },
  },
})
