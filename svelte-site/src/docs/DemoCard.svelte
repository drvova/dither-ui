<script lang="ts">
  // A demo as the Vue docs set one (src/pages/docs/DemoCard.vue): the
  // Preview and Code tabs as machined segments in a track, the picked one
  // ringed, and the preview in the gel well (an asymmetric pebble recessed
  // into the page, rimmed in chrome, one plain ground).
  import type { Snippet } from "svelte"
  import CodeBlock from "./CodeBlock.svelte"

  type Props = { code: string; children?: Snippet }
  let { code, children }: Props = $props()

  let tab = $state<"preview" | "code">("preview")
  const tabClass = (on: boolean) =>
    `h-7 px-3.5 transition-colors ${on ? "ring-on" : "text-muted-foreground hover:text-foreground"}`
</script>

<div class="mt-6" data-demo-card>
  <div class="track mb-2 text-[12px]" role="tablist">
    <button type="button" role="tab" aria-selected={tab === "preview"} class={tabClass(tab === "preview")} onclick={() => (tab = "preview")}>
      Preview
    </button>
    <button type="button" role="tab" aria-selected={tab === "code"} class={tabClass(tab === "code")} onclick={() => (tab = "code")}>
      Code
    </button>
  </div>

  {#if tab === "preview"}
    <div class="demo-well rim relative mt-3 flex min-h-[280px] items-center justify-center p-4 sm:p-10">
      <div class="w-full">{@render children?.()}</div>
    </div>
  {:else}
    <div class="mt-3"><CodeBlock {code} /></div>
  {/if}
</div>
