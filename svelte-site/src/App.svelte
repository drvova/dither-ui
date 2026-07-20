<script lang="ts">
  import Landing from "./Landing.svelte"
  import DocsPage from "./docs/DocsPage.svelte"

  // Minimal hash router: `#/docs[...]` → docs, everything else → landing.
  let hash = $state(location.hash)
  const onHash = () => (hash = location.hash)
  const isDocs = $derived(hash.startsWith("#/docs"))
</script>

<svelte:window onhashchange={onHash} />

{#if isDocs}
  <DocsPage />
{:else}
  <Landing />
{/if}
