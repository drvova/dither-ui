// Generated from dither-kit/solid/DitherPopover.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { Presence } from "dither-kit/solid/runtime/presence.tsx"
import "dither-kit/solid/DitherPopover.css"
import { cn, type StyleProp } from "./lib"

import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  absolute: {
    position: "absolute",
    top: "100%",
    zIndex: "30",
    marginTop: "0.375rem",
    minWidth: "180px",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.75rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  alignStart: { left: "0px" },
  alignCenter: { left: "calc(1 / 2 * 100%)", translate: "calc(calc(1 / 2 * 100%) * -1) 0" },
  alignEnd: { right: "0px" },
})

export type DitherPopoverProps = {
  open: boolean
  align?: "start" | "center" | "end"
  onClose?: () => void
  /** What opens the popover; it stays in the flow. */
  trigger?: JSX.Element
  children?: JSX.Element
}

const ALIGN: Record<string, StyleProp> = {
  start: styles.alignStart,
  center: styles.alignCenter,
  end: styles.alignEnd,
}

export default function DitherPopover(raw: DitherPopoverProps) {
  const props = mergeProps({ align: "start" as const }, raw)
  let rootRef: HTMLDivElement | undefined

  function onOutside(e: PointerEvent) {
    if (rootRef?.contains(e.target as Node)) return
    props.onClose?.()
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") props.onClose?.()
  }

  onMount(() => {
    let timer = 0
    createEffect(
      on(
        () => props.open,
        (v) => {
          if (v) {
            // defer so the opening click doesn't immediately close it
            timer = window.setTimeout(() => {
              window.addEventListener("pointerdown", onOutside)
              window.addEventListener("keydown", onKey)
            }, 0)
          } else {
            clearTimeout(timer)
            window.removeEventListener("pointerdown", onOutside)
            window.removeEventListener("keydown", onKey)
          }
        },
        { defer: true },
      ),
    )
    onCleanup(() => {
      clearTimeout(timer)
      window.removeEventListener("pointerdown", onOutside)
      window.removeEventListener("keydown", onKey)
    })
  })

  return (
    <div ref={(el) => (rootRef = el)} {...stylex.props(styles.frame)}>
      {props.trigger}
      <Presence when={props.open} name="dk-pop">
        <div class={cn([styles.absolute, ALIGN[props.align]])}>{props.children}</div>
      </Presence>
    </div>
  )
}
