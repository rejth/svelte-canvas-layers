<script lang="ts">
  export let isVisible: boolean;
</script>

{#if isVisible}
  <slot />
{/if}
