<script lang="ts">
  import { Tools, type Tool } from 'client/shared/interfaces';
  import { canvasStore } from 'client/ui/Canvas/store';
  import { connectionStore } from 'client/ui/Connection/store';

  import PanIcon from './PanIcon.svelte';
  import SelectIcon from './SelectIcon.svelte';
  import NoteIcon from './NoteIcon.svelte';
  import TextIcon from './TextIcon.svelte';
  import TrashIcon from './TrashIcon.svelte';
  import ConnectIcon from './ConnectIcon.svelte';
  import { toolbarStore } from './store';

  const { tool } = toolbarStore;
  const { selectedShapes } = canvasStore;
  const { selectedConnections } = connectionStore;

  $: tools = [
    {
      id: 'note',
      label: 'Note',
      type: Tools.NOTE,
      icon: NoteIcon,
      hoverText: 'Drag to add a new sticker',
      disabled: false,
    },
    {
      id: 'text',
      label: 'Text',
      type: Tools.TEXT,
      icon: TextIcon,
      hoverText: 'Drag to add a new text area',
      disabled: true,
    },
    {
      id: 'pan',
      label: 'Pan',
      type: Tools.PAN,
      icon: PanIcon,
      hoverText: 'Panning',
      disabled: false,
    },
    {
      id: 'select',
      label: 'Select',
      type: Tools.SELECT,
      icon: SelectIcon,
      hoverText: 'Selection',
      disabled: false,
    },
    {
      id: 'connect',
      label: 'Connect',
      type: Tools.CONNECT,
      icon: ConnectIcon,
      hoverText: 'Connect tool',
      disabled: false,
    },
    {
      id: 'trash',
      label: 'Delete',
      type: Tools.DELETE,
      icon: TrashIcon,
      hoverText: 'Delete selected item(s)',
      disabled: $selectedShapes.size === 0 && Object.keys($selectedConnections).length === 0,
    },
  ];

  const handleDelete = () => {
    canvasStore.deleteShape();
    connectionStore.removeConnection();
  };

  const onClick = (type: Tool) => {
    if (type === Tools.DELETE) return handleDelete();
    canvasStore.resetSelectedShapes();
    toolbarStore.changeTool(type);
  };
</script>

<ul class="toolbar" id="toolbar">
  {#each tools as { id, type, label, icon, hoverText, disabled }}
    <li>
      <span
        {id}
        tabindex="0"
        role="button"
        class="tool"
        on:click={() => onClick(type)}
        on:keydown={() => onClick(type)}
      >
        <span
          class="icon"
          class:active={$tool === type && !disabled}
          class:disabled
          title={hoverText}
        >
          <svelte:component this={icon} />
        </span>
        <span class="text">{label}</span>
      </span>
    </li>
  {/each}
</ul>

<style>
  .toolbar {
    position: fixed;
    top: 1rem;
    left: 50%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    margin: 1rem;
    padding: 0.5em 0.4em 0.2em;
    box-shadow: 0 2px 6px 0 #00263a0f;
    background-color: #ffffff;

    border: 2px solid #f4f4f6;
    border-radius: 6px;
    transform: translateX(-50%);
    pointer-events: all;
    z-index: 100;
  }

  .tool {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin: 0 0.2em 0.2em;
  }

  .icon {
    font-size: 1em !important;
    display: inline-block;
    width: 3em;
    min-width: 2em;
    height: 3em;
    padding: 0.5em 0.5rem;
    margin: 0;
    cursor: pointer;
    background-size: contain;
    background-repeat: no-repeat;
  }

  .disabled {
    color: #d3d3d3;
    pointer-events: none;
  }

  .active {
    background-color: #f4f4f6;
  }

  .text {
    font-size: 0.8em;
    margin: 0;
    margin-top: 0.5em;
    text-align: center;
  }
</style>
