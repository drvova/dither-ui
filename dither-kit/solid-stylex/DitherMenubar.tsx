// Generated from ../solid/DitherMenubar.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createSignal, For, on, onCleanup, onMount, Show } from "solid-js"
import { Presence } from "../solid/runtime/presence"
import "../solid/DitherMenubar.css"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.125rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.125rem",
  },
  frame: { position: "relative", display: "inline-block" },
  layer: {
    position: "absolute",
    top: "100%",
    left: "0px",
    zIndex: "30",
    marginTop: "0.375rem",
    minWidth: "180px",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  box: { marginBlock: "0.25rem", height: "1px", backgroundColor: "var(--border)" },
  roundedMd: {
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.25rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  bgBackground: { backgroundColor: "var(--background)", color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
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

  function moveFocus(dir: number) {
    const els = itemRefs.filter((el): el is HTMLButtonElement => !!el)
    if (!els.length) return
    const i = els.indexOf(document.activeElement as HTMLButtonElement)
    const next = i === -1 ? (dir > 0 ? 0 : els.length - 1) : (i + dir + els.length) % els.length
    els[next]?.focus()
  }

  function onKeydown(e: KeyboardEvent) {
    const at = openIndex()
    if (e.key === "ArrowRight") {
      e.preventDefault()
      moveTop(1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      moveTop(-1)
    } else if (e.key === "Escape" && at !== null) {
      e.stopPropagation()
      open(null)
      topRefs[at]?.focus()
    } else if (e.key === "ArrowDown" && at !== null) {
      e.preventDefault()
      moveFocus(1)
    } else if (e.key === "ArrowUp" && at !== null) {
      e.preventDefault()
      moveFocus(-1)
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
    <div ref={(el) => (rootRef = el)} role="menubar" {...stylex.props(styles.row)} onKeyDown={onKeydown}>
      <For each={props.menus}>
        {(menu, mi) => (
          <div {...stylex.props(styles.frame)}>
            <button
              ref={(el) => (topRefs[mi()] = el)}
              type="button"
              aria-haspopup="menu"
              aria-expanded={openIndex() === mi()}
              class={cn([styles.roundedMd, openIndex() === mi() ? styles.bgBackground : styles.textMutedForeground])}
              onClick={() => toggle(mi())}
              onPointerEnter={() => hover(mi())}
            >
              {menu.label}
            </button>
            <Presence when={openIndex() === mi()} name="dk-pop">
              <div role="menu" {...stylex.props(styles.layer)}>
                <For each={menu.items}>
                  {(it, i) => (
                    <Show when={!it.divider} fallback={<div {...stylex.props(styles.box)} />}>
                      <button
                        ref={(el) => (itemRefs[i()] = el)}
                        type="button"
                        role="menuitem"
                        disabled={it.disabled}
                        class={cn([styles.flex, it.danger ? styles.textRed400 : styles.textForeground])}
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
