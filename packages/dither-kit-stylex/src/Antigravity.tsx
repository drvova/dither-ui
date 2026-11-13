// Generated from @dither-ui/kit/solid/Antigravity.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { hash21 } from "@dither-ui/kit/engine/noise.ts"
import { cn, type StyleProp } from "./lib"
import { createKitTime } from "@dither-ui/kit/solid/runtime/kit-time.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { pointerEvents: "none", position: "absolute", inset: "0px", height: "100%", width: "100%" },
  frame: { position: "relative", overflow: "hidden" },
})

export type AntigravityProps = {
  color?: string
  count?: number
  speed?: number
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

/** The frames a second the rise is measured in: `speed` is px a frame. */
const FPS = 60

/** Where mote `i` stands `f` frames into the run in a `w` x `h` box: it
 * rises `speed * (0.2 + r * 0.15)` px a frame, drifts and sways, and past
 * the top comes back under the bottom at a new place. A pure function, so
 * any moment prints the same however it was reached. */
function moteAt(i: number, w: number, h: number, speed: number, f: number) {
  const r = 1 + hash21(i, 1) * 2.5
  const vx = (hash21(i, 2) - 0.5) * 0.3
  const v = speed * (0.2 + r * 0.15)
  const y0 = hash21(i, 3) * h
  const span = h + 2 * r
  // the way travelled from the line it comes back on, in laps of the box
  const p = h + r - y0 + v * f
  const lap = Math.floor(p / span)
  const into = p - lap * span
  const y = h + r - into
  const rising = Math.abs(v) > 1e-9
  const since = lap === 0 || !rising ? f : v > 0 ? into / v : (into - span) / v
  const from = lap === 0 ? y0 : v > 0 ? h + r : -r
  // a sway of 0.3 px a frame along sin(0.03 y), summed over the lap
  const sway = rising
    ? (0.3 / (0.03 * v)) * (Math.cos(0.03 * y) - Math.cos(0.03 * from))
    : 0.3 * Math.sin(0.03 * y) * since
  return { x: hash21(i + 0.5, lap) * w + vx * since + sway, y, r }
}

export default function Antigravity(raw: AntigravityProps) {
  const props = mergeProps({ color: "#7CFF67", count: 40, speed: 1 }, raw)

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  const [size, setSize] = createSignal({ w: 1, h: 1 }, { equals: (a, b) => a.w === b.w && a.h === b.h })
  const { time } = createKitTime(() => wrap)

  function paint(ms: number) {
    const c = canvas
    const { w, h } = size()
    if (c && c.width !== w) c.width = w
    if (c && c.height !== h) c.height = h
    const ctx = c?.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = props.color
    const f = (ms * FPS) / 1000
    for (let i = 0, n = Math.max(1, Math.round(props.count)); i < n; i++) {
      const m = moteAt(i, w, h, props.speed, f)
      ctx.globalAlpha = 0.3 + m.r * 0.2
      ctx.beginPath()
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  onMount(() => {
    const resize = () => {
      const r = wrap?.getBoundingClientRect()
      if (r) setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) })
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (wrap) ro.observe(wrap)
    onCleanup(() => ro.disconnect())
    createEffect(() => paint(time()))
  })

  return (
    <div ref={(el) => (wrap = el)} class={cn(styles.frame, props.xstyle, props.class)}>
      {props.children}
      <canvas ref={(el) => (canvas = el)} {...stylex.props(styles.canvas)} aria-hidden="true" />
    </div>
  )
}
