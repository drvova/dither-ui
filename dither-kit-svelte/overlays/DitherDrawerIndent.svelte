<script lang="ts">
  import type { Snippet } from "svelte"
  import { setDrawerChannel } from "./DitherDrawer.svelte"
  import { cn } from "../runtime/lib"

  /** Wrap your app's main UI: it scales back while any root drawer inside is
   * open — the same channel nested drawers use, provided at app level. */
  type Props = { class?: string; children?: Snippet }
  let { class: className, children }: Props = $props()

  let openCount = $state(0)
  setDrawerChannel({ notify: (d) => (openCount += d) })
</script>

<div
  class={cn(
    "origin-top transition-[transform,filter,border-radius] duration-200 motion-reduce:transition-none",
    openCount > 0 ? "scale-[0.98] rounded-xl brightness-75" : "",
    className
  )}
>
  {@render children?.()}
</div>
