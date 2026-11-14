import { createEffect, createMemo, createSignal, For, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import { project, velocityFrom, type VelocitySample } from "../engine/gesture"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type WheelOption = string | { value: string; label: string }

const ITEM = 28

export type WheelPickerProps = {
  /** @docs (string | { value, label })[] */
  options: WheelOption[]
  /** @docs string (with onUpdateModelValue) */
  modelValue?: string
  /** Visible rows (odd).
   * @docs number: visible rows (odd) */
  rows?: number
  /** Accessible name for the wheel.
   * @docs string: accessible name */
  label?: string
  /** @docs PixelColor: selected notch tint */
  color?: PixelColor
  class?: string
  onUpdateModelValue?: (value: string) => void
}

/** iOS-style picker wheel — a 3D drum on native momentum scroll that snaps to
 * the nearest notch. Wheel, drag (mouse via gesture projection, touch native)
 * and spinbutton keys all steer it; wheels compose side by side for date and
 * time pickers. Reduced motion flattens the drum and stills the glides. */
export default function WheelPicker(raw: WheelPickerProps) {
  const props = mergeProps({ rows: 5, label: "Wheel picker", color: "blue" as PixelColor }, raw)

  let scroller: HTMLDivElement | undefined
  const [st, setSt] = createSignal(0)
  // Read at mount (a server render has no media to ask).
  const [still, setStill] = createSignal(false)
  let settle: ReturnType<typeof setTimeout> | undefined
  let samples: VelocitySample[] = []
  let dragging = false
  let moved = false

  const opts = createMemo(() => props.options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)))
  const rowCount = createMemo(() => Math.max(3, props.rows | 1))
  const clampIndex = (i: number) => Math.max(0, Math.min(opts().length - 1, i))
  const index = createMemo(() => clampIndex(Math.round(st() / ITEM)))

  const styleOf = (i: number): JSX.CSSProperties => {
    const d = (i * ITEM - st()) / ITEM
    const opacity = String(Math.max(0.15, 1 - Math.abs(d) * 0.22))
    if (still()) return { opacity }
    const a = Math.max(-64, Math.min(64, d * -16))
    return { opacity, transform: `perspective(560px) rotateX(${a}deg)` }
  }

  function commit() {
    const el = scroller
    if (!el || dragging) return
    const i = clampIndex(Math.round(el.scrollTop / ITEM))
    if (Math.abs(el.scrollTop - i * ITEM) > 1) el.scrollTo({ top: i * ITEM, behavior: still() ? "auto" : "smooth" })
    el.style.scrollSnapType = ""
    const v = opts()[i]?.value
    if (v !== undefined && v !== props.modelValue) props.onUpdateModelValue?.(v)
  }
  function onScroll() {
    const el = scroller
    if (!el) return
    setSt(el.scrollTop)
    clearTimeout(settle)
    settle = setTimeout(commit, 120)
  }
  function go(i: number) {
    const el = scroller
    if (!el) return
    const j = clampIndex(i)
    el.scrollTo({ top: j * ITEM, behavior: still() ? "auto" : "smooth" })
    const v = opts()[j]?.value
    if (v !== undefined && v !== props.modelValue) props.onUpdateModelValue?.(v)
  }
  function onKeydown(e: KeyboardEvent) {
    const step = ({ ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 } as Record<string, number>)[e.key]
    if (step !== undefined) {
      e.preventDefault()
      go(index() + step)
      return
    }
    if (e.key === "Home") {
      e.preventDefault()
      go(0)
    } else if (e.key === "End") {
      e.preventDefault()
      go(opts().length - 1)
    }
  }
  function onPointerdown(e: PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    const el = scroller
    if (!el) return
    e.preventDefault()
    el.focus()
    el.setPointerCapture(e.pointerId)
    el.style.scrollSnapType = "none"
    dragging = true
    moved = false
    samples = [{ t: e.timeStamp, p: e.clientY }]
  }
  function onPointermove(e: PointerEvent) {
    if (!dragging) return
    const el = scroller
    const prev = samples[samples.length - 1]
    if (!el || !prev) return
    if (Math.abs(e.clientY - samples[0].p) > 4) moved = true
    el.scrollTop -= e.clientY - prev.p
    samples.push({ t: e.timeStamp, p: e.clientY })
    if (samples.length > 6) samples.shift()
  }
  function onPointerup(e: PointerEvent) {
    if (!dragging || e.pointerType !== "mouse") return
    dragging = false
    const el = scroller
    if (!el) return
    const dest = el.scrollTop - project(still() ? 0 : velocityFrom(samples))
    go(Math.round(dest / ITEM))
    clearTimeout(settle)
    settle = setTimeout(commit, 120)
  }

  const indexOfValue = (v: string | undefined) => opts().findIndex((o) => o.value === v)
  onMount(() => {
    setStill(pixelPrefersReducedMotion())
    // The drum follows the value to its row, wherever the options put it.
    createEffect(
      on(
        () => indexOfValue(props.modelValue),
        (i) => {
          if (i >= 0 && i !== index() && !dragging)
            scroller?.scrollTo({ top: i * ITEM, behavior: still() ? "auto" : "smooth" })
        },
        { defer: true },
      ),
    )
    const el = scroller
    if (!el) return
    el.scrollTop = Math.max(0, indexOfValue(props.modelValue)) * ITEM
    setSt(el.scrollTop)
  })
  onCleanup(() => clearTimeout(settle))

  return (
    <div class={cn("relative inline-block", props.class)}>
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-7 -translate-y-1/2 rounded-md border-y border-border/70 bg-foreground/[0.04]"
      />
      <div
        ref={(el) => (scroller = el)}
        role="spinbutton"
        tabindex="0"
        aria-label={props.label}
        aria-valuemin={0}
        aria-valuemax={opts().length - 1}
        aria-valuenow={index()}
        aria-valuetext={opts()[index()]?.label}
        class="snap-y snap-mandatory select-none overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: `${rowCount() * ITEM}px`, "padding-block": `${((rowCount() - 1) / 2) * ITEM}px` }}
        onScroll={onScroll}
        onKeyDown={onKeydown}
        onPointerDown={onPointerdown}
        onPointerMove={onPointermove}
        onPointerUp={onPointerup}
        onPointerCancel={onPointerup}
      >
        <For each={opts()}>
          {(o, i) => (
            <div
              aria-hidden="true"
              class={cn(
                "flex h-7 snap-center items-center justify-center px-3 text-[13px] tabular-nums",
                i() === index() ? "font-medium" : "text-muted-foreground/80",
              )}
              style={{ ...styleOf(i()), ...(i() === index() ? { color: cssColor(props.color) } : {}) }}
              onClick={() => !moved && go(i())}
            >
              {o.label}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
