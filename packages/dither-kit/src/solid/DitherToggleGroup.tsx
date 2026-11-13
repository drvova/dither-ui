import { createEffect, createMemo, For, mergeProps, on, onCleanup, onMount } from "solid-js"
import { labelFill } from "../engine/label-fill"
import { fillOf, type PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import type { Option } from "./DitherSelect"
import { paintToggleCanvas } from "./DitherToggle"

export type DitherToggleGroupProps = {
  options: Option[]
  modelValue: string | string[]
  onUpdateModelValue?: (value: string | string[]) => void
  type?: "single" | "multiple"
  color?: PixelColor
  class?: string
}

export default function DitherToggleGroup(raw: DitherToggleGroupProps) {
  const props = mergeProps({ type: "single" as const, color: "blue" as PixelColor }, raw)

  // A bright fill takes black ink: white on it would sink under AA.
  const darkInk = createMemo(() => labelFill(fillOf(props.color), "gradient", "straight").darkInk)

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
      class={cn("inline-flex gap-1 rounded-md border border-border/60 p-1", props.class)}
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
              "relative isolate overflow-hidden rounded-md border px-2.5 py-1.5 font-mono text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
              isOn(o)
                ? darkInk()
                  ? "border-transparent text-black"
                  : "border-transparent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => pick(o)}
          >
            <canvas
              ref={(el) => (canvases[i()] = el)}
              aria-hidden="true"
              class="absolute inset-0 -z-10 h-full w-full"
              style={{ "image-rendering": "pixelated", display: isOn(o) ? undefined : "none" }}
            />
            <span class="relative">{o.label}</span>
          </button>
        )}
      </For>
    </div>
  )
}
