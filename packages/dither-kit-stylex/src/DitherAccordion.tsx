// Generated from @dither-ui/kit/solid/DitherAccordion.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createUniqueId, For, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { paintRail } from "@dither-ui/kit/engine/rail.ts"
import { cn } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    borderTopStyle: { default: "solid", ":first-child": "solid" },
    borderTopWidth: { default: "1px", ":first-child": "0px" },
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
  },
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  grid: {
    display: "grid",
    transitionProperty: { default: "grid-template-rows", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  box2: { overflow: "hidden" },
  row: { display: "flex", gap: "0.75rem", paddingTop: "0.25rem", paddingBottom: "0.5rem" },
  frame: { position: "relative", width: "2px", alignSelf: "stretch" },
  canvas: { position: "absolute", inset: "0px", height: "100%", width: "100%" },
  box3: {
    minWidth: "0px",
    flex: "1",
    fontSize: "13px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
  },
  text: {
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  rotate90: { rotate: "90deg" },
})

export type AccordionItem = { value: string; title: string }

export type DitherAccordionProps = {
  items: AccordionItem[]
  modelValue: string | string[]
  type?: "single" | "multiple"
  color?: PixelColor
  onUpdateModelValue?: (value: string | string[]) => void
  /** Each panel's content, by its item's `value` (a slot per item). */
  slots?: Record<string, JSX.Element>
}

export default function DitherAccordion(raw: DitherAccordionProps) {
  const props = mergeProps({ type: "single" as const, color: "blue" as PixelColor }, raw)

  const id = `dither-accordion-${createUniqueId()}`
  const rails: HTMLCanvasElement[] = []

  function isOpen(value: string): boolean {
    return Array.isArray(props.modelValue) ? props.modelValue.includes(value) : props.modelValue === value
  }

  function toggle(value: string) {
    if (props.type === "single") {
      props.onUpdateModelValue?.(isOpen(value) ? "" : value)
      return
    }
    const open = Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : []
    props.onUpdateModelValue?.(isOpen(value) ? open.filter((v) => v !== value) : [...open, value])
  }

  function paintAll() {
    for (const canvas of rails) if (canvas) paintRail(canvas, props.color)
  }

  onMount(() => {
    let ro: ResizeObserver | null = null
    requestAnimationFrame(() => {
      paintAll()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver((entries) => {
          for (const entry of entries) paintRail(entry.target as HTMLCanvasElement, props.color)
        })
        for (const canvas of rails) if (canvas) ro.observe(canvas)
      }
    })
    createEffect(on(() => props.color, paintAll, { defer: true }))
    onCleanup(() => ro?.disconnect())
  })

  return (
    <div>
      <For each={props.items}>
        {(item, i) => (
          <div {...stylex.props(styles.box)}>
            <button
              type="button"
              aria-expanded={isOpen(item.value)}
              aria-controls={`${id}-${i()}`}
              {...stylex.props(styles.button)}
              onClick={() => toggle(item.value)}
            >
              <span>{item.title}</span>
              <span aria-hidden="true" class={cn(styles.text, isOpen(item.value) ? styles.rotate90 : null)}>
                ›
              </span>
            </button>
            <div
              id={`${id}-${i()}`}
              inert={!isOpen(item.value)}
              {...stylex.props(styles.grid)}
              style={{ "grid-template-rows": isOpen(item.value) ? "1fr" : "0fr" }}
            >
              <div {...stylex.props(styles.box2)}>
                <div {...stylex.props(styles.row)}>
                  <div {...stylex.props(styles.frame)}>
                    <canvas
                      ref={(el) => (rails[i()] = el)}
                      aria-hidden="true"
                      {...stylex.props(styles.canvas)}
                      style={{ "image-rendering": "pixelated" }}
                    />
                  </div>
                  <div {...stylex.props(styles.box3)}>{props.slots?.[item.value]}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
