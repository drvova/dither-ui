import { createSignal, For, mergeProps, onMount } from "solid-js"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion, type PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type DockItem = { value: string; label: string; color?: PixelColor }

export type DockProps = {
  items: DockItem[]
  /** Peak scale over the pointer. */
  magnify?: number
  /** Falloff radius in px. */
  range?: number
  class?: string
  onSelect?: (value: string) => void
}

/** Hover-magnifying dock — items swell on a gaussian falloff around the
 * pointer and settle when it leaves. Reduced motion keeps the row still and
 * marks hover by color alone. */
export default function Dock(raw: DockProps) {
  const props = mergeProps({ magnify: 1.7, range: 80 }, raw)

  const [px, setPx] = createSignal<number | null>(null)
  let bar: HTMLDivElement | undefined
  // Read once, at mount (a server render has no media to ask).
  let still = false
  onMount(() => {
    still = pixelPrefersReducedMotion()
  })

  function track(e: PointerEvent) {
    if (still) return
    const r = bar?.getBoundingClientRect()
    if (r) setPx(e.clientX - r.left)
  }

  const scaleOf = (i: number) => {
    const at = px()
    if (at === null || !bar) return 1
    const buttons = bar.querySelectorAll("button")
    const b = buttons[i] as HTMLElement | undefined
    if (!b) return 1
    const center = b.offsetLeft + b.offsetWidth / 2
    const d = Math.abs(at - center)
    const g = Math.exp(-(d * d) / (2 * props.range * props.range))
    return 1 + (props.magnify - 1) * g
  }

  return (
    <div
      ref={(el) => (bar = el)}
      class={cn(
        "inline-flex items-end gap-1.5 rounded-xl border border-border/60 bg-background/60 px-2 py-1.5",
        props.class,
      )}
      role="group"
      aria-label="Dock"
      onPointerMove={track}
      onPointerLeave={() => setPx(null)}
    >
      <For each={props.items}>
        {(it, i) => (
          <button
            type="button"
            aria-label={it.label}
            title={it.label}
            class="grid size-9 origin-bottom place-items-center rounded-lg border border-border/60 bg-card/60 transition-transform duration-150 ease-out will-change-transform hover:bg-card motion-reduce:transition-none"
            style={{ transform: `scale(${scaleOf(i())})` }}
            onClick={() => props.onSelect?.(it.value)}
          >
            <span
              aria-hidden="true"
              class="size-2 rounded-[2px]"
              style={{ background: cssColor(it.color ?? "blue") }}
            />
          </button>
        )}
      </For>
    </div>
  )
}
