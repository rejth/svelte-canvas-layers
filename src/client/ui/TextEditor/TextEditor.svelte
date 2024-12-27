<script lang="ts">
  import { cn } from '$lib/utils.js';

  import { DEFAULT_FONT_SIZE, SMALL_PADDING } from 'client/shared/constants';
  import type { DoubleClickData } from 'client/shared/interfaces';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import { canvasStore } from 'client/ui/Canvas/store';

  import TextEditorMenu from './TextEditorMenu.svelte';

  export let anchorData: DoubleClickData;

  const { shapes, textEditor } = canvasStore;
  const { entityId, x, y, layerWidth, layerHeight } = anchorData;

  let textareaRef: HTMLTextAreaElement;
  let adaptiveFontSize = $textEditor?.fontSize || DEFAULT_FONT_SIZE;
  let textValue = $textEditor?.text || '';

  $: shape = $shapes.get(entityId) as BaseCanvasEntity<RectDrawOptions>;

  $: bold = $textEditor?.bold || false;
  $: italic = $textEditor?.italic || false;
  $: fontSize = $textEditor?.fontSize || DEFAULT_FONT_SIZE;
  $: textAlign = $textEditor?.textAlign || 'left';
  $: scale = shape?.getScale() || 1;

  const handleTextChange = (e: Event) => {
    textValue = (e.target as HTMLTextAreaElement).value;
    canvasStore.updateTextEditor({ text: textValue, fontSize: calculateFontSize(fontSize) });
  };

  // TODO: Update font size on active layer scale or layerHeight value change
  const calculateFontSize = (fontSize: number) => {
    if (!textareaRef) return fontSize;

    let nextFontSize = fontSize;

    if (textareaRef.scrollHeight * scale > layerHeight - SMALL_PADDING) {
      nextFontSize = nextFontSize - 2;
    }

    if (textareaRef.value.length < textValue.length && nextFontSize < adaptiveFontSize) {
      textareaRef.style.fontSize = `${nextFontSize + 2}px`;

      if (textareaRef.scrollHeight * scale <= layerHeight - SMALL_PADDING) {
        nextFontSize = nextFontSize + 2;
      } else {
        textareaRef.style.fontSize = `${nextFontSize}px`;
      }
    }

    return nextFontSize;
  };

  const handleFontSizeChange = (value: number) => {
    adaptiveFontSize = calculateFontSize(value);
  };

  // TODO: Scale the text area according to the active layer scale value

  // const square = activeLayer.getChildByType(['rect', 'rounded-rect']);
  // const squareOptions = square?.getOptions();
  // const transform = viewport.renderer?.getTransform();
  // const inverseScale = 1 / (transform.scaleX / transform.initialScale);
  // const textEditorScale = scale / inverseScale;
</script>

<TextEditorMenu {anchorData} {textareaRef} calculateFontSize={handleFontSizeChange} />

<!-- svelte-ignore a11y-autofocus -->
<textarea
  autofocus
  class={cn(
    'flex min-h-[80px] w-full bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    'text-editor',
  )}
  bind:this={textareaRef}
  bind:value={textValue}
  style:left={`${x + SMALL_PADDING * scale}px`}
  style:top={`${y + SMALL_PADDING * scale}px`}
  style:width={`${layerWidth - SMALL_PADDING * 2}px`}
  style:height={`${layerHeight - SMALL_PADDING * 2}px`}
  style:transform={`scale(${scale})`}
  style:font-size={`${fontSize}px`}
  style:font-style={italic ? 'italic' : ''}
  style:font-weight={bold ? 800 : 400}
  style:text-align={textAlign}
  on:input={handleTextChange}
/>

<style>
  .text-editor {
    background: transparent;
    position: absolute;
    padding: 0;
    line-break: anywhere;
    overflow: hidden;
    resize: none;
    z-index: 10;
  }
</style>
