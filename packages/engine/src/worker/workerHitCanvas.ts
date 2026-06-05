/**
 * Worker-local forced-color proxy for the OffscreenCanvas hit context.
 *
 * Mirrors the main-thread `createHitCanvas` proxy, but adapted for the native
 * `OffscreenCanvasRenderingContext2D`: every drawing method call forces the
 * context's `fillStyle`/`strokeStyle` to the active layer color immediately
 * before the call is forwarded, and color/compositing setters are dropped so a
 * replayed drawer cannot erase its own color id.
 *
 * Internal only — not exported from the public `@canvas/engine` barrel.
 */

/**
 * Setters a replayed drawer must NOT be able to mutate on the hit context, since
 * they would let a layer change or wash out its forced color id.
 */
const EXCLUDED_SETTERS = new Set<PropertyKey>([
  'fillStyle',
  'strokeStyle',
  'globalAlpha',
  'globalCompositeOperation',
  'filter',
  'shadowBlur',
])

export function createForcedColorContext(
  hitContext: OffscreenCanvasRenderingContext2D,
  getColor: () => string,
): OffscreenCanvasRenderingContext2D {
  return new Proxy(hitContext, {
    get(target, property: keyof OffscreenCanvasRenderingContext2D) {
      const value = target[property]
      if (typeof value !== 'function') return value

      return (...args: unknown[]) => {
        target.fillStyle = getColor()
        target.strokeStyle = getColor()
        return Reflect.apply(value as Function, target, args)
      }
    },

    set(target, property: keyof OffscreenCanvasRenderingContext2D, newValue) {
      if (!EXCLUDED_SETTERS.has(property)) {
        ;(<OffscreenCanvasRenderingContext2D>target[property]) = newValue
      }
      return true
    },
  })
}
