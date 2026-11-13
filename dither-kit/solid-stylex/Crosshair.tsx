// Generated from ../solid/Crosshair.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { pointerEvents: "none", position: "absolute", insetBlock: "0px" },
  layer2: { pointerEvents: "none", position: "absolute", insetInline: "0px" },
  frame: { position: "relative", overflow: "hidden" },
})

export type CrosshairProps = {
  color?: string
  thickness?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function Crosshair(raw: CrosshairProps) {
  const props = mergeProps({ color: "#7CFF67", thickness: 1 }, raw)

  let area: HTMLDivElement | undefined
  const [x, setX] = createSignal(-99)
  const [y, setY] = createSignal(-99)
  const [shown, setShown] = createSignal(false)

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    setX(e.clientX - r.left)
    setY(e.clientY - r.top)
    setShown(true)
  }

  return (
    <div
      ref={(el) => (area = el)}
      class={cn(styles.frame, props.xstyle, props.class)}
      onPointerMove={onMove}
      onPointerLeave={() => setShown(false)}
    >
      {props.children}
      <div
        {...stylex.props(styles.layer)}
        style={{
          left: `${x()}px`,
          width: `${props.thickness}px`,
          background: props.color,
          opacity: shown() ? 0.8 : 0,
        }}
        aria-hidden="true"
      />
      <div
        {...stylex.props(styles.layer2)}
        style={{
          top: `${y()}px`,
          height: `${props.thickness}px`,
          background: props.color,
          opacity: shown() ? 0.8 : 0,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
