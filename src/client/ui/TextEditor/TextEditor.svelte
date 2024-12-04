<script lang="ts">
  import Menu from 'client/ui/Menu/Menu.svelte';
  import type { DoubleClickData } from 'client/shared/interfaces';

  export let position: DoubleClickData;

  const SMALL_PADDING = 5;

  let textareaRef: HTMLTextAreaElement;
  let textValue = '';
  let isVisible = true;
  let scale = 1;

  const onChange = (e: Event) => {
    textValue = (e.target as HTMLTextAreaElement).value;
  };
</script>

<div
  id="text-editor-menu"
  class="menu"
  style:top={`${position.y - 15 * scale}px`}
  style:left={`${position.x + (position.layerWidth * scale) / 2}px`}
>
  <Menu />
</div>

<!-- svelte-ignore a11y-autofocus -->
<textarea
  autofocus
  bind:this={textareaRef}
  bind:value={textValue}
  class="text-editor"
  style:visibility={isVisible ? 'visible' : 'hidden'}
  style:left={`${position.x + SMALL_PADDING * scale}px`}
  style:top={`${position.y + SMALL_PADDING * scale}px`}
  style:width={`${position.layerWidth - SMALL_PADDING * 2}px`}
  style:height={`${position.layerHeight - SMALL_PADDING * 2}px`}
  style:transform={`scale(${scale})`}
  on:change={onChange}
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
    z-index: 99;
  }
</style>
