<script lang="ts">
  import type { Point, TransformationMatrix } from 'core/interfaces';

  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import {
    DEFAULT_FONT_SIZE,
    SMALL_PADDING,
    TextAlign,
    DEFAULT_SCALE,
  } from 'client/shared/constants';
  import { canvasStore } from 'client/ui/Canvas/store';

  import TextEditorMenu from './TextEditorMenu.svelte';

  export let anchorId: string | undefined;
  export let position: Point | undefined;
  export let transform: TransformationMatrix | null | undefined;

  const { shapes, textEditor } = canvasStore;
  const { x = 0, y = 0 } = position || {};

  let textareaRef: HTMLTextAreaElement;
  let adaptiveFontSize = $textEditor?.fontSize || DEFAULT_FONT_SIZE;
  let textValue = $textEditor?.text || '';

  $: shape = $shapes.get(anchorId || '') as BaseCanvasEntity<RectDrawOptions>;
  $: options = shape?.getOptions();
  $: initialWidth = options?.initialWidth ?? options?.width;
  $: initialHeight = options?.initialHeight ?? options?.height;
  $: height = options?.height || initialHeight;
  $: scale = options?.scale || DEFAULT_SCALE;

  $: bold = $textEditor?.bold || false;
  $: italic = $textEditor?.italic || false;
  $: underline = $textEditor?.underline || false;
  $: fontSize = $textEditor?.fontSize || DEFAULT_FONT_SIZE;
  $: textAlign = $textEditor?.textAlign || TextAlign.LEFT;
  $: textEditorScale = getTextEditorScale(scale);

  const handleTextChange = (e: Event) => {
    textValue = (e.target as HTMLTextAreaElement).value;
    canvasStore.updateTextEditor({ text: textValue, fontSize: calculateFontSize(fontSize) });
  };

  const calculateFontSize = (fontSize: number) => {
    if (!textareaRef) return fontSize;

    const textAreaValue = textareaRef.value;
    let nextFontSize = fontSize;

    if (textareaRef.scrollHeight * scale > height - SMALL_PADDING) {
      nextFontSize = nextFontSize - 2;
    }

    if (textAreaValue.length < textValue.length && nextFontSize < adaptiveFontSize) {
      textareaRef.style.fontSize = `${nextFontSize + 2}px`;

      if (textareaRef.scrollHeight * scale <= height - SMALL_PADDING) {
        nextFontSize = nextFontSize + 2;
      } else {
        textareaRef.style.fontSize = `${nextFontSize}px`;
      }
    }

    return nextFontSize;
  };

  const onFontSizeChange = (fontSize: number) => {
    adaptiveFontSize = calculateFontSize(fontSize);
  };

  const getTextEditorScale = (scale: number) => {
    if (!transform) return DEFAULT_SCALE;
    const inverseScale = DEFAULT_SCALE / (transform.scaleX / transform.initialScale);
    return scale / inverseScale;
  };
</script>

<TextEditorMenu {textareaRef} anchor={shape} {position} {transform} {onFontSizeChange} />

<!-- svelte-ignore a11y-autofocus -->
<textarea
  autofocus
  id="text-editor"
  class="text-editor"
  placeholder="Enter text"
  bind:this={textareaRef}
  bind:value={textValue}
  style:left={`${x + SMALL_PADDING * textEditorScale}px`}
  style:top={`${y + SMALL_PADDING * textEditorScale}px`}
  style:width={`${initialWidth - SMALL_PADDING * 2}px`}
  style:height={`${initialHeight - SMALL_PADDING * 2}px`}
  style:transform={`scale(${textEditorScale})`}
  style:font-size={`${fontSize}px`}
  style:font-style={italic ? 'italic' : ''}
  style:font-weight={bold ? 800 : 400}
  style:text-decoration={underline ? 'underline' : ''}
  style:text-align={textAlign}
  on:input={handleTextChange}
/>

<style>
  .text-editor {
    box-sizing: border-box;
    background: transparent;
    position: absolute;
    padding: 0;
    z-index: 10;
    line-break: anywhere;
    overflow: hidden;
    resize: none;
    border: none;
    outline: none;
    transform-origin: top left;
    text-align: center;
  }

  .text-editor::placeholder {
    color: var(--muted-foreground);
  }

  .text-editor:focus-visible {
    outline: none;
  }

  .text-editor:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
