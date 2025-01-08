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

  import type { Point, TransformationMatrix } from 'core/interfaces';

  import type { RectDrawOptions } from 'client/ui/Canvas/CanvasRect';
  import type { BaseCanvasEntity } from 'client/ui/Canvas/BaseCanvasEntity';
  import { ShapeType } from 'client/shared/interfaces';
  import { canvasStore } from 'client/ui/Canvas/store';
  import When from 'client/ui/When/When.svelte';
  import {
    COLORS,
    DEFAULT_FONT_SIZE,
    DEFAULT_SCALE,
    FONTS,
    FontStyle,
    TextAlign,
    TextDecoration,
  } from 'client/shared/constants';

  import ColorTile from './ColorTile.svelte';

  export let anchor: BaseCanvasEntity<RectDrawOptions>;
  export let position: Point | undefined;
  export let transform: TransformationMatrix | null | undefined;
  export let textareaRef: HTMLTextAreaElement | null;
  export let onFontSizeChange: (fontSize: number) => void;

  const { textEditor } = canvasStore;
  const { x = 0, y = 0 } = position || {};

  $: options = anchor?.getOptions();
  $: width = options?.width || 0;
  $: color = options?.color || COLORS.TRANSPARENT;
  $: scale = options?.scale || DEFAULT_SCALE;

  $: bold = $textEditor?.bold || false;
  $: italic = $textEditor?.italic || false;
  $: underline = $textEditor?.underline || false;
  $: font = $textEditor?.font || FONTS[0].value;
  $: fontSize = `${$textEditor?.fontSize || DEFAULT_FONT_SIZE}`;
  $: textAlign = $textEditor?.textAlign || TextAlign.LEFT;

  $: fontStyle = [
    bold ? FontStyle.BOLD : '',
    italic ? FontStyle.ITALIC : '',
    underline ? TextDecoration.UNDERLINE : '',
  ];

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
  $: menuScale = getMenuScale(scale);

  const getMenuScale = (scale: number) => {
    if (!transform) return DEFAULT_SCALE;
    const inverseScale = DEFAULT_SCALE / (transform.scaleX / transform.initialScale);
    return scale === DEFAULT_SCALE
      ? scale / inverseScale
      : transform.scaleX / transform.initialScale;
  };

  const handleFontSizeChange = (value: number) => {
    const newFontSize = Number(fontSize) + value;
    canvasStore.updateTextEditor({ fontSize: newFontSize });
    onFontSizeChange(newFontSize);
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
</script>

<div
  class="menu"
  id="text-editor-menu"
  style:top={`${y - 15 * menuScale}px`}
  style:left={`${x + (width * menuScale) / 2}px`}
>
  <Menubar.Root>
    <When isVisible={anchor.getShapeType() !== ShapeType.TEXT}>
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
    </When>

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
