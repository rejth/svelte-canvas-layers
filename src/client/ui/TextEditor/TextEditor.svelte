<script lang="ts">
  import type { Point } from 'core/interfaces';

  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import { DEFAULT_FONT_SIZE, SMALL_PADDING } from 'client/shared/constants';
  import { canvasStore } from 'client/ui/Canvas/store';

  import TextEditorMenu from './TextEditorMenu.svelte';

  export let anchorId: string | undefined;
  export let position: Point | undefined;

  const { shapes, textEditor } = canvasStore;
  const { x = 0, y = 0 } = position || {};

  let textareaRef: HTMLTextAreaElement;
  let adaptiveFontSize = $textEditor?.fontSize || DEFAULT_FONT_SIZE;
  let textValue = $textEditor?.text || '';

  $: shape = $shapes.get(anchorId || '') as BaseCanvasEntity<RectDrawOptions>;
  $: width = shape?.getOptions().width;
  $: height = shape?.getOptions().height;
  $: scale = shape?.getScale() || 1;

  $: bold = $textEditor?.bold || false;
  $: italic = $textEditor?.italic || false;
  $: underline = $textEditor?.underline || false;
  $: fontSize = $textEditor?.fontSize || DEFAULT_FONT_SIZE;
  $: textAlign = $textEditor?.textAlign || 'left';

  const handleTextChange = (e: Event) => {
    textValue = (e.target as HTMLTextAreaElement).value;
    canvasStore.updateTextEditor({ text: textValue, fontSize: calculateFontSize(fontSize) });
  };

  // TODO: Update font size on active layer scale or layerHeight value change
  const calculateFontSize = (fontSize: number) => {
    if (!textareaRef) return fontSize;

    let nextFontSize = fontSize;

    if (textareaRef.scrollHeight * scale > height - SMALL_PADDING) {
      nextFontSize = nextFontSize - 2;
    }

    if (textareaRef.value.length < textValue.length && nextFontSize < adaptiveFontSize) {
      textareaRef.style.fontSize = `${nextFontSize + 2}px`;

      if (textareaRef.scrollHeight * scale <= height - SMALL_PADDING) {
        nextFontSize = nextFontSize + 2;
      } else {
        textareaRef.style.fontSize = `${nextFontSize}px`;
      }
    }

    return nextFontSize;
  };

  // TODO: Scale the text area according to the active layer scale value

  // const square = activeLayer.getChildByType(['rect', 'rounded-rect']);
  // const squareOptions = square?.getOptions();
  // const transform = viewport.renderer?.getTransform();
  // const inverseScale = 1 / (transform.scaleX / transform.initialScale);
  // const textEditorScale = scale / inverseScale;
</script>

<TextEditorMenu {textareaRef} anchor={shape} {position} />

<!-- svelte-ignore a11y-autofocus -->
<textarea
  autofocus
  id="text-editor"
  class="text-editor"
  placeholder="Enter text"
  bind:this={textareaRef}
  bind:value={textValue}
  style:left={`${x + SMALL_PADDING * scale}px`}
  style:top={`${y + SMALL_PADDING * scale}px`}
  style:width={`${width - SMALL_PADDING * 2}px`}
  style:height={`${height - SMALL_PADDING * 2}px`}
  style:transform={`scale(${scale})`}
  style:font-size={`${fontSize}px`}
  style:font-style={italic ? 'italic' : ''}
  style:font-weight={bold ? 800 : 400}
  style:text-decoration={underline ? 'underline' : ''}
  style:text-align={textAlign}
  on:input={handleTextChange}
/>

<style>
  .text-editor {
    position: absolute;
    padding: 0;
    line-break: anywhere;
    background: transparent;
    overflow: hidden;
    resize: none;
    z-index: 10;
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
