import { createMemo, createSignal, For, type JSX, mergeProps, Show } from "solid-js"
import { cssColor } from "../engine/palette"
import { type PixelColor, pixelPrefersReducedMotion } from "../engine/pixel"
import { POPOVER } from "../tailwind/control"
import { cn } from "../tailwind/lib"

export type PreviewRailItem = { value: string; label: string; hint?: string; color?: PixelColor }

export type PreviewRailProps = {
  /** @docs { value, label, hint?, color? }[]
   * @default required */
  items: PreviewRailItem[]
  /** @docs string (with onUpdateModelValue): active destination
   * @default undefined */
  modelValue?: string
  /** Pyramid falloff radius in px.
   * @docs number (px): pyramid falloff radius */
  range?: number
  /** Screen edge the rail hugs; the preview floats toward the other side.
   * @docs "left" | "right": edge the rail hugs */
  side?: "left" | "right"
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** What the floating preview shows for an item, in place of its label and hint.
   * @docs ({ item }) => JSX.Element (custom preview content)
   * @default label + hint */
  preview?: (scope: { item: PreviewRailItem }) => JSX.Element
}

/** Codex-style navigation rail — compact ticks swell into a pyramid around
 * the pointer and float a destination preview beside the hovered or focused
 * tick. Reduced motion keeps the ticks still; the preview remains. */
export default function PreviewRail(raw: PreviewRailProps) {
  const props = mergeProps({ range: 56, side: "left" as const }, raw)

  let rail: HTMLElement | undefined
  const [py, setPy] = createSignal<number | null>(null)
  const [focusIndex, setFocusIndex] = createSignal<number | null>(null)
  // Asked once, by the first pointer over the rail: a server render has no
  // media to ask.
  let still: boolean | undefined

  function track(e: PointerEvent) {
    const r = rail?.getBoundingClientRect()
    if (r) setPy(e.clientY - r.top)
  }
  function onFocusin(e: FocusEvent) {
    const b = (e.target as HTMLElement).closest("button")
    setFocusIndex(b ? Number(b.dataset.i) : null)
  }

  const centerOf = (i: number) => {
    const b = rail?.querySelectorAll("button")[i] as HTMLElement | undefined
    return b ? b.offsetTop + b.offsetHeight / 2 : null
  }
  const widthOf = (i: number) => {
    const rest = props.items[i]?.value === props.modelValue ? 16 : 10
    const at = py()
    if (at === null || (still ??= pixelPrefersReducedMotion())) return rest
    const c = centerOf(i)
    const w = c === null ? 0 : Math.max(0, 1 - Math.abs(at - c) / props.range)
    return rest + 16 * w
  }
  const previewIndex = createMemo(() => {
    const focused = focusIndex()
    if (focused !== null) return focused
    const at = py()
    if (at === null) return null
    let best: number | null = null
    let bd = Infinity
    for (let i = 0; i < props.items.length; i++) {
      const c = centerOf(i)
      if (c === null) continue
      const d = Math.abs(at - c)
      if (d < bd) {
        bd = d
        best = i
      }
    }
    return best
  })
  const preview = createMemo(() => {
    const i = previewIndex()
    return i === null ? null : (props.items[i] ?? null)
  })
  const previewTop = createMemo(() => {
    const i = previewIndex()
    return i === null ? 0 : (centerOf(i) ?? 0)
  })

  return (
    <nav
      ref={(el) => (rail = el)}
      class={cn("relative inline-flex flex-col gap-2 py-1", props.class)}
      aria-label="Preview rail"
      onPointerMove={track}
      onPointerLeave={() => setPy(null)}
      onFocusIn={onFocusin}
      onFocusOut={() => setFocusIndex(null)}
    >
      <For each={props.items}>
        {(it, i) => (
          <button
            type="button"
            data-i={i()}
            aria-label={it.hint ? `${it.label} — ${it.hint}` : it.label}
            aria-current={it.value === props.modelValue ? "page" : undefined}
            class={cn(
              "flex h-4 w-9 items-center rounded-md px-1 hover:bg-card/60",
              props.side === "right" ? "justify-end" : "justify-start",
            )}
            onClick={() => props.onUpdateModelValue?.(it.value)}
          >
            <span
              aria-hidden="true"
              class="h-0.5 rounded-full bg-foreground/30 transition-[width] duration-150 ease-out motion-reduce:transition-none"
              style={{
                width: `${widthOf(i())}px`,
                ...(it.value === props.modelValue ? { background: cssColor(it.color ?? "blue") } : {}),
              }}
            />
          </button>
        )}
      </For>
      <Show when={preview()}>
        {(shown) => (
          <div
            aria-hidden="true"
            class={cn(
              POPOVER,
              "pointer-events-none absolute z-10 whitespace-nowrap px-3 py-2 transition-[top] duration-150 ease-out motion-reduce:transition-none",
              props.side === "right" ? "right-full mr-2" : "left-full ml-2",
            )}
            style={{ top: `${previewTop()}px`, transform: "translateY(-50%)" }}
          >
            <Show
              when={props.preview}
              fallback={
                <>
                  <div class="text-[12px] font-medium text-foreground">{shown().label}</div>
                  <Show when={shown().hint}>
                    <p class="mt-0.5 text-[11px] text-muted-foreground">{shown().hint}</p>
                  </Show>
                </>
              }
            >
              {props.preview?.({ item: shown() })}
            </Show>
          </div>
        )}
      </Show>
    </nav>
  )
}
