// Generated from @dither-ui/kit/solid/ImageTrail.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { pointerEvents: "none", position: "absolute", inset: "0px", height: "100%", width: "100%" },
  frame: { position: "relative", overflow: "hidden" },
})

export type ImageTrailProps = {
  /** @docs string[] (hex)
   * @default ['#5227FF', '#7CFF67', ...] */
  colors?: string[]
  /** @docs number (px) */
  size?: number
  /** @docs number (ms) */
  duration?: number
  class?: string
  xstyle?: StyleProp
  /** @docs content */
  children?: JSX.Element
}

type Tile = { x: number; y: number; t0: number; color: string; rot: number }

export default function ImageTrail(raw: ImageTrailProps) {
  const props = mergeProps(
    { colors: ["#5227FF", "#7CFF67", "#3DA5FF", "#FF3D2E", "#FFD23D"], size: 40, duration: 650 },
    raw,
  )

  let wrap: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let tiles: Tile[] = []
  let raf = 0
  let last = { x: 0, y: 0 }
  let ci = 0

  function resize() {
    const c = canvas
    const w = wrap
    if (!c || !w) return
    const r = w.getBoundingClientRect()
    c.width = Math.max(1, r.width)
    c.height = Math.max(1, r.height)
  }
  function onMove(e: PointerEvent) {
    if (pixelPrefersReducedMotion()) return
    const r = wrap?.getBoundingClientRect()
    if (!r) return
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (Math.hypot(x - last.x, y - last.y) < props.size * 0.6) return
    last = { x, y }
    const palette = props.colors.length ? props.colors : ["#7CFF67"]
    tiles.push({ x, y, t0: performance.now(), color: palette[ci % palette.length], rot: (Math.random() - 0.5) * 0.6 })
    ci++
    if (!raf) raf = requestAnimationFrame(frame)
  }
  function frame(now: number) {
    const c = canvas
    const ctx = c?.getContext("2d")
    if (!c || !ctx) {
      raf = 0
      return
    }
    ctx.clearRect(0, 0, c.width, c.height)
    tiles = tiles.filter((t) => now - t.t0 < props.duration)
    for (const t of tiles) {
      const p = (now - t.t0) / props.duration
      const s = props.size * (1 - p * 0.4)
      ctx.save()
      ctx.translate(t.x, t.y)
      ctx.rotate(t.rot)
      ctx.globalAlpha = 1 - p
      ctx.fillStyle = t.color
      ctx.fillRect(-s / 2, -s / 2, s, s)
      ctx.restore()
    }
    ctx.globalAlpha = 1
    raf = tiles.length ? requestAnimationFrame(frame) : 0
  }

  onMount(() => {
    resize()
    const ro = new ResizeObserver(resize)
    if (wrap) ro.observe(wrap)
    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
    })
  })

  return (
    <div ref={(el) => (wrap = el)} class={cn(styles.frame, props.xstyle, props.class)} onPointerMove={onMove}>
      {props.children}
      <canvas ref={(el) => (canvas = el)} {...stylex.props(styles.canvas)} aria-hidden="true" />
    </div>
  )
}
