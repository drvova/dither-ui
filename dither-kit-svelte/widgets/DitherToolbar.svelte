<script lang="ts">
  import { onMount, type Snippet } from "svelte"

  type Props = {
    label?: string
    children?: Snippet
  }

  let { label, children }: Props = $props()

  let rootEl = $state<HTMLDivElement | null>(null)

  function buttons(): HTMLElement[] {
    return Array.from(rootEl?.querySelectorAll<HTMLElement>("button") ?? [])
  }

  function setStops(active: HTMLElement) {
    for (const b of buttons()) b.tabIndex = b === active ? 0 : -1
  }

  onMount(() => {
    buttons().forEach((b, i) => (b.tabIndex = i === 0 ? 0 : -1))
  })

  function onKeydown(e: KeyboardEvent) {
    const btns = buttons()
    if (!btns.length) return
    const i = btns.indexOf(e.target as HTMLElement)
    let next: number
    if (e.key === "ArrowRight") next = (i + 1 + btns.length) % btns.length
    else if (e.key === "ArrowLeft") next = (i - 1 + btns.length) % btns.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = btns.length - 1
    else return
    e.preventDefault()
    e.stopPropagation()
    setStops(btns[next])
    btns[next].focus()
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus (toolbar buttons carry the roving tabindex, per APG; the container is not a tab stop) -->
<div
  bind:this={rootEl}
  role="toolbar"
  aria-label={label}
  class="flex items-center gap-1 rounded-lg border border-border/60 bg-card/50 p-1"
  onkeydown={onKeydown}
>
  {@render children?.()}
</div>
