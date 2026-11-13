// Generated from dither-kit/solid/DitherToggleGroup.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, For, mergeProps, on, onCleanup, onMount } from "solid-js"
import { darkInkOnDark, LABEL_COVERAGE } from "dither-kit/engine/palette.ts"
import { fillOf, type PixelColor } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import type { Option } from "./DitherSelect"
import { paintToggleCanvas } from "./DitherToggle"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  canvas: { position: "absolute", inset: "0px", zIndex: "-10", height: "100%", width: "100%" },
  frame: { position: "relative" },
  row: {
    display: "inline-flex",
    gap: "0.25rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    padding: "0.25rem",
  },
  button: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  borderTransparent: { borderColor: "transparent", color: "#000" },
  borderTransparent2: { borderColor: "transparent", color: "var(--foreground)" },
  borderTransparent3: {
    borderColor: "transparent",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})

export type DitherToggleGroupProps = {
  options: Option[]
  modelValue: string | string[]
  onUpdateModelValue?: (value: string | string[]) => void
  type?: "single" | "multiple"
  color?: PixelColor
  class?: string
  xstyle?: StyleProp
}

export default function DitherToggleGroup(raw: DitherToggleGroupProps) {
  const props = mergeProps({ type: "single" as const, color: "blue" as PixelColor }, raw)

  // A bright fill takes black ink: white on it would sink under AA.
  const darkInk = createMemo(() => darkInkOnDark(fillOf(props.color), LABEL_COVERAGE.gradient))

  let root: HTMLDivElement | undefined
  const btns: HTMLButtonElement[] = []
  const canvases: HTMLCanvasElement[] = []
  let ro: ResizeObserver | null = null

  function isOn(o: Option): boolean {
    return Array.isArray(props.modelValue) ? props.modelValue.includes(o.value) : props.modelValue === o.value
  }

  const activeIndex = createMemo(() => {
    if (Array.isArray(props.modelValue)) return 0
    const i = props.options.findIndex((o) => o.value === props.modelValue)
    return i >= 0 ? i : 0
  })

  function pick(o: Option) {
    if (o.disabled) return
    if (props.type === "multiple") {
      const cur = Array.isArray(props.modelValue) ? props.modelValue : []
      props.onUpdateModelValue?.(cur.includes(o.value) ? cur.filter((v) => v !== o.value) : [...cur, o.value])
    } else {
      props.onUpdateModelValue?.(o.value)
    }
  }

  function paintAll() {
    const fill = fillOf(props.color)
    props.options.forEach((o, i) => {
      const btn = btns[i]
      const canvas = canvases[i]
      if (!btn || !canvas || !isOn(o)) return
      paintToggleCanvas(btn, canvas, fill)
    })
  }

  function onKeydown(e: KeyboardEvent) {
    if (props.type !== "single") return
    const dir =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const n = props.options.length
    let i = activeIndex()
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!props.options[i].disabled) {
        props.onUpdateModelValue?.(props.options[i].value)
        queueMicrotask(() => btns[i]?.focus())
        return
      }
    }
  }

  onMount(() => {
    // Defer to rAF to avoid forced reflow from getBoundingClientRect()
    // inside paintToggleCanvas during the mount.
    requestAnimationFrame(paintAll)
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => requestAnimationFrame(paintAll))
      if (root) ro.observe(root)
    }
    createEffect(
      on([() => props.modelValue, () => props.color, () => props.options], () => requestAnimationFrame(paintAll), {
        defer: true,
      }),
    )
    onCleanup(() => ro?.disconnect())
  })

  return (
    <div
      ref={(el) => (root = el)}
      role={props.type === "single" ? "radiogroup" : "group"}
      class={cn(styles.row, props.xstyle, props.class)}
      onKeyDown={onKeydown}
    >
      <For each={props.options}>
        {(o, i) => (
          <button
            ref={(el) => (btns[i()] = el)}
            type="button"
            role={props.type === "single" ? "radio" : undefined}
            aria-checked={props.type === "single" ? isOn(o) : undefined}
            aria-pressed={props.type === "multiple" ? isOn(o) : undefined}
            tabindex={props.type === "single" ? (i() === activeIndex() ? 0 : -1) : undefined}
            disabled={o.disabled}
            class={cn(
              styles.button,
              isOn(o) ? (darkInk() ? styles.borderTransparent : styles.borderTransparent2) : styles.borderTransparent3,
            )}
            onClick={() => pick(o)}
          >
            <canvas
              ref={(el) => (canvases[i()] = el)}
              aria-hidden="true"
              {...stylex.props(styles.canvas)}
              style={{ "image-rendering": "pixelated", display: isOn(o) ? undefined : "none" }}
            />
            <span {...stylex.props(styles.frame)}>{o.label}</span>
          </button>
        )}
      </For>
    </div>
  )
}
