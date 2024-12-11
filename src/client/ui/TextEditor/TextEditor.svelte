<script lang="ts">
  import Menu from 'client/ui/Menu/Menu.svelte';
  import type { Color, DoubleClickData, FontSize } from 'client/shared/interfaces';
  import { TEXT_ALIGN } from 'client/shared/constants';

  export let position: DoubleClickData;

  interface TextEditorContextInterface {
    editable: boolean;
    text: string;
    bold: boolean;
    italic: boolean;
    fontSize: number;
    textScale: number;
    textAlign: CanvasTextAlign;
  }

  const SMALL_PADDING = 5;
  const DEFAULT_FONT_SIZE = 16;

  let textareaRef: HTMLTextAreaElement;
  let isVisible = true;
  let scale = 1;

  let userCustomFontSize = DEFAULT_FONT_SIZE;

  // TODO: save the data below in store
  let text = '';
  let fontSize = DEFAULT_FONT_SIZE;
  let bold = false;
  let italic = false;
  let textAlign = 'left';
  let color = '#000000';

  const onTextChange = (e: Event) => {
    fontSize = calculateFontSize(fontSize);
    text = (e.target as HTMLTextAreaElement).value;
    // TODO: save the text and font size in store
  };

  // TODO: update font size on scale change

  const calculateFontSize = (fontSize: number) => {
    if (!textareaRef) return fontSize;

    let nextFontSize = fontSize;
    const { layerHeight } = position;
    // const { h: height, scale } = activeLayer.getOptions();

    // TODO: use active layer scale
    if (textareaRef.scrollHeight * scale > layerHeight - SMALL_PADDING) {
      nextFontSize = nextFontSize - 2;
    }

    if (textareaRef.value.length < text.length && nextFontSize < userCustomFontSize) {
      textareaRef.style.fontSize = `${nextFontSize + 2}px`;

      if (textareaRef.scrollHeight * scale <= layerHeight - SMALL_PADDING) {
        nextFontSize = nextFontSize + 2;
      } else {
        textareaRef.style.fontSize = `${nextFontSize}px`;
      }
    }

    return nextFontSize;
  };

  const handleFontSizeChange = (value: FontSize['value']) => {
    userCustomFontSize = calculateFontSize(Number(value));
  };

  const onFontSizeChange = (value: FontSize['value']) => {
    fontSize = Number(value);
    handleFontSizeChange(value);
    textareaRef?.focus();
  };

  const onColorChange = (value: Color['value']) => {
    color = value;
  };

  const onBold = () => {
    bold = !bold;
    textareaRef?.focus();
  };

  const onItalic = () => {
    italic = !italic;
    textareaRef?.focus();
  };

  const onTextAlignChange = (index: number) => {
    textAlign = TEXT_ALIGN[index];
    textareaRef?.focus();
  };

  // TODO: for the style:top={`${position.y - 15 * scale}px`} and style:left={`${position.x + (position.layerWidth * scale) / 2}px`}
  // const options = activeLayer.getOptions();
  // const transform = renderer.getTransform();

  // const inverseScale = 1 / (transform.scaleX / transform.initialScale);
  // const scale = options.scale !== 1 ? transform.scaleX / transform.initialScale : options.scale / inverseScale;

  // TODO: for the style:transform={`scale(${scale})`}
  // const square = activeLayer.getChildByType(['rect', 'rounded-rect']);
  // const squareOptions = square?.getOptions();
  // const transform = renderer.getTransform();

  // const inverseScale = 1 / (transform.scaleX / transform.initialScale);
  // const scale = squareOptions.scale / inverseScale;
</script>

<div
  id="text-editor-menu"
  class="menu"
  style:top={`${position.y - 15 * scale}px`}
  style:left={`${position.x + (position.layerWidth * scale) / 2}px`}
>
  <Menu {onItalic} {onBold} {onTextAlignChange} {onColorChange} {onFontSizeChange} />
</div>

<!-- svelte-ignore a11y-autofocus -->
<textarea
  autofocus
  bind:this={textareaRef}
  bind:value={text}
  class="text-editor"
  style:visibility={isVisible ? 'visible' : 'hidden'}
  style:left={`${position.x + SMALL_PADDING * scale}px`}
  style:top={`${position.y + SMALL_PADDING * scale}px`}
  style:width={`${position.layerWidth - SMALL_PADDING * 2}px`}
  style:height={`${position.layerHeight - SMALL_PADDING * 2}px`}
  style:transform={`scale(${scale})`}
  style:font-size={`${fontSize}px`}
  style:font-style={italic ? 'italic' : ''}
  style:font-weight={bold ? 800 : 400}
  style:text-align={textAlign}
  on:input={onTextChange}
/>

<style>
  .menu {
    display: flex;
    align-items: center;
    position: absolute;
    z-index: 10;
    transform: translate(-50%, -100%);
  }

  .text-editor {
    border: none;
    background: transparent;
    position: absolute;
    padding: 0;
    box-sizing: border-box;
    line-break: anywhere;
    overflow: hidden;
    resize: none;
    transform-origin: top left;
    outline: none;
    text-align: center;
    z-index: 10;
  }
</style>
