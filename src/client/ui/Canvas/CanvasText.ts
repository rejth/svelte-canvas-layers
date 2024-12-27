import {
  BaseCanvasEntity,
  CanvasEntityType,
  type BaseCanvasEntityDrawOptions,
} from 'client/ui/Canvas/BaseCanvasEntity';

export interface TextDrawOptions extends BaseCanvasEntityDrawOptions {
  text: string;
  fontSize: number;
  fontStyle: string;
  textAlign: CanvasTextAlign;
}

export class CanvasText extends BaseCanvasEntity<TextDrawOptions> {
  #snapshot: CanvasImageSource | null = null;
  #preparedText: string[] = [];

  constructor(options: TextDrawOptions) {
    super(options);
    this.setType(CanvasEntityType.TEXT);
    this.prepareText(options.text, options.fontSize);
  }

  setText(text: string, fontSize: number, fontStyle: string, textAlign: CanvasTextAlign) {
    const options = this.getOptions();
    this.prepareText(text, fontSize, fontStyle);

    if (
      text !== options.text ||
      fontSize !== options.fontSize ||
      fontStyle !== options.fontStyle ||
      textAlign !== options.textAlign
    ) {
      this.setSnapshot(null);
    }

    this.setOptions({ text, fontSize, fontStyle, textAlign });
  }

  prepareText(text: string, fontSize: number, fontStyle = '') {
    const { width, height, scale = 1, canvasScale = 2 } = this.getOptions();

    const offscreenCanvas = new OffscreenCanvas(width, height);
    offscreenCanvas.width = Math.floor(width * canvasScale);
    offscreenCanvas.height = Math.floor(height * canvasScale);

    const context = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    context.scale(canvasScale, canvasScale);
    context.font = `${fontStyle ? fontStyle : 400} ${fontSize}px monospace`;

    const fragments = text.split(/[\r\n]/);
    const preparedText: string[] = [];
    let textToRender = '';

    for (const fragment of fragments) {
      if (fragment === '') {
        preparedText.push('');
      } else {
        for (const substring of fragment) {
          const textMetrics = context.measureText(textToRender + substring);
          const rectWidth = width - 10 * scale;

          if (textMetrics.width * scale >= rectWidth) {
            preparedText.push(textToRender);
            textToRender = '';
          }

          textToRender += substring;
        }

        if (textToRender !== '') {
          preparedText.push(textToRender);
          textToRender = '';
        }
      }
    }

    this.#preparedText = preparedText;
  }

  setWidthHeight(width: number, height: number) {
    super.setWidthHeight(width, height);
    this.setSnapshot(null);
  }

  getPreparedText(): string[] {
    return this.#preparedText;
  }

  setSnapshot(snapshot: CanvasImageSource | null) {
    this.#snapshot = snapshot;
  }

  getSnapshot(): CanvasImageSource | null {
    return this.#snapshot;
  }
}
