// Generated from ../solid/DitherGauge.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, For, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { isDirected, onSeek } from "../engine/clock"
import { gaugeAngle, gaugePoint, gaugeTicks, paintGauge } from "../engine/gauge"
import { clamp01, fillOf, pixelPrefersReducedMotion, type PixelColor } from "../engine/pixel"
import { spring } from "../engine/spring"
import { cn, type StyleProp } from "./lib"
import { useDitherMatrix } from "../solid/runtime/screen"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  svg: {
    position: "absolute",
    inset: "0px",
    height: "100%",
    width: "100%",
    fontFamily: "var(--font-mono)",
  },
  frame: { position: "relative", aspectRatio: "1 / 1", width: "100%", color: "var(--foreground)" },
})

/** Gauge: an instrument dial reading a value, read-only (`role="meter"`).
 * A 240-degree band printed cell by cell through the threshold matrix,
 * filled to the needle, the zone past `warn` (a share of the scale; null
 * for none) in the warning ink; ticks and numerals on the scale, the
 * reading under the hub. The needle settles on the kit's spring when the
 * value changes; under reduced motion, or a director's clock, it stands on
 * the reading. Square, as wide as its box. */
export type DitherGaugeProps = {
  value: number
  min?: number
  max?: number
  /** Intervals between the major ticks. */
  ticks?: number
  /** Where the warning zone starts, as a share of the scale; null: none. */
  warn?: number | null
  /** What it reads, under the reading (also its accessible name). */
  label?: string
  decimals?: number
  color?: PixelColor
  warnColor?: PixelColor
  seed?: number
  class?: string
  xstyle?: StyleProp
}

const CELL = 2
const SETTLE_MS = 600

export default function DitherGauge(raw: DitherGaugeProps) {
  const props = mergeProps(
    {
      min: 0,
      max: 100,
      ticks: 10,
      warn: 0.8 as number | null,
      decimals: 0,
      color: "grey" as PixelColor,
      warnColor: "orange" as PixelColor,
    },
    raw,
  )

  const target = createMemo(() => clamp01((props.value - props.min) / (props.max - props.min || 1)))
  const [shown, setShown] = createSignal(target())
  const matrix = useDitherMatrix(() => props.seed)

  let root: HTMLDivElement | undefined
  let canvas: HTMLCanvasElement | undefined
  let cells = 0

  function paint() {
    const ctx = canvas?.getContext("2d", { willReadFrequently: true })
    if (!ctx || cells <= 0) return
    paintGauge(ctx, cells, fillOf(props.color), fillOf("grey"), fillOf(props.warnColor), shown(), props.warn, matrix())
  }

  function resize() {
    if (!root || !canvas) return
    cells = Math.max(16, Math.round(root.getBoundingClientRect().width / CELL))
    canvas.width = cells
    canvas.height = cells
    paint()
  }

  // The needle: from where it stands to the reading on the spring.
  let raf = 0
  function settle() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    const from = shown()
    const to = target()
    if (from === to) return
    if (pixelPrefersReducedMotion() || isDirected()) {
      setShown(to)
      return
    }
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / SETTLE_MS)
      setShown(from + (to - from) * spring(p))
      raf = p < 1 && !isDirected() ? requestAnimationFrame(step) : 0
      if (!raf) setShown(to)
    }
    raf = requestAnimationFrame(step)
  }

  onMount(() => {
    const unseek = onSeek(() => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      setShown(target())
    })

    createEffect(on(target, settle, { defer: true }))
    createEffect(
      on([shown, matrix, () => props.warn, () => props.color, () => props.warnColor], paint, { defer: true }),
    )

    let ro: ResizeObserver | null = null
    requestAnimationFrame(() => {
      resize()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(resize)
        if (root) ro.observe(root)
      }
    })
    onCleanup(() => {
      unseek()
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
    })
  })

  const format = (n: number) => n.toFixed(props.decimals)
  const reading = createMemo(() => format(props.value))
  /** Past six intervals a numeral goes on every other major, the ends always. */
  const named = (i: number) => Math.round(props.ticks) <= 6 || i % 2 === 0
  const scale = createMemo(() =>
    gaugeTicks(props.ticks).map((t, i) => {
      const a = gaugeAngle(t)
      const [x1, y1] = gaugePoint(a, 0.6)
      const [x2, y2] = gaugePoint(a, 0.69)
      const [nx, ny] = gaugePoint(a, 0.47)
      const n = props.min + (props.max - props.min) * t
      return { t, x1, y1, x2, y2, nx, ny, text: Number.isInteger(n) ? String(n) : n.toFixed(1), named: named(i) }
    }),
  )
  /** A minor tick halfway between each pair of majors. */
  const minor = createMemo(() => {
    const n = Math.max(1, Math.round(props.ticks))
    return Array.from({ length: n }, (_, i) => {
      const a = gaugeAngle((i + 0.5) / n)
      const [x1, y1] = gaugePoint(a, 0.64)
      const [x2, y2] = gaugePoint(a, 0.69)
      return { x1, y1, x2, y2 }
    })
  })
  const needle = createMemo(() => {
    const a = gaugeAngle(shown())
    const [x1, y1] = gaugePoint(a + 180, 0.12)
    const [x2, y2] = gaugePoint(a, 0.84)
    return { x1, y1, x2, y2 }
  })
  const hub = createMemo(() => `rgb(${fillOf(props.warnColor).join(" ")})`)
  const numerals = createMemo(() => Math.round(props.ticks) <= 12)

  return (
    <div
      ref={(el) => (root = el)}
      role="meter"
      aria-valuemin={props.min}
      aria-valuemax={props.max}
      aria-valuenow={props.value}
      aria-valuetext={props.label ? `${reading()} ${props.label}` : reading()}
      aria-label={props.label}
      class={cn(styles.frame, props.xstyle, props.class)}
    >
      <canvas
        ref={(el) => (canvas = el)}
        aria-hidden="true"
        {...stylex.props(styles.canvas)}
        style={{ "image-rendering": "pixelated" }}
      />
      <svg viewBox="0 0 100 100" aria-hidden="true" {...stylex.props(styles.svg)}>
        <For each={minor()}>
          {(m) => (
            <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke="currentColor" stroke-width="0.6" opacity="0.45" />
          )}
        </For>
        <For each={scale()}>
          {(s) => (
            <g>
              <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="currentColor" stroke-width="1.2" />
              <Show when={numerals() && s.named}>
                <text
                  x={s.nx}
                  y={s.ny}
                  font-size="5.5"
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="currentColor"
                  opacity="0.7"
                >
                  {s.text}
                </text>
              </Show>
            </g>
          )}
        </For>
        <line
          x1={needle().x1}
          y1={needle().y1}
          x2={needle().x2}
          y2={needle().y2}
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
        <circle cx="50" cy="50" r="3.6" fill={hub()} />
        <text
          x="50"
          y="73"
          font-size="10"
          text-anchor="middle"
          dominant-baseline="central"
          fill="currentColor"
          style={{ "font-variant-numeric": "tabular-nums" }}
        >
          {reading()}
        </text>
        <Show when={props.label}>
          <text
            x="50"
            y="83"
            font-size="5"
            text-anchor="middle"
            dominant-baseline="central"
            fill="currentColor"
            opacity="0.6"
          >
            {props.label}
          </text>
        </Show>
      </svg>
    </div>
  )
}
