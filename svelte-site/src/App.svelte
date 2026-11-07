<script lang="ts">
  import { tick } from "svelte"
  import Landing from "./landing/Landing.svelte"
  import DocsPage from "./docs/DocsPage.svelte"

  // Minimal hash router: `#/docs[...]` → docs, everything else → landing.
  let hash = $state(location.hash)
  const isDocs = $derived(hash.startsWith("#/docs"))
  const onHash = async () => {
    const was = isDocs
    hash = location.hash
    if (was === isDocs) return
    // Moved between the docs and the landing: the browser looked for an
    // anchor (`#examples`, from the docs' header) before the page held it,
    // so go there once it has rendered; otherwise read from the top.
    await tick()
    const target = !isDocs && hash.length > 1 && !hash.startsWith("#/") ? document.getElementById(hash.slice(1)) : null
    if (target) target.scrollIntoView()
    else window.scrollTo({ top: 0, behavior: "auto" })
  }
</script>

<svelte:window onhashchange={onHash} />

{#if isDocs}
  <DocsPage />
{:else}
  <Landing />
{/if}
