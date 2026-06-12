/// <reference types="svelte" />

import type { EventHandler } from 'svelte/elements'

declare module 'svelte/elements' {
  interface HTMLCanvasAttributes {
    'on:outclick'?: EventHandler<CustomEvent, HTMLCanvasElement>
  }
}

declare global {
  namespace App {}

  namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:outclick'?: EventHandler<CustomEvent, Element>
    }
  }
}

export {}
