// Generated from dither-kit/solid/TargetCursor.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import "dither-kit/solid/TargetCursor.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { pointerEvents: "none", position: "absolute", top: "0px", left: "0px" },
  frame: { position: "relative", overflow: "hidden" },
})

export type TargetCursorProps = {
  color?: string
  size?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function TargetCursor(raw: TargetCursorProps) {
  const props = mergeProps({ color: "#7CFF67", size: 36 }, raw)

  let area: HTMLDivElement | undefined
  const [x, setX] = createSignal(-99)
  const [y, setY] = createSignal(-99)
  const [on, setOn] = createSignal(false)

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    setX(e.clientX - r.left)
    setY(e.clientY - r.top)
    setOn(true)
  }

  return (
    <div
      ref={(el) => (area = el)}
      class={cn([styles.frame, "dk-target-cursor"], props.xstyle, props.class)}
      onPointerMove={onMove}
      onPointerLeave={() => setOn(false)}
    >
      {props.children}
      <div
        class={cn(styles.layer, "dither-target")}
        style={{
          width: `${props.size}px`,
          height: `${props.size}px`,
          transform: `translate(${x()}px, ${y()}px) translate(-50%, -50%)`,
          opacity: on() ? 1 : 0,
          color: props.color,
        }}
        aria-hidden="true"
      >
        <span class="corner tl" />
        <span class="corner tr" />
        <span class="corner bl" />
        <span class="corner br" />
      </div>
    </div>
  )
}
