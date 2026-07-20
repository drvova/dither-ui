<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    texts?: string[]
    typingSpeed?: number
    deletingSpeed?: number
    pause?: number
    loop?: boolean
    cursor?: boolean
    class?: string
  }

  let {
    texts = ["Type this out.", "Then this."],
    typingSpeed = 60,
    deletingSpeed = 35,
    pause = 1400,
    loop = true,
    cursor = true,
    class: className,
  }: Props = $props()

  let shown = $state("")
  let ti = 0
  let timer = 0

  function schedule(fn: () => void, ms: number) {
    timer = window.setTimeout(fn, Math.max(0, ms))
  }
  function list() {
    return texts.length ? texts : [""]
  }
  function type() {
    const full = list()[ti % list().length]
    if (shown.length < full.length) {
      shown = full.slice(0, shown.length + 1)
      schedule(type, typingSpeed)
    } else if (loop || ti < list().length - 1) {
      schedule(del, pause)
    }
  }
  function del() {
    if (shown.length > 0) {
      shown = shown.slice(0, -1)
      schedule(del, deletingSpeed)
    } else {
      ti++
      schedule(type, 220)
    }
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) {
      shown = list()[0]
      return
    }
    schedule(type, 300)
  })
  onDestroy(() => clearTimeout(timer))
</script>

<span class={cn("inline-block whitespace-pre", className)}><span>{shown}</span>{#if cursor}<span
      class="dither-caret"
      aria-hidden="true">|</span>{/if}</span>

<style>
  .dither-caret {
    animation: dither-blink 1s steps(1) infinite;
  }
  @keyframes dither-blink {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-caret {
      animation: none;
    }
  }
</style>
