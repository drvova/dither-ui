<script lang="ts">
  import { copier } from "../copy.svelte"

  type Props = { code: string }
  let { code }: Props = $props()

  const clip = copier()
  const copy = () => clip.copy(code)
  // Under sm the copy chip takes its own band over the first line, which
  // ran under it on a phone (as the Vue docs' code block does).
</script>

<div class="flat-shell">
  <button
    type="button"
    class="absolute top-2 right-2 h-6 rounded-[7px] px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground ring-on"
    onclick={copy}
  >
    {clip.copied ? "copied" : "copy"}
  </button>
  <pre class="overflow-x-auto p-4 pt-10 font-mono sm:pt-4 text-[12px] leading-relaxed text-foreground"><code>{code}</code></pre>
</div>
