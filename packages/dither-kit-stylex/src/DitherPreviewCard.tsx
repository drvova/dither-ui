// Generated from dither-kit/solid/DitherPreviewCard.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps, onCleanup } from "solid-js"
import { Presence } from "dither-kit/solid/runtime/presence.tsx"
import "dither-kit/solid/DitherPreviewCard.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", display: "inline-block" },
  text: { display: "inline-block" },
  layer: {
    position: "absolute",
    bottom: "100%",
    left: "calc(1 / 2 * 100%)",
    zIndex: "30",
    marginBottom: "0.375rem",
    width: "16rem",
    translate: "calc(calc(1 / 2 * 100%) * -1) 0",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "1rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
})

export type DitherPreviewCardProps = {
  delay?: number
  /** What the card hangs from: hovering or focusing it shows the card. */
  trigger?: JSX.Element
  children?: JSX.Element
}

export default function DitherPreviewCard(raw: DitherPreviewCardProps) {
  const props = mergeProps({ delay: 400 }, raw)

  const [shown, setShown] = createSignal(false)
  let openTimer = 0
  let closeTimer = 0

  function show() {
    clearTimeout(closeTimer)
    clearTimeout(openTimer)
    openTimer = window.setTimeout(() => {
      setShown(true)
    }, props.delay)
  }
  function hide() {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    // small close-delay so moving the pointer into the card keeps it open
    closeTimer = window.setTimeout(() => {
      setShown(false)
    }, 100)
  }
  function keepOpen() {
    clearTimeout(closeTimer)
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
      setShown(false)
    }
  }

  onCleanup(() => {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  })

  return (
    <span {...stylex.props(styles.frame)} onKeyDown={onKeydown}>
      <span
        {...stylex.props(styles.text)}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocusIn={show}
        onFocusOut={hide}
      >
        {props.trigger}
      </span>
      <Presence when={shown()} name="dk-pop">
        <div {...stylex.props(styles.layer)} onPointerEnter={keepOpen} onPointerLeave={hide}>
          {props.children}
        </div>
      </Presence>
    </span>
  )
}
