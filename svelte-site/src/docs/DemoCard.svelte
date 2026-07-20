<script lang="ts">
  import type { Snippet } from "svelte"
  import CodeBlock from "./CodeBlock.svelte"

  type Props = { code: string; children?: Snippet }
  let { code, children }: Props = $props()

  let tab = $state<"preview" | "code">("preview")
</script>

<div class="mt-6">
  <div class="flex gap-4 text-[12px]" role="tablist">
    <button
      type="button"
      role="tab"
      aria-selected={tab === "preview"}
      class="border-b pb-2 transition-colors {tab === 'preview'
        ? 'border-foreground text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground'}"
      onclick={() => (tab = "preview")}
    >
      Preview
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === "code"}
      class="border-b pb-2 transition-colors {tab === 'code'
        ? 'border-foreground text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground'}"
      onclick={() => (tab = "code")}
    >
      Code
    </button>
  </div>

  {#if tab === "preview"}
    <div class="mt-3 flex min-h-[280px] items-center justify-center rounded-lg border border-border/60 p-8 sm:p-10">
      <div class="w-full">{@render children?.()}</div>
    </div>
  {:else}
    <div class="mt-3"><CodeBlock {code} /></div>
  {/if}
</div>
