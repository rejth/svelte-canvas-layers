import type { HitCanvasRenderingContext2D, LayerId, RGB } from 'core/interfaces';

/**
 * Offscreen canvas settings for rendering optimization.
 */
const settings: CanvasRenderingContext2DSettings = {
  willReadFrequently: true,
};

/**
 * A list of canvas context setters that we do not need to use on the offscreen canvas, so this allows to optimize rendering significantly.
 * */
const EXCLUDED_SETTERS: Array<keyof HitCanvasRenderingContext2D> = [
  'filter',
  'shadowBlur',
  'globalCompositeOperation',
  'globalAlpha',
  'fillStyle',
  'strokeStyle',
];

// https://blog.logrocket.com/guide-javascript-bitwise-operators/#sign-propagating-right-shift
export function convertRGBtoLayerId([r, g, b]: RGB): number {
  const id = ((r << 16) | (g << 8) | b) / 2;
  return id % 1 ? 0 : id;
}

export function convertLayerIdToRGB(id: number): RGB {
  const id2 = id * 2;
  const r = (id2 >> 16) & 0xff;
  const g = (id2 >> 8) & 0xff;
  const b = id2 & 0xff;
  return [r, g, b];
}

/**
 * Under the hood, we proxy all CanvasRenderingContext2D methods to a second, offscreen canvas.
 * This approach can be useful for identifying the corresponding layer using a unique fill and stroke color and then re-dispatch an event to the Layer component.
 * When an event occurs on the main canvas, the color of the pixel at the event coordinates is read from the offscreen canvas and converted to unique layer id.
 */
export function createHitCanvas(
  canvas: HTMLCanvasElement,
  contextSettings?: CanvasRenderingContext2DSettings,
): HitCanvasRenderingContext2D {
  const hitCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const hitContext = hitCanvas.getContext('2d', settings) as unknown as HitCanvasRenderingContext2D;
  const mainContext = canvas.getContext('2d', contextSettings);

  let activeLayerId: LayerId;

  const hitCanvasObserver = new MutationObserver(() => {
    hitCanvas.width = canvas.width;
    hitCanvas.height = canvas.height;
  });

  hitCanvasObserver.observe(canvas, { attributeFilter: ['width', 'height'] });

  const setActiveLayerId = (layerId: number) => {
    activeLayerId = layerId;
  };

  const getLayerIdFromUnderlyingPixel = (x: number, y: number) => {
    const [r, g, b] = hitContext.getImageData(x, y, 1, 1).data;
    return convertRGBtoLayerId([r, g, b]);
  };

  const drawLayerOnHitCanvas = () => {
    const [r, g, b] = convertLayerIdToRGB(activeLayerId);
    const layerColor = `rgb(${r},${g},${b})`;
    hitContext.fillStyle = layerColor;
    hitContext.strokeStyle = layerColor;
  };

  return new Proxy(mainContext as unknown as HitCanvasRenderingContext2D, {
    get(target, property: keyof HitCanvasRenderingContext2D) {
      if (property === 'getLayerIdAt') return getLayerIdFromUnderlyingPixel;
      if (property === 'setActiveLayerId') return setActiveLayerId;

      const value = target[property];
      if (typeof value !== 'function') return value;

      return (...args: unknown[]) => {
        drawLayerOnHitCanvas();
        (<Function>hitContext[property])(...args);
        return Reflect.apply(value, target, args);
      };
    },

    set(target, property: keyof HitCanvasRenderingContext2D, newValue) {
      (<HitCanvasRenderingContext2D>target[property]) = newValue;

      if (!EXCLUDED_SETTERS.includes(property)) {
        (<HitCanvasRenderingContext2D>hitContext[property]) = newValue;
      }

      return true;
    },
  });
}
