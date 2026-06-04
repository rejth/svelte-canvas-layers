import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// @storybook/svelte-vite's viteFinal only adds docgen + SvelteKit detection — it does
// NOT inject the svelte() plugin. Storybook's builder-vite loads THIS config, so the
// svelte plugin must live here, or SB's own .svelte components fail to compile.
export default defineConfig({
  plugins: [svelte()],
})
