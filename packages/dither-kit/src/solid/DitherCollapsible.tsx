import { createEffect, createUniqueId, type JSX, mergeProps, on, onCleanup, onMount } from "solid-js"
import type { PixelColor } from "../engine/pixel"
import { paintRail } from "../engine/rail"

export type DitherCollapsibleProps = {
  title: string
  modelValue?: boolean
  color?: PixelColor
  onUpdateModelValue?: (value: boolean) => void
  children?: JSX.Element
}

export default function DitherCollapsible(raw: DitherCollapsibleProps) {
  const props = mergeProps({ modelValue: false, color: "blue" as PixelColor }, raw)

  const id = `dither-collapsible-${createUniqueId()}`
  let rail: HTMLCanvasElement | undefined

  function paint() {
    const canvas = rail
    if (canvas) paintRail(canvas, props.color)
  }

  onMount(() => {
    let ro: ResizeObserver | null = null
    requestAnimationFrame(() => {
      paint()
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(paint)
        if (rail) ro.observe(rail)
      }
    })
    createEffect(on(() => props.color, paint, { defer: true }))
    onCleanup(() => ro?.disconnect())
  })

  return (
    <div>
      <button
        type="button"
        aria-expanded={props.modelValue}
        aria-controls={id}
        class="flex w-full items-center justify-between gap-2 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
      >
        <span>{props.title}</span>
        <span
          aria-hidden="true"
          class="text-muted-foreground transition-transform duration-200 motion-reduce:transition-none"
          classList={{ "rotate-90": props.modelValue }}
        >
          ›
        </span>
      </button>
      <div
        id={id}
        inert={!props.modelValue}
        class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
        style={{ "grid-template-rows": props.modelValue ? "1fr" : "0fr" }}
      >
        <div class="overflow-hidden">
          <div class="flex gap-3 pt-1 pb-2">
            <div class="relative w-[2px] self-stretch">
              <canvas
                ref={(el) => (rail = el)}
                aria-hidden="true"
                class="absolute inset-0 h-full w-full"
                style={{ "image-rendering": "pixelated" }}
              />
            </div>
            <div class="min-w-0 flex-1 text-[13px] leading-relaxed text-muted-foreground">{props.children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
