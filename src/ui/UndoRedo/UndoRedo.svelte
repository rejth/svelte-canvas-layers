<script lang="ts">
  import RedoIcon from './RedoIcon.svelte';
  import UndoIcon from './UndoIcon.svelte';

  const undo = () => {};
  const redo = () => {};
</script>

<div class="undo-redo-toolbar">
  <div class="undo-redo">
    <span tabindex="0" role="button" class="icon" class:disabled={false} on:click={undo} on:keydown={undo}>
      <UndoIcon color={'#00263A'} />
    </span>
    <span tabindex="0" role="button" class="icon" class:disabled={false} on:click={redo} on:keydown={redo}>
      <RedoIcon color={'#00263A'} />
    </span>
  </div>
</div>

<style>
  .undo-redo-toolbar {
    position: absolute;
    font-size: 1em;
    left: 1em;
    bottom: 1.5em;

    border: 2px solid #f4f4f6;
    box-shadow: 0px 2px 6px 0px #00263a0f;
    background: white;
    border-radius: 6px;
    pointer-events: all;
  }

  .undo-redo {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon {
    width: 2em;
    min-width: 2em;
    height: 1.5em;
    padding: 0.5em 0.5rem;
    margin: 0;
    cursor: pointer;
    background-size: contain;
    background-repeat: no-repeat;
  }

  .disabled {
    pointer-events: none;
  }
</style>
