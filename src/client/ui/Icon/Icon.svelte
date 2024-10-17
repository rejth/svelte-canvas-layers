<script>
  export let src = '';
  export let alt = 'Icon';
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<svelte:element this="img" {src} class={$$props.class} {alt} on:click on:keydown />

<style></style>
