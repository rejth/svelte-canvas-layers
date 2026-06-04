import { getMaxPixelRatio } from '../services'

/**
 * Shared canvas scaffolding extracted from Canvas.svelte (D-02) so the worker
 * Canvas component (Plan 03) can reuse it without duplicating the ~250-line
 * Canvas.svelte. Only the pure ResizeObserver action and the pixel-ratio
 * derivation are extracted — the `$:` reactive declarations and the
 * `<svelte:window bind:devicePixelRatio>` binding stay component-scoped in
 * each Svelte 4 component (Open Question 2 — don't over-extract).
 */

/**
 * Build a Svelte `use:` action that observes a node with a ResizeObserver and
 * reports its content-box size via `onResize`. Mirrors Canvas.svelte lines
 * 87-98, parameterized by a setter so each Canvas component can wire it to its
 * own `canvasWidth`/`canvasHeight` locals.
 */
export const createResizeAction =
  (onResize: (width: number, height: number) => void) => (node: HTMLElement) => {
    const observer = new ResizeObserver(([{ contentRect }]) => {
      onResize(contentRect.width, contentRect.height)
    })

    observer.observe(node)

    return {
      destroy: () => observer.disconnect(),
    }
  }

/**
 * Resolve the numeric pixel ratio. When `pixelRatio === 'auto'` and a
 * `devicePixelRatio` is known, use the canvas-size–validated maximum ratio
 * (reusing `getMaxPixelRatio` — do not hand-roll); otherwise fall back to the
 * device ratio or 2. Wraps the derivation at Canvas.svelte lines 129-146.
 */
export const derivePixelRatio = (opts: {
  width: number
  height: number
  devicePixelRatio: number | undefined
  pixelRatio: 'auto' | null
}): number => {
  const { width, height, devicePixelRatio, pixelRatio } = opts

  if (devicePixelRatio && pixelRatio === 'auto') {
    return getMaxPixelRatio(width, height, devicePixelRatio)
  }

  return devicePixelRatio ?? 2
}
