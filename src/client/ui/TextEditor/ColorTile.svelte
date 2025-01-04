<script lang="ts">
  import type { Color } from 'client/shared/interfaces';
  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { COLORS, COLOR_LIST } from 'client/shared/constants';
  import { canvasStore } from 'client/ui/Canvas/store';

  export let anchor: BaseCanvasEntity<RectDrawOptions>;

  const handleColorChange = (value: Color['value']) => {
    canvasStore.updateShape(anchor.id, { color: value as COLORS });
  };
</script>

<div class="colors icon-group">
  {#each COLOR_LIST as { value }}
    <span
      tabindex="0"
      role="button"
      class="icon color"
      style:background-color={value}
      on:click={() => handleColorChange(value)}
      on:keydown={() => handleColorChange(value)}
    ></span>
  {/each}
  <span
    tabindex="0"
    role="button"
    class="icon color transparent"
    on:click={() => handleColorChange('transparent')}
    on:keydown={() => handleColorChange('transparent')}
  ></span>
</div>

<style>
  .colors {
    grid-template-columns: repeat(5, 1fr);
  }

  .icon-group {
    display: inline-grid;
    grid-column-gap: 0.5em;
    grid-row-gap: 0.5em;
  }

  .icon.color {
    height: 1.13em;
    width: 1.13em;
    display: inline-block;
    font-size: 2em;
  }

  .icon.color.transparent {
    border: 1px solid #eeeeee;
    background: repeating-conic-gradient(#dddddd 0% 25%, transparent 0% 50%) 50% / 0.5em 0.5em;
  }
</style>
