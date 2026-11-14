// Generated from @dither-ui/kit/solid/DitherContextMenu.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createSignal, For, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { inView } from "@dither-ui/kit/engine/place.ts"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    position: "fixed",
    zIndex: "100",
    minWidth: "180px",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    fontFamily: "var(--font-mono)",
    color: "var(--foreground)",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
    outlineStyle: "none",
  },
  box: { marginBlock: "0.25rem", height: "1px", backgroundColor: "var(--border)" },
  flex: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    borderRadius: "var(--radius)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
    fontSize: "13px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  textRed400: {
    color: "oklch(70.4% 0.191 22.216)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, oklch(63.7% 0.237 25.331) 10%, transparent)",
      },
    },
  },
  textForeground: {
    color: "var(--foreground)",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})

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
      if (panel && at)
        setPos(inView(at, panel.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }))
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
              {...stylex.props(styles.layer)}
              style={{ left: `${at().x}px`, top: `${at().y}px` }}
              on:pointerdown={(e) => e.stopPropagation()}
              on:contextmenu={(e) => e.preventDefault()}
              on:keydown={onKeydown}
            >
              <For each={props.items}>
                {(it, i) => (
                  <Show when={!it.divider} fallback={<div {...stylex.props(styles.box)} />}>
                    <button
                      ref={(el) => (itemRefs[i()] = el)}
                      type="button"
                      role="menuitem"
                      disabled={it.disabled}
                      class={cn([styles.flex, it.danger ? styles.textRed400 : styles.textForeground])}
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
