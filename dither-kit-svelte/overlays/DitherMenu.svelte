<script lang="ts" module>
  export type MenuItem = {
    label?: string
    danger?: boolean
    disabled?: boolean
    divider?: boolean
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { fly } from "svelte/transition"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = { items: MenuItem[]; onselect?: (label: string) => void; children?: Snippet }
  let { items, onselect, children }: Props = $props()

  const rm = pixelPrefersReducedMotion()
  let open = $state(false)
  let rootEl = $state<HTMLDivElement | null>(null)
  let triggerEl = $state<HTMLButtonElement | null>(null)

  function menuItems(): HTMLButtonElement[] {
    return rootEl ? [...rootEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')] : []
  }

  function closeMenu(refocus = false) {
    open = false
    if (refocus) triggerEl?.focus()
  }
  function pick(it: MenuItem) {
    if (it.disabled || it.divider) return
    onselect?.(it.label ?? "")
    closeMenu(true)
  }
  function moveFocus(dir: number) {
    const els = menuItems()
    if (!els.length) return
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
    els[next]?.focus()
  }
  function onKeydown(e: KeyboardEvent) {
    if (!open) return
    if (e.key === "Escape") {
      e.stopPropagation()
      closeMenu(true)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      moveFocus(1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      moveFocus(-1)
    }
  }
  // Always-mounted outside-click guard: the opening pointerdown lands while
  // `open` is still false, so the click that opens the menu never closes it.
  function onOutside(e: PointerEvent) {
    if (!open) return
    if (rootEl?.contains(e.target as Node)) return
    open = false
  }

  const flyIn = { y: 2, duration: rm ? 0 : 140 }
</script>

<svelte:window onpointerdown={onOutside} />

<!-- svelte-ignore a11y_no_static_element_interactions (keyboard delegation wrapper; the menu/menuitem roles carry the semantics) -->
<div bind:this={rootEl} class="relative inline-block" onkeydown={onKeydown}>
  <button
    bind:this={triggerEl}
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    class="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:bg-background focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
    onclick={() => (open = !open)}
  >
    {@render children?.()}
  </button>
  {#if open}
    <div
      role="menu"
      class="absolute top-full left-0 z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
      transition:fly={flyIn}
    >
      {#each items as it, i (i)}
        {#if it.divider}
          <div class="my-1 h-px bg-border"></div>
        {:else}
          <button
            type="button"
            role="menuitem"
            disabled={it.disabled}
            class={cn(
              "flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40",
              it.danger ? "text-red-400 hover:bg-red-500/10" : "text-foreground hover:bg-background"
            )}
            onclick={() => pick(it)}
          >
            {it.label}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</div>
