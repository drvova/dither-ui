<script lang="ts" module>
  export type ContextMenuItem = {
    label?: string
    danger?: boolean
    disabled?: boolean
    divider?: boolean
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"
  import { portal } from "../runtime/portal"

  type Props = {
    items: ContextMenuItem[]
    onselect?: (label: string) => void
    children?: Snippet
  }
  let { items, onselect, children }: Props = $props()

  let pos = $state<{ x: number; y: number } | null>(null)
  let panelEl = $state<HTMLDivElement | null>(null)

  function menuItems(): HTMLButtonElement[] {
    return panelEl ? [...panelEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')] : []
  }

  function onContextmenu(e: MouseEvent) {
    e.preventDefault()
    pos = { x: e.clientX, y: e.clientY }
    requestAnimationFrame(() => {
      // Clamp inside the viewport — menus opened near an edge flip inward.
      const panel = panelEl
      if (panel && pos) {
        const r = panel.getBoundingClientRect()
        pos = {
          x: Math.max(8, Math.min(pos.x, window.innerWidth - r.width - 8)),
          y: Math.max(8, Math.min(pos.y, window.innerHeight - r.height - 8)),
        }
      }
      panel?.focus()
    })
  }
  function pick(it: ContextMenuItem) {
    if (it.disabled || it.divider) return
    onselect?.(it.label ?? "")
    pos = null
  }
  function moveFocus(dir: number) {
    const els = menuItems()
    if (!els.length) return
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
    els[next]?.focus()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      pos = null
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      moveFocus(1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      moveFocus(-1)
    }
  }
  const closePanel = () => {
    pos = null
  }
</script>

<svelte:window
  onpointerdown={() => {
    if (pos) closePanel()
  }}
  onblur={() => {
    if (pos) closePanel()
  }}
/>

<!-- svelte-ignore a11y_no_static_element_interactions (contextmenu delegation wrapper; the menu role is on the panel) -->
<div oncontextmenu={onContextmenu}>
  {@render children?.()}
  {#if pos}
    <div
      bind:this={panelEl}
      use:portal
      role="menu"
      tabindex="-1"
      class="fixed z-[100] min-w-[180px] rounded-lg border border-border bg-card p-1 text-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] outline-none"
      style:left={`${pos.x}px`}
      style:top={`${pos.y}px`}
      onpointerdown={(e) => e.stopPropagation()}
      oncontextmenu={(e) => e.preventDefault()}
      onkeydown={onKeydown}
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
