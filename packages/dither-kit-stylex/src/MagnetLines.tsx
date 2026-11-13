// Generated from dither-kit/solid/MagnetLines.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { pointerEvents: "none", position: "absolute", inset: "0px", height: "100%", width: "100%" },
  frame: { position: "relative", overflow: "hidden" },
})

export type MagnetLinesProps = {
  color?: string
  gap?: number
  lineLength?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

export default function MagnetLines(raw: MagnetLinesProps) {
  const props = mergeProps({ color: "#7CFF67", gap: 28, lineLength: 14 }, raw)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let ro: ResizeObserver | null = null
  let W = 1
  let H = 1
  const m = { x: 0.5, y: 0.5 }

  function draw() {
    const c = canvas
    const ctx = c?.getContext("2d")
    if (!c || !ctx) return
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = props.color
    ctx.lineWidth = 2
    const half = props.lineLength / 2
    for (let y = props.gap / 2; y < H; y += props.gap) {
      for (let x = props.gap / 2; x < W; x += props.gap) {
        const a = Math.atan2(m.y - y, m.x - x)
        const dx = Math.cos(a) * half
        const dy = Math.sin(a) * half
        ctx.beginPath()
        ctx.moveTo(x - dx, y - dy)
        ctx.lineTo(x + dx, y + dy)
        ctx.stroke()
      }
    }
  }
  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    W = c.width = Math.max(1, r.width)
    H = c.height = Math.max(1, r.height)
    if (m.x <= 1) {
      m.x = W / 2
      m.y = H / 2
    }
    draw()
  }
  function onMove(e: PointerEvent) {
    const r = wrap?.getBoundingClientRect()
    if (!r) return
    m.x = e.clientX - r.left
    m.y = e.clientY - r.top
    draw()
  }

  onMount(() => {
    resize()
    ro = new ResizeObserver(() => resize())
    if (wrap) ro.observe(wrap)
  })
  onCleanup(() => ro?.disconnect())

  return (
    <div ref={(el) => (wrap = el)} class={cn(styles.frame, props.xstyle, props.class)} onPointerMove={onMove}>
      {props.children}
      <canvas ref={(el) => (canvas = el)} {...stylex.props(styles.canvas)} aria-hidden="true" />
    </div>
  )
}
