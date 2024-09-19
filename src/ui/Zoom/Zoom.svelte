<script lang="ts">
</script>

<div class="zoom">
  <ul class="zoom-menu-list">
    <li class="zoom-menu-list-item">
      <button class="icon-button icon-button-medium icon-button-fill" value="zoom" type="button"> - </button>
    </li>
    <li class="zoom-menu-list-item">100%</li>
    <li class="zoom-menu-list-item">
      <button class="icon-button icon-button-medium icon-button-fill" value="zoom" type="button"> + </button>
    </li>
  </ul>
</div>

<style>
  .zoom {
    position: absolute;
    display: flex;
    align-items: center;
    right: 1em;
    bottom: 1.5em;
    border: 2px solid #f4f4f6;
    box-shadow: 0px 2px 6px 0px #00263a0f;
    background: white;
    border-radius: 6px;
    pointer-events: all;
  }

  .zoom-menu-list {
    display: flex;
    width: 100%;
  }

  .zoom-menu-list-item {
    align-items: center;
    background: transparent;
    display: flex;
    justify-content: center;
    margin-right: 5px;
    min-width: 2em;
  }

  .icon-button {
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    height: 2.5em;
    justify-content: center;
    outline: none;
  }

  .icon-button-medium {
    padding: 0.5em 0.5rem;
  }

  .icon-button-fill {
    width: 100%;
  }
</style>
