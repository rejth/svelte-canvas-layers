<script lang="ts">
  import Bold from 'lucide-svelte/icons/bold';
  import Italic from 'lucide-svelte/icons/italic';
  import Underline from 'lucide-svelte/icons/underline';
  import AlignLeft from 'lucide-svelte/icons/align-left';
  import AlignCenter from 'lucide-svelte/icons/align-center';
  import AlignRight from 'lucide-svelte/icons/align-right';

  import * as Menubar from '$lib/components/ui/menubar/index.js';
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator';

  let fontSize = 'medium';
  let color = 'blue';
</script>

<Menubar.Root>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button variant="ghost" builders={[builder]}>Color</Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content id="text-editor-menu-dropdown" class="w-56">
      <DropdownMenu.RadioGroup bind:value={color}>
        <DropdownMenu.RadioItem value="blue">Blue</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="red">Red</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="green">Green</DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <Separator orientation="vertical" />

  <ToggleGroup.Root type="multiple">
    <ToggleGroup.Item value="bold" aria-label="Toggle bold">
      <Bold class="h-4 w-4" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="italic" aria-label="Toggle italic">
      <Italic class="h-4 w-4" />
    </ToggleGroup.Item>
  </ToggleGroup.Root>

  <Separator orientation="vertical" />

  <ToggleGroup.Root>
    <ToggleGroup.Item value="align-left" aria-label="Text align">
      <AlignLeft class="h-4 w-4" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="align-center" aria-label="Text align">
      <AlignCenter class="h-4 w-4" />
    </ToggleGroup.Item>
    <ToggleGroup.Item value="align-right" aria-label="Text align">
      <AlignRight class="h-4 w-4" />
    </ToggleGroup.Item>
  </ToggleGroup.Root>

  <Separator orientation="vertical" />

  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button variant="ghost" builders={[builder]}>Font size</Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content id="text-editor-menu-dropdown" class="w-56">
      <DropdownMenu.RadioGroup bind:value={fontSize}>
        <DropdownMenu.RadioItem value="tiny">Tiny</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="small">Small</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="medium">Medium</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="big">Big</DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem value="large">Large</DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</Menubar.Root>
