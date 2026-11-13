// Generated from ../solid/GhostCursor.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn, type StyleProp } from "./lib"
import { createInviewLoop } from "../solid/runtime/in-view"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { pointerEvents: "none", position: "absolute", inset: "0px", height: "100%", width: "100%" },
  frame: { position: "relative", overflow: "hidden" },
})

export type GhostCursorProps = {
  color?: string
  count?: number
  size?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function GhostCursor(raw: GhostCursorProps) {
  const props = mergeProps({ color: "#7CFF67", count: 18, size: 10 }, raw)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const pts: { x: number; y: number }[] = []
  let raf = 0
  const m = { x: 0, y: 0, active: false }

  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    c.width = Math.max(1, r.width)
    c.height = Math.max(1, r.height)
  }
  function onMove(e: PointerEvent) {
    const r = wrap?.getBoundingClientRect()
    if (!r) return
    m.x = e.clientX - r.left
    m.y = e.clientY - r.top
    m.active = true
  }
  function frame() {
    raf = requestAnimationFrame(frame)
    const c = canvas
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    const head = pts[0] || { x: m.x, y: m.y }
    pts.unshift({ x: head.x + (m.x - head.x) * 0.5, y: head.y + (m.y - head.y) * 0.5 })
    if (pts.length > props.count) pts.pop()
    ctx.clearRect(0, 0, c.width, c.height)
    if (!m.active) return
    ctx.fillStyle = props.color
    for (let i = 0; i < pts.length; i++) {
      const a = 1 - i / pts.length
      ctx.globalAlpha = a * 0.8
      ctx.beginPath()
      ctx.arc(pts[i].x, pts[i].y, props.size * a, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
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

  onMount(() => {
    resize()
    const ro = new ResizeObserver(resize)
    if (wrap) ro.observe(wrap)
    onCleanup(() => ro.disconnect())
  })
  createInviewLoop(() => wrap, start, stop)

  return (
    <div
      ref={(el) => (wrap = el)}
      class={cn(styles.frame, props.xstyle, props.class)}
      onPointerMove={onMove}
      onPointerLeave={() => (m.active = false)}
    >
      {props.children}
      <canvas ref={(el) => (canvas = el)} {...stylex.props(styles.canvas)} aria-hidden="true" />
    </div>
  )
}
