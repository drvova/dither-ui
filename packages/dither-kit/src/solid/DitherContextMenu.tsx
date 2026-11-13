import { createEffect, createSignal, For, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"

export type ContextMenuItem = {
  label?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

export type DitherContextMenuProps = {
  items: ContextMenuItem[]
  onSelect?: (label: string) => void
  children?: JSX.Element
}

export default function DitherContextMenu(props: DitherContextMenuProps) {
  const [pos, setPos] = createSignal<{ x: number; y: number } | null>(null)
  let panel: HTMLDivElement | undefined
  let itemRefs: HTMLButtonElement[] = []

  function onContextmenu(e: MouseEvent) {
    e.preventDefault()
    // An open panel keeps its buttons: only a fresh one fills the list anew.
    if (!pos()) itemRefs = []
    setPos({ x: e.clientX, y: e.clientY })
    queueMicrotask(() => {
      // Clamp inside the viewport — menus opened near an edge flip inward.
      const at = pos()
      if (panel && at) {
        const r = panel.getBoundingClientRect()
        setPos({
          x: Math.max(8, Math.min(at.x, window.innerWidth - r.width - 8)),
          y: Math.max(8, Math.min(at.y, window.innerHeight - r.height - 8)),
        })
      }
      panel?.focus()
    })
  }

  function pick(it: ContextMenuItem) {
    if (it.disabled || it.divider) return
    props.onSelect?.(it.label ?? "")
    setPos(null)
  }

  function moveFocus(dir: number) {
    const els = itemRefs.filter((el): el is HTMLButtonElement => !!el && el.isConnected)
    if (!els.length) return
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
    els[next]?.focus()
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      setPos(null)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      moveFocus(1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      moveFocus(-1)
    }
  }

  const closePanel = () => {
    setPos(null)
  }

  onMount(() => {
    let timer = 0
    createEffect(
      on(
        pos,
        (v, old) => {
          if (v && !old) {
            // defer so the opening press doesn't immediately close it
            timer = window.setTimeout(() => {
              window.addEventListener("pointerdown", closePanel)
              window.addEventListener("blur", closePanel)
            }, 0)
          } else if (!v) {
            clearTimeout(timer)
            window.removeEventListener("pointerdown", closePanel)
            window.removeEventListener("blur", closePanel)
          }
        },
        { defer: true },
      ),
    )
    onCleanup(() => {
      clearTimeout(timer)
      window.removeEventListener("pointerdown", closePanel)
      window.removeEventListener("blur", closePanel)
    })
  })

  // Native listeners (`on:`): the panel's events stay
  // in the panel (a delegated one would climb out of the portal to this root).
  return (
    <div on:contextmenu={onContextmenu}>
      {props.children}
      <Portal>
        <Show when={pos()}>
          {(at) => (
            <div
              ref={(el) => (panel = el)}
              role="menu"
              tabindex="-1"
              class="fixed z-[100] min-w-[180px] rounded-lg border border-border bg-card p-1 font-mono text-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] outline-none"
              style={{ left: `${at().x}px`, top: `${at().y}px` }}
              on:pointerdown={(e) => e.stopPropagation()}
              on:contextmenu={(e) => e.preventDefault()}
              on:keydown={onKeydown}
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
                      on:click={() => pick(it)}
                    >
                      {it.label}
                    </button>
                  </Show>
                )}
              </For>
            </div>
          )}
        </Show>
      </Portal>
    </div>
  )
}
