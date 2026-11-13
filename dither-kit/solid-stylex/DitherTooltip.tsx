// Generated from ../solid/DitherTooltip.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps, onCleanup } from "solid-js"
import { Presence } from "../solid/runtime/presence"
import "../solid/DitherTooltip.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  layer: {
    position: "absolute",
    bottom: "100%",
    left: "calc(1 / 2 * 100%)",
    zIndex: "30",
    marginBottom: "0.375rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) 0",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    fontSize: "11px",
    whiteSpace: "nowrap",
    color: "var(--foreground)",
  },
})

export type DitherTooltipProps = {
  text: string
  delay?: number
  children?: JSX.Element
}

export default function DitherTooltip(raw: DitherTooltipProps) {
  const props = mergeProps({ delay: 300 }, raw)

  const [shown, setShown] = createSignal(false)
  let timer = 0

  function show() {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      setShown(true)
    }, props.delay)
  }
  function hide() {
    clearTimeout(timer)
    setShown(false)
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") hide()
  }

  onCleanup(() => clearTimeout(timer))

  return (
    <span
      {...stylex.props(styles.frame)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocusIn={show}
      onFocusOut={hide}
      onKeyDown={onKeydown}
    >
      {props.children}
      <Presence when={shown()} name="dk-tip">
        <span role="tooltip" {...stylex.props(styles.layer)}>
          {props.text}
        </span>
      </Presence>
    </span>
  )
}
