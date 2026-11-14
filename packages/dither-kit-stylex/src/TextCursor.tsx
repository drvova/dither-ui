// Generated from @dither-ui/kit/solid/TextCursor.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, Index, mergeProps } from "solid-js"
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
    fontFamily: "var(--font-mono)",
    transitionProperty: "opacity",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  frame: { position: "relative", height: "100%", width: "100%", overflow: "hidden" },
})

export type TextCursorProps = {
  text?: string
  /** @default undefined */
  class?: string
  xstyle?: StyleProp
}

export default function TextCursor(raw: TextCursorProps) {
  const props = mergeProps({ text: "dither" }, raw)

  const chars = createMemo(() => [...props.text])
  let area: HTMLDivElement | undefined
  let trail: HTMLDivElement | undefined
  let raf = 0
  const mouse = { x: 0, y: 0, active: false }
  // One trailing point per letter shown, however the text changed.
  const pos: { x: number; y: number }[] = []

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    mouse.x = e.clientX - r.left
    mouse.y = e.clientY - r.top
    mouse.active = true
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const kids = trail?.children
    if (!kids) return
    while (pos.length < kids.length) pos.push({ x: 0, y: 0 })
    pos.length = kids.length
    let tx = mouse.x
    let ty = mouse.y
    for (let i = 0; i < pos.length; i++) {
      pos[i].x += (tx - pos[i].x) * 0.35
      pos[i].y += (ty - pos[i].y) * 0.35
      const el = kids[i] as HTMLElement
      el.style.transform = `translate(${pos[i].x}px, ${pos[i].y}px) translate(-50%, -50%)`
      el.style.opacity = mouse.active ? String(1 - i / (pos.length + 1)) : "0"
      tx = pos[i].x
      ty = pos[i].y
    }
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
      aria-label={props.text}
      onPointerMove={onMove}
      onPointerLeave={() => (mouse.active = false)}
    >
      <div ref={(el) => (trail = el)} aria-hidden="true">
        <Index each={chars()}>
          {(ch) => (
            <span {...stylex.props(styles.layer)} style="opacity: 0">
              {ch() === " " ? " " : ch()}
            </span>
          )}
        </Index>
      </div>
    </div>
  )
}
