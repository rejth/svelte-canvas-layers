<script lang="ts">
  import Bold from 'lucide-svelte/icons/bold';
  import Italic from 'lucide-svelte/icons/italic';
  import Underline from 'lucide-svelte/icons/underline';
  import AlignLeft from 'lucide-svelte/icons/align-left';
  import AlignCenter from 'lucide-svelte/icons/align-center';
  import AlignRight from 'lucide-svelte/icons/align-right';
  import AArrowUp from 'lucide-svelte/icons/a-arrow-up';
  import AArrowDown from 'lucide-svelte/icons/a-arrow-down';

  import * as Menubar from '$lib/components/ui/menubar/index.js';
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator';

  import type { Point } from 'core/interfaces';

  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { canvasStore } from 'client/ui/Canvas/store';

  import ColorTile from './ColorTile.svelte';
  import {
    COLORS,
    DEFAULT_FONT_SIZE,
    FONTS,
    FontStyle,
    TextAlign,
    TextDecoration,
  } from 'client/shared/constants';

  export let anchor: BaseCanvasEntity<RectDrawOptions>;
  export let position: Point | undefined;
  export let textareaRef: HTMLTextAreaElement | null;

  const { textEditor } = canvasStore;
  const { x = 0, y = 0 } = position || {};

  $: width = anchor?.getOptions()?.width || 0;
  $: color = anchor?.getOptions()?.color || COLORS.STICKER_YELLOW;
  $: scale = anchor?.getScale() || 1;

  $: bold = $textEditor?.bold || false;
  $: italic = $textEditor?.italic || false;
  $: underline = $textEditor?.underline || false;
  $: fontStyle = [
    bold ? FontStyle.BOLD : '',
    italic ? FontStyle.ITALIC : '',
    underline ? TextDecoration.UNDERLINE : '',
  ];
  $: fontSize = `${$textEditor?.fontSize || DEFAULT_FONT_SIZE}`;
  $: font = $textEditor?.font || FONTS[0].value;
  $: textAlign = $textEditor?.textAlign || TextAlign.LEFT;

  const FONT_STYLE_LIST = [
    {
      value: FontStyle.BOLD,
      ariaLabel: 'Toggle bold',
      Icon: Bold,
      onClick: () => handleBold(),
    },
    {
      value: FontStyle.ITALIC,
      ariaLabel: 'Toggle italic',
      Icon: Italic,
      onClick: () => handleItalic(),
    },
    {
      value: TextDecoration.UNDERLINE,
      ariaLabel: 'Toggle underline',
      Icon: Underline,
      onClick: () => handleUnderline(),
    },
  ];

  const TEXT_ALIGN_OPTIONS = {
    [TextAlign.LEFT]: {
      value: TextAlign.LEFT,
      ariaLabel: 'Toggle left alignment',
      Icon: AlignLeft,
      onClick: () => handleTextAlignChange(TextAlign.LEFT),
    },
    [TextAlign.CENTER]: {
      value: TextAlign.CENTER,
      ariaLabel: 'Toggle center alignment',
      Icon: AlignCenter,
      onClick: () => handleTextAlignChange(TextAlign.CENTER),
    },
    [TextAlign.RIGHT]: {
      value: TextAlign.RIGHT,
      ariaLabel: 'Toggle right alignment',
      Icon: AlignRight,
      onClick: () => handleTextAlignChange(TextAlign.RIGHT),
    },
  };

  const FONT_SIZE_OPTIONS = [
    {
      value: 'decrease',
      ariaLabel: 'Decrease font size',
      Icon: AArrowDown,
      onClick: () => handleFontSizeChange(-2),
    },
    {
      value: 'increase',
      ariaLabel: 'Increase font size',
      Icon: AArrowUp,
      onClick: () => handleFontSizeChange(2),
    },
  ];

  $: align = TEXT_ALIGN_OPTIONS[textAlign];

  const handleFontSizeChange = (value: number) => {
    const newFontSize = Number(fontSize) + value;
    canvasStore.updateTextEditor({ fontSize: newFontSize });
    textareaRef?.focus();
  };

  const handleBold = () => {
    canvasStore.updateTextEditor({ bold: !bold });
    textareaRef?.focus();
  };

  const handleItalic = () => {
    canvasStore.updateTextEditor({ italic: !italic });
    textareaRef?.focus();
  };

  const handleUnderline = () => {
    canvasStore.updateTextEditor({ underline: !underline });
    textareaRef?.focus();
  };

  const handleTextAlignChange = (value: TextAlign) => {
    let align = value;
    if (value === TextAlign.LEFT) {
      align = TextAlign.CENTER;
    } else if (value === TextAlign.CENTER) {
      align = TextAlign.RIGHT;
    } else if (value === TextAlign.RIGHT) {
      align = TextAlign.LEFT;
    }
    canvasStore.updateTextEditor({ textAlign: align });
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
  style:left={`${x + (width * scale) / 2}px`}
>
  <Menubar.Root>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button variant="ghost" builders={[builder]}>
          <span class="h-6 w-6" style:background-color={color}></span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content id="text-editor-menu-dropdown" class="w-56">
        <ColorTile {anchor} />
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <Separator orientation="vertical" />

    <ToggleGroup.Root type="multiple" size="sm" bind:value={fontStyle}>
      {#each FONT_STYLE_LIST as { value, ariaLabel, Icon, onClick }}
        <ToggleGroup.Item {value} aria-label={ariaLabel} on:click={onClick}>
          <Icon class="h-4 w-4" />
        </ToggleGroup.Item>
      {/each}
    </ToggleGroup.Root>

    <Separator orientation="vertical" />

    <ToggleGroup.Root bind:value={textAlign}>
      <ToggleGroup.Item value={align.value} aria-label={align.ariaLabel} on:click={align.onClick}>
        <svelte:component this={align.Icon} class="h-4 w-4" />
      </ToggleGroup.Item>
    </ToggleGroup.Root>

    <Separator orientation="vertical" />

    <ToggleGroup.Root size="sm">
      {#each FONT_SIZE_OPTIONS as { value, ariaLabel, Icon, onClick }}
        <ToggleGroup.Item {value} aria-label={ariaLabel} on:click={onClick}>
          <Icon class="h-6 w-6" strokeWidth={1.25} />
        </ToggleGroup.Item>
      {/each}
    </ToggleGroup.Root>

    <Separator orientation="vertical" />

    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button variant="ghost" disabled builders={[builder]}>Font</Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content id="text-editor-menu-dropdown" class="w-56">
        <DropdownMenu.RadioGroup bind:value={font}>
          {#each FONTS as { value, label }}
            <DropdownMenu.RadioItem {value} on:click={() => {}}>
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
