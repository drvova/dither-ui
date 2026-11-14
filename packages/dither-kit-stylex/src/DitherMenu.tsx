// Generated from @dither-ui/kit/solid/DitherMenu.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createSignal, For, type JSX, on, onCleanup, onMount, Show } from "solid-js"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/DitherMenu.css"
import { menuKeys } from "@dither-ui/kit/engine/keys.ts"
import { cn } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  button: {
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: {
      default: "var(--card)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    paddingInline: "0.75rem",
    paddingBlock: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
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
    <div ref={(el) => (root = el)} {...stylex.props(styles.frame)} on:keydown={onKeydown}>
      <button
        ref={(el) => (trigger = el)}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open()}
        {...stylex.props(styles.button)}
        onClick={() => setOpen(!open())}
      >
        {props.children}
      </button>
      <Presence when={open()} name="dk-pop">
        <div role="menu" {...stylex.props(styles.layer)}>
          <For each={props.items}>
            {(it, i) => (
              <Show when={!it.divider} fallback={<div {...stylex.props(styles.box)} />}>
                <button
                  ref={(el) => (itemRefs[i()] = el)}
                  type="button"
                  role="menuitem"
                  disabled={it.disabled}
                  class={cn([styles.flex, it.danger ? styles.textRed400 : styles.textForeground])}
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
