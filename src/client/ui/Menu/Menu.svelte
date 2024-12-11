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

  import type { Color, FontSize } from 'client/shared/interfaces';
  import { COLOR_LIST, FONT_SIZES } from 'client/shared/constants';

  export let onItalic: () => void;
  export let onBold: () => void;
  export let onTextAlignChange: (index: number) => void;
  export let onColorChange: (color: Color['value']) => void;
  export let onFontSizeChange: (fontSize: FontSize['value']) => void;

  let fontSize = '16';
  let color = '#70d6ff';

  const FONT_STYLE_LIST = [
    {
      value: 'bold',
      ariaLabel: 'Toggle bold',
      Icon: Bold,
      onClick: () => onBold(),
    },
    {
      value: 'italic',
      ariaLabel: 'Toggle italic',
      Icon: Italic,
      onClick: () => onItalic(),
    },
  ];

  const TEXT_ALIGN_LIST = [
    {
      value: 'align-left',
      ariaLabel: 'Left',
      Icon: AlignLeft,
      onClick: () => onTextAlignChange(0),
    },
    {
      value: 'align-center',
      ariaLabel: 'Center',
      Icon: AlignCenter,
      onClick: () => onTextAlignChange(1),
    },
    {
      value: 'align-right',
      ariaLabel: 'Right',
      Icon: AlignRight,
      onClick: () => onTextAlignChange(2),
    },
  ];
</script>

<Menubar.Root>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button variant="ghost" builders={[builder]}>Color</Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content id="text-editor-menu-dropdown" class="w-56">
      <DropdownMenu.RadioGroup bind:value={color}>
        {#each COLOR_LIST as { value }}
          <DropdownMenu.RadioItem {value} on:click={() => onColorChange(value)}>
            <div style:background-color={value} class="h-6 w-16 rounded-md"></div>
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <Separator orientation="vertical" />

  <ToggleGroup.Root type="multiple">
    {#each FONT_STYLE_LIST as { value, ariaLabel, Icon, onClick }}
      <ToggleGroup.Item {value} aria-label={ariaLabel} on:click={onClick}>
        <Icon class="h-4 w-4" />
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>

  <Separator orientation="vertical" />

  <ToggleGroup.Root>
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
        {#each FONT_SIZES as { value, label }}
          <DropdownMenu.RadioItem {value} on:click={() => onFontSizeChange(value)}>
            <span>{label}</span>
          </DropdownMenu.RadioItem>
        {/each}
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</Menubar.Root>
