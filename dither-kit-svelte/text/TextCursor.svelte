<script lang="ts">
  import { onMount, untrack } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    text?: string
    class?: string
  }

  let { text = "dither", class: className }: Props = $props()

  const chars = $derived([...text])
  let area = $state<HTMLElement | null>(null)
  let trail = $state<HTMLElement | null>(null)
  let raf = 0
  const mouse = { x: 0, y: 0, active: false }
  const pos = untrack(() => [...text].map(() => ({ x: 0, y: 0 })))

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    mouse.x = e.clientX - r.left
    mouse.y = e.clientY - r.top
    mouse.active = true
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const kids = trail?.children
    if (!kids) return
    let tx = mouse.x
    let ty = mouse.y
    for (let i = 0; i < pos.length; i++) {
      pos[i].x += (tx - pos[i].x) * 0.35
      pos[i].y += (ty - pos[i].y) * 0.35
      const el = kids[i] as HTMLElement
      el.style.transform = `translate(${pos[i].x}px, ${pos[i].y}px) translate(-50%, -50%)`
      el.style.opacity = mouse.active ? String(1 - i / (pos.length + 1)) : "0"
      tx = pos[i].x
      ty = pos[i].y
    }
  }

  onMount(() => {
    if (pixelPrefersReducedMotion()) return
    raf = requestAnimationFrame(frame)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (pointer trail is cosmetic, not a required interaction) -->
<div
  bind:this={area}
  class={cn("relative h-full w-full overflow-hidden", className)}
  aria-label={text}
  onpointermove={onMove}
  onpointerleave={() => (mouse.active = false)}
>
  <div bind:this={trail} aria-hidden="true">
    {#each chars as ch, i (i)}
      <span
        class="pointer-events-none absolute left-0 top-0 font-mono transition-opacity duration-200"
        style="opacity: 0"
      >{ch === " " ? "\u00a0" : ch}</span>
    {/each}
  </div>
</div>
