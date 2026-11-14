import { createEffect, createSignal, For, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import { Presence } from "./runtime/presence"
import "./DitherMenu.css"
import { menuKeys } from "../engine/keys"

export type MenuItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export type DitherMenuProps = {
  items: MenuItem[]
  onSelect?: (label: string) => void
  /** The trigger's label.
   * @docs content */
  children?: JSX.Element
}

export default function DitherMenu(props: DitherMenuProps) {
  const [open, setOpen] = createSignal(false)
  let root: HTMLDivElement | undefined
  let trigger: HTMLButtonElement | undefined
  /** The panel's buttons by row; a panel that has left the page keeps none. */
  const itemRefs: HTMLButtonElement[] = []

  function closeMenu(refocus = false) {
    setOpen(false)
    if (refocus) trigger?.focus()
  }

  function pick(it: MenuItem) {
    if (it.disabled || it.divider) return
    props.onSelect?.(it.label ?? "")
    closeMenu(true)
  }

  function onKeydown(e: KeyboardEvent) {
    if (open()) menuKeys(e, itemRefs, () => closeMenu(true))
  }

  function onOutside(e: PointerEvent) {
    if (root?.contains(e.target as Node)) return
    setOpen(false)
  }

  onMount(() => {
    let timer = 0
    createEffect(
      on(
        open,
        (v) => {
          if (v) {
            // defer so the opening click doesn't immediately close it
            timer = window.setTimeout(() => window.addEventListener("pointerdown", onOutside), 0)
          } else {
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
    <div ref={(el) => (root = el)} class="relative inline-block" on:keydown={onKeydown}>
      <button
        ref={(el) => (trigger = el)}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open()}
        class="rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        onClick={() => setOpen(!open())}
      >
        {props.children}
      </button>
      <Presence when={open()} name="dk-pop">
        <div
          role="menu"
          class="absolute top-full left-0 z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          <For each={props.items}>
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
                  onClick={() => pick(it)}
                >
                  {it.label}
                </button>
              </Show>
            )}
          </For>
        </div>
      </Presence>
    </div>
  )
}
