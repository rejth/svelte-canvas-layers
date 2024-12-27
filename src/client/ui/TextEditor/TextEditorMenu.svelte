<script lang="ts">
  import Bold from 'lucide-svelte/icons/bold';
  import Italic from 'lucide-svelte/icons/italic';
  import AlignLeft from 'lucide-svelte/icons/align-left';
  import AlignCenter from 'lucide-svelte/icons/align-center';
  import AlignRight from 'lucide-svelte/icons/align-right';

  import * as Menubar from '$lib/components/ui/menubar/index.js';
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator';

  import type { Color, DoubleClickData, FontSize } from 'client/shared/interfaces';
  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { canvasStore } from 'client/ui/Canvas/store';
  import { COLORS } from 'client/shared/constants';
  import * as constants from 'client/shared/constants';

  export let anchorData: DoubleClickData;
  export let textareaRef: HTMLTextAreaElement | null;
  export let calculateFontSize: (value: number) => void;

  const { entityId, x, y, layerWidth } = anchorData;
  const { shapes, textEditor } = canvasStore;

  $: shape = $shapes.get(entityId) as BaseCanvasEntity<RectDrawOptions>;

  $: bold = $textEditor?.bold || false;
  $: italic = $textEditor?.italic || false;
  $: fontStyle = [bold ? 'bold' : '', italic ? 'italic' : ''];
  $: fontSize = `${$textEditor?.fontSize || constants.DEFAULT_FONT_SIZE}`;
  $: textAlign = $textEditor?.textAlign || constants.TEXT_ALIGN[0];
  $: color = shape?.getOptions()?.color || constants.COLORS.STICKER_YELLOW;
  $: scale = shape?.getScale() || 1;

  const FONT_STYLE_LIST = [
    {
      value: 'bold',
      ariaLabel: 'Toggle bold',
      Icon: Bold,
      onClick: () => handleBold(),
    },
    {
      value: 'italic',
      ariaLabel: 'Toggle italic',
      Icon: Italic,
      onClick: () => handleItalic(),
    },
  ];

  const TEXT_ALIGN_LIST = [
    {
      value: constants.TEXT_ALIGN[0],
      ariaLabel: 'Left',
      Icon: AlignLeft,
      onClick: () => handleTextAlignChange(0),
    },
    {
      value: constants.TEXT_ALIGN[1],
      ariaLabel: 'Center',
      Icon: AlignCenter,
      onClick: () => handleTextAlignChange(1),
    },
    {
      value: constants.TEXT_ALIGN[2],
      ariaLabel: 'Right',
      Icon: AlignRight,
      onClick: () => handleTextAlignChange(2),
    },
  ];

  const handleFontSizeChange = (value: FontSize['value']) => {
    canvasStore.updateTextEditor({ fontSize: Number(value) });
    calculateFontSize(Number(value));
    textareaRef?.focus();
  };

  const handleColorChange = (value: Color['value']) => {
    canvasStore.updateShape(entityId, { color: value as COLORS });
  };

  const handleBold = () => {
    canvasStore.updateTextEditor({ bold: !bold });
    textareaRef?.focus();
  };

  const handleItalic = () => {
    canvasStore.updateTextEditor({ italic: !italic });
    textareaRef?.focus();
  };

  const handleTextAlignChange = (index: number) => {
    canvasStore.updateTextEditor({ textAlign: constants.TEXT_ALIGN[index] });
    textareaRef?.focus();
  };

  // TODO: Scale the menu according to the active layer scale value

  // const options = activeLayer.getOptions();
  // const transform = viewport.renderer?.getTransform();
  // const inverseScale = 1 / (transform.scaleX / transform.initialScale);
  // const menuScale = scale === 1 ? scale / inverseScale : transform.scaleX / transform.initialScale;
</script>

<div
  class="menu"
  id="text-editor-menu"
  style:top={`${y - 15 * scale}px`}
  style:left={`${x + (layerWidth * scale) / 2}px`}
>
  <Menubar.Root>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button variant="ghost" builders={[builder]}>Color</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content id="text-editor-menu-dropdown" class="w-56">
        <DropdownMenu.RadioGroup bind:value={color}>
          {#each constants.COLOR_LIST as { value }}
            <DropdownMenu.RadioItem {value} on:click={() => handleColorChange(value)}>
              <div style:background-color={value} class="h-6 w-16 rounded-md"></div>
            </DropdownMenu.RadioItem>
          {/each}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <Separator orientation="vertical" />

    <ToggleGroup.Root type="multiple" bind:value={fontStyle}>
      {#each FONT_STYLE_LIST as { value, ariaLabel, Icon, onClick }}
        <ToggleGroup.Item {value} aria-label={ariaLabel} on:click={onClick}>
          <Icon class="h-4 w-4" />
        </ToggleGroup.Item>
      {/each}
    </ToggleGroup.Root>

    <Separator orientation="vertical" />

    <ToggleGroup.Root bind:value={textAlign}>
      {#each TEXT_ALIGN_LIST as { value, ariaLabel, Icon, onClick }}
        <ToggleGroup.Item {value} aria-label={ariaLabel} on:click={onClick}>
          <Icon class="h-4 w-4" />
        </ToggleGroup.Item>
      {/each}
    </ToggleGroup.Root>

    <Separator orientation="vertical" />

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button variant="ghost" builders={[builder]}>Font size</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content id="text-editor-menu-dropdown" class="w-56">
        <DropdownMenu.RadioGroup bind:value={fontSize}>
          {#each constants.FONT_SIZES as { value, label }}
            <DropdownMenu.RadioItem {value} on:click={() => handleFontSizeChange(value)}>
              {label}
            </DropdownMenu.RadioItem>
          {/each}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Menubar.Root>
</div>

<style>
  .menu {
    display: flex;
    align-items: center;
    position: absolute;
    z-index: 10;
    transform: translate(-50%, -100%);
  }
</style>
