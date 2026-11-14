// Generated from @dither-ui/kit/solid/BlobCursor.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps } from "solid-js"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import { createInviewLoop } from "@dither-ui/kit/solid/runtime/in-view.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    pointerEvents: "none",
    position: "absolute",
    top: "0px",
    left: "0px",
    borderRadius: "calc(infinity * 1px)",
    filter: "blur(12px)        ",
  },
  frame: { position: "relative", overflow: "hidden" },
})

export type BlobCursorProps = {
  /** @docs string (hex) */
  color?: string
  /** @docs number (px) */
  size?: number
  /** @docs number (0-1) */
  lag?: number
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

export default function BlobCursor(raw: BlobCursorProps) {
  const props = mergeProps({ color: "#7CFF67", size: 48, lag: 0.18 }, raw)

  let area: HTMLDivElement | undefined
  let blob: HTMLDivElement | undefined
  let raf = 0
  const m = { x: 0, y: 0, active: false }
  const p = { x: 0, y: 0 }

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    m.x = e.clientX - r.left
    m.y = e.clientY - r.top
    m.active = true
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const b = blob
    if (!b) return
    p.x += (m.x - p.x) * props.lag
    p.y += (m.y - p.y) * props.lag
    b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${m.active ? 1 : 0})`
  }

  function start() {
    if (raf || pixelPrefersReducedMotion()) return
    raf = requestAnimationFrame(frame)
  }
  function stop() {
    if (!raf) return
    cancelAnimationFrame(raf)
    raf = 0
  }

  createInviewLoop(() => area, start, stop)

  return (
    <div
      ref={(el) => (area = el)}
      class={cn(styles.frame, props.xstyle, props.class)}
      onPointerMove={onMove}
      onPointerLeave={() => (m.active = false)}
    >
      {props.children}
      <div
        ref={(el) => (blob = el)}
        {...stylex.props(styles.layer)}
        style={{
          width: `${props.size}px`,
          height: `${props.size}px`,
          background: props.color,
          "mix-blend-mode": "screen",
          transform: "scale(0)",
        }}
        aria-hidden="true"
      />
    </div>
  )
}
