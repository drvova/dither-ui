import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from "solid-js"
import { Presence } from "./runtime/presence"
import "./DitherMenubar.css"
import { menuKeys } from "../engine/keys"

export type MenubarItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export type MenubarMenu = { label: string; items: MenubarItem[] }

export type DitherMenubarProps = {
  menus: MenubarMenu[]
  onSelect?: (menu: string, item: string) => void
}

export default function DitherMenubar(props: DitherMenubarProps) {
  const [openIndex, setOpenIndex] = createSignal<number | null>(null)
  let rootRef: HTMLDivElement | undefined
  const topRefs: HTMLButtonElement[] = []
  let itemRefs: HTMLButtonElement[] = []

  /** Open a menu (or none). The item refs start over before the new menu
   * renders into them. */
  function open(v: number | null) {
    if (v !== null && v !== openIndex()) itemRefs = []
    setOpenIndex(v)
  }

  function toggle(i: number) {
    open(openIndex() === i ? null : i)
  }

  function hover(i: number) {
    // desktop menubar behavior: hovering another top item switches the open menu
    if (openIndex() !== null && openIndex() !== i) open(i)
  }

  function pick(menu: MenubarMenu, it: MenubarItem, i: number) {
    if (it.disabled || it.divider) return
    props.onSelect?.(menu.label, it.label ?? "")
    open(null)
    topRefs[i]?.focus()
  }

  function moveTop(dir: number) {
    const n = props.menus.length
    if (!n) return
    const cur = openIndex() ?? topRefs.indexOf(document.activeElement as HTMLButtonElement)
    const next = cur === -1 ? (dir > 0 ? 0 : n - 1) : (cur + dir + n) % n
    topRefs[next]?.focus()
    if (openIndex() !== null) open(next)
  }

  function onKeydown(e: KeyboardEvent) {
    const at = openIndex()
    if (e.key === "ArrowRight") {
      e.preventDefault()
      moveTop(1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      moveTop(-1)
    } else if (at !== null) {
      menuKeys(e, itemRefs, () => {
        open(null)
        topRefs[at]?.focus()
      })
    }
  }

  function onOutside(e: PointerEvent) {
    if (rootRef?.contains(e.target as Node)) return
    open(null)
  }

  onMount(() => {
    let timer = 0
    createEffect(
      on(
        openIndex,
        (v, old) => {
          // `old` is undefined on the first change: the effect skipped the mount.
          if (v !== null && old == null) {
            // defer so the opening click doesn't immediately close it
            timer = window.setTimeout(() => window.addEventListener("pointerdown", onOutside), 0)
          } else if (v === null) {
            clearTimeout(timer)
            window.removeEventListener("pointerdown", onOutside)
          }
        },
        { defer: true },
      ),
    )
    onCleanup(() => {
      clearTimeout(timer)
      window.removeEventListener("pointerdown", onOutside)
    })
  })

  return (
    <div
      ref={(el) => (rootRef = el)}
      role="menubar"
      class="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5"
      onKeyDown={onKeydown}
    >
      <For each={props.menus}>
        {(menu, mi) => (
          <div class="relative inline-block">
            <button
              ref={(el) => (topRefs[mi()] = el)}
              type="button"
              aria-haspopup="menu"
              aria-expanded={openIndex() === mi()}
              class={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${
                openIndex() === mi() ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => toggle(mi())}
              onPointerEnter={() => hover(mi())}
            >
              {menu.label}
            </button>
            <Presence when={openIndex() === mi()} name="dk-pop">
              <div
                role="menu"
                class="absolute top-full left-0 z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
              >
                <For each={menu.items}>
                  {(it, i) => (
                    <Show when={!it.divider} fallback={<div class="my-1 h-px bg-border" />}>
                      <button
                        ref={(el) => (itemRefs[i()] = el)}
                        type="button"
                        role="menuitem"
                        disabled={it.disabled}
                        class={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                          it.danger ? "text-red-400 hover:bg-red-500/10" : "text-foreground hover:bg-background"
                        }`}
                        onClick={() => pick(menu, it, mi())}
                      >
                        {it.label}
                      </button>
                    </Show>
                  )}
                </For>
              </div>
            </Presence>
          </div>
        )}
      </For>
    </div>
  )
}
