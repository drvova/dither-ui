<script lang="ts">
  import { copier } from "../copy.svelte"

  type Props = { code: string }
  let { code }: Props = $props()

  const clip = copier()
  const copy = () => clip.copy(code)
  // Under sm the copy chip takes its own band over the first line, which
  // ran under it on a phone (as the Vue docs' code block does).
</script>

<div class="relative rounded-lg border border-transparent bg-background/60 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
  <button
    type="button"
    class="absolute top-2 right-2 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    onclick={copy}
  >
    {clip.copied ? "copied" : "copy"}
  </button>
  <pre class="overflow-x-auto p-4 pt-10 font-mono sm:pt-4 text-[12px] leading-relaxed text-foreground"><code>{code}</code></pre>
</div>
