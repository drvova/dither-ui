<script lang="ts">
  import type { Snippet } from "svelte"

  type Props = { legend: string; children?: Snippet }

  let { legend, children }: Props = $props()
</script>

<fieldset class="rounded-lg border border-border/60 p-4">
  <legend class="px-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
    {legend}
  </legend>
  <div class="grid gap-4">
    {@render children?.()}
  </div>
</fieldset>
