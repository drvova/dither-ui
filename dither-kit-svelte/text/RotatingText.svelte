<script lang="ts">
  import { fly } from "svelte/transition"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    texts?: string[]
    interval?: number
    class?: string
  }

  let { texts = ["Vue", "canvas", "dither"], interval = 2000, class: className }: Props = $props()

  const list = $derived(texts.length ? texts : [""])
  let idx = $state(0)

  // Reduced-motion collapses the vertical slide to a plain fade.
  const rm = pixelPrefersReducedMotion()
  const flyIn = rm ? { y: 0, duration: 200 } : { y: 10, duration: 300 }
  const flyOut = rm ? { y: 0, duration: 200 } : { y: -10, duration: 300 }

  // Timer lives in an action so a change to `texts`/`interval` (encoded in the
  // key) restarts the cycle and resets the index — the guardrail-clean stand-in
  // for Vue's watch, with no `$effect`.
  function rotate(_node: HTMLElement, _key: string) {
    let timer = 0
    function start() {
      clearInterval(timer)
      idx = 0
      if (list.length < 2) return
      timer = window.setInterval(() => {
        idx = (idx + 1) % list.length
      }, Math.max(300, interval))
    }
    start()
    return {
      update() {
        start()
      },
      destroy() {
        clearInterval(timer)
      },
    }
  }
</script>

<span use:rotate={`${list.length}|${interval}`} class={cn("dither-rotating", className)}>
  {#key idx}
    <span class="inline-block" in:fly={flyIn} out:fly={flyOut}>{list[idx]}</span>
  {/key}
</span>

<style>
  .dither-rotating {
    display: inline-block;
    overflow: hidden;
    vertical-align: bottom;
  }
</style>
