<script lang="ts">
  type Props = { code: string }
  let { code }: Props = $props()

  let copied = $state(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      copied = true
      setTimeout(() => (copied = false), 1400)
    } catch {
      copied = false
    }
  }
</script>

<div class="relative rounded-lg border border-transparent bg-background/60 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
  <button
    type="button"
    class="absolute top-2 right-2 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    onclick={copy}
  >
    {copied ? "copied" : "copy"}
  </button>
  <pre class="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground"><code>{code}</code></pre>
</div>
