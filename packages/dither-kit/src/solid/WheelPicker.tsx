import { createEffect, createMemo, createSignal, For, mergeProps, on, onCleanup, onMount } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./WheelPicker.css"

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
 * the nearest notch. Wheel, touch and spinbutton keys steer it; wheels
 * compose side by side for date and time pickers. The drum is CSS: each row
 * turns and fades by where it stands in the wheel's scroll, a view timeline
 * (`WheelPicker.css`), flat where the browser has none. Reduced motion
 * flattens the drum and stills the glides. */
export default function WheelPicker(raw: WheelPickerProps) {
  const props = mergeProps({ rows: 5, label: "Wheel picker", color: "blue" as PixelColor }, raw)

  let scroller: HTMLDivElement | undefined
  const [st, setSt] = createSignal(0)
  let settle: ReturnType<typeof setTimeout> | undefined
  /** Standing on its value: from here the stylesheet glides it. */
  const [ready, setReady] = createSignal(false)

  const opts = createMemo(() => props.options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)))
  const rowCount = createMemo(() => Math.max(3, props.rows | 1))
  const clampIndex = (i: number) => Math.max(0, Math.min(opts().length - 1, i))
  const index = createMemo(() => clampIndex(Math.round(st() / ITEM)))

  function commit() {
    const el = scroller
    if (!el) return
    const i = clampIndex(Math.round(el.scrollTop / ITEM))
    if (Math.abs(el.scrollTop - i * ITEM) > 1) el.scrollTo({ top: i * ITEM })
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
    el.scrollTo({ top: j * ITEM })
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
  const indexOfValue = (v: string | undefined) => opts().findIndex((o) => o.value === v)
  onMount(() => {
    // The drum follows the value to its row, wherever the options put it.
    createEffect(
      on(
        () => indexOfValue(props.modelValue),
        (i) => {
          if (i >= 0 && i !== index()) scroller?.scrollTo({ top: i * ITEM })
        },
        { defer: true },
      ),
    )
    const el = scroller
    if (!el) return
    // where the value stands, at once: the wheel glides only to a new notch
    el.scrollTop = Math.max(0, indexOfValue(props.modelValue)) * ITEM
    setSt(el.scrollTop)
    setReady(true)
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
        class="dk-wheel snap-y snap-mandatory select-none overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          height: `${rowCount() * ITEM}px`,
          "padding-block": `${((rowCount() - 1) / 2) * ITEM}px`,
          "--dk-wheel-d": String((rowCount() + 1) / 2),
        }}
        onScroll={onScroll}
        onKeyDown={onKeydown}
        data-ready={ready() ? "" : undefined}
      >
        <For each={opts()}>
          {(o, i) => (
            <div
              aria-hidden="true"
              class={cn(
                "dk-wheel-row flex h-7 snap-center items-center justify-center px-3 text-[13px] tabular-nums",
                i() === index() ? "font-medium" : "text-muted-foreground/80",
              )}
              style={i() === index() ? { color: cssColor(props.color) } : undefined}
              onClick={() => go(i())}
            >
              {o.label}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
