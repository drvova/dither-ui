<script lang="ts" module>
  export type MenubarItem = {
    label?: string
    danger?: boolean
    disabled?: boolean
    divider?: boolean
  }
  export type MenubarMenu = { label: string; items: MenubarItem[] }
</script>

<script lang="ts">
  import { fly } from "svelte/transition"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = { menus: MenubarMenu[]; onselect?: (menu: string, item: string) => void }
  let { menus, onselect }: Props = $props()

  const rm = pixelPrefersReducedMotion()
  let openIndex = $state<number | null>(null)
  let rootEl = $state<HTMLDivElement | null>(null)

  function topButtons(): HTMLButtonElement[] {
    return rootEl ? [...rootEl.querySelectorAll<HTMLButtonElement>("[data-menubar-top]")] : []
  }
  function menuItems(): HTMLButtonElement[] {
    return rootEl ? [...rootEl.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')] : []
  }

  function toggle(i: number) {
    openIndex = openIndex === i ? null : i
  }
  function hover(i: number) {
    // desktop menubar behavior: hovering another top item switches the open menu
    if (openIndex !== null && openIndex !== i) openIndex = i
  }
  function pick(menu: MenubarMenu, it: MenubarItem, i: number) {
    if (it.disabled || it.divider) return
    onselect?.(menu.label, it.label ?? "")
    openIndex = null
    topButtons()[i]?.focus()
  }
  function moveTop(dir: number) {
    const n = menus.length
    if (!n) return
    const cur = openIndex ?? topButtons().indexOf(document.activeElement as HTMLButtonElement)
    const next = cur === -1 ? (dir > 0 ? 0 : n - 1) : (cur + dir + n) % n
    topButtons()[next]?.focus()
    if (openIndex !== null) openIndex = next
  }
  function moveFocus(dir: number) {
    const els = menuItems()
    if (!els.length) return
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
    els[next]?.focus()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault()
      moveTop(1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      moveTop(-1)
    } else if (e.key === "Escape" && openIndex !== null) {
      e.stopPropagation()
      const i = openIndex
      openIndex = null
      topButtons()[i]?.focus()
    } else if (e.key === "ArrowDown" && openIndex !== null) {
      e.preventDefault()
      moveFocus(1)
    } else if (e.key === "ArrowUp" && openIndex !== null) {
      e.preventDefault()
      moveFocus(-1)
    }
  }
  function onOutside(e: PointerEvent) {
    if (openIndex === null) return
    if (rootEl?.contains(e.target as Node)) return
    openIndex = null
  }

  const flyIn = { y: 2, duration: rm ? 0 : 140 }
</script>

<svelte:window onpointerdown={onOutside} />

<!-- svelte-ignore a11y_interactive_supports_focus (menubar items are the focus targets, per APG) -->
<div
  bind:this={rootEl}
  role="menubar"
  class="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5"
  onkeydown={onKeydown}
>
  {#each menus as menu, mi (menu.label)}
    <div class="relative inline-block">
      <button
        data-menubar-top
        type="button"
        aria-haspopup="menu"
        aria-expanded={openIndex === mi}
        class={cn(
          "rounded-md px-2.5 py-1 font-mono text-xs transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none",
          openIndex === mi
            ? "bg-background text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        onclick={() => toggle(mi)}
        onpointerenter={() => hover(mi)}
      >
        {menu.label}
      </button>
      {#if openIndex === mi}
        <div
          role="menu"
          class="absolute top-full left-0 z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
          transition:fly={flyIn}
        >
          {#each menu.items as it, i (i)}
            {#if it.divider}
              <div class="my-1 h-px bg-border"></div>
            {:else}
              <button
                type="button"
                role="menuitem"
                disabled={it.disabled}
                class={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40",
                  it.danger
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-foreground hover:bg-background"
                )}
                onclick={() => pick(menu, it, mi)}
              >
                {it.label}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
