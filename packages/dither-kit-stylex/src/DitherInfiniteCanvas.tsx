// Generated from dither-kit/solid/DitherInfiniteCanvas.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createSignal, type JSX, mergeProps, on } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { pointerEvents: "none", position: "absolute", inset: "0px", opacity: "40%" },
  layer2: { position: "absolute", top: "0px", left: "0px", transformOrigin: "0 0" },
  frame: {
    position: "relative",
    touchAction: "none",
    overflow: "hidden",
    backgroundColor: "color-mix(in oklab, var(--background) 40%, transparent)",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  cursorGrabbing: { cursor: "grabbing" },
  cursorGrab: { cursor: "grab" },
})

export type DitherInfiniteCanvasProps = {
  /** Zoom (with `onUpdateZoom`, a model). */
  zoom?: number
  onUpdateZoom?: (zoom: number) => void
  minZoom?: number
  maxZoom?: number
  pattern?: "dots" | "grid" | "plain"
  /** Pattern pitch at zoom 1, CSS px. */
  cell?: number
  label?: string
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element
}

/** Pannable, zoomable work surface — drag to pan, wheel to zoom toward the
 * cursor, the dotted field rides the same transform so space feels real.
 * Content lives in the children at world coordinates. */
export default function DitherInfiniteCanvas(raw: DitherInfiniteCanvasProps) {
  const props = mergeProps(
    { zoom: 1, minZoom: 0.25, maxZoom: 3, pattern: "dots" as const, cell: 16, label: "Infinite canvas" },
    raw,
  )

  let el: HTMLDivElement | undefined
  const [tx, setTx] = createSignal(0)
  const [ty, setTy] = createSignal(0)
  const [z, setZ] = createSignal(props.zoom)
  createEffect(
    on(
      () => props.zoom,
      (v) => setZ(Math.min(props.maxZoom, Math.max(props.minZoom, v))),
      { defer: true },
    ),
  )

  let pointerId = -1
  let lastX = 0
  let lastY = 0
  const [panning, setPanning] = createSignal(false)

  function down(e: PointerEvent) {
    if (e.button !== 0) return
    setPanning(true)
    pointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY
    el?.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!panning() || e.pointerId !== pointerId) return
    setTx(tx() + e.clientX - lastX)
    setTy(ty() + e.clientY - lastY)
    lastX = e.clientX
    lastY = e.clientY
  }
  function up(e: PointerEvent) {
    if (e.pointerId === pointerId) setPanning(false)
  }
  /** Wheel zoom anchored to the cursor: the world point under it stays put. */
  function wheel(e: WheelEvent) {
    e.preventDefault()
    const r = el?.getBoundingClientRect()
    if (!r) return
    const next = Math.min(props.maxZoom, Math.max(props.minZoom, z() * Math.exp(-e.deltaY * 0.0015)))
    const k = next / z()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    setTx(cx - (cx - tx()) * k)
    setTy(cy - (cy - ty()) * k)
    setZ(next)
    props.onUpdateZoom?.(next)
  }

  const layer = (zoomed: number): JSX.CSSProperties => {
    const c = `${props.cell * zoomed}px ${props.cell * zoomed}px`
    if (props.pattern === "dots")
      return { "background-image": "radial-gradient(var(--border) 1px, transparent 1px)", "background-size": c }
    if (props.pattern === "grid")
      return {
        "background-image":
          "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        "background-size": c,
      }
    return {}
  }

  return (
    <div
      ref={(node) => (el = node)}
      role="group"
      aria-label={props.label}
      class={cn(styles.frame, panning() ? styles.cursorGrabbing : styles.cursorGrab, props.xstyle, props.class)}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      on:wheel={wheel}
    >
      <div
        aria-hidden="true"
        {...stylex.props(styles.layer)}
        style={{ ...layer(z()), "background-position": `${tx()}px ${ty()}px` }}
      />
      <div {...stylex.props(styles.layer2)} style={{ transform: `translate(${tx()}px, ${ty()}px) scale(${z()})` }}>
        {props.children}
      </div>
    </div>
  )
}
