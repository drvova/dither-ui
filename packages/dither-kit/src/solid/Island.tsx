import { type JSX, mergeProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type IslandProps = {
  /** Expanded state (with `onUpdateModelValue`).
   * @docs boolean (with onUpdateModelValue): expanded */
  modelValue?: boolean
  /** @docs string: compact row text */
  label?: string
  /** @docs PixelColor: status dot */
  color?: PixelColor
  /** Pulse the status dot while collapsed.
   * @docs boolean: pulse the dot while collapsed */
  live?: boolean
  class?: string
  onUpdateModelValue?: (value: boolean) => void
  /** The compact row's content, in place of `label`.
   * @docs JSX.Element (children: the detail panel) */
  compact?: JSX.Element
  /** @docs JSX.Element (children: the detail panel) */
  children?: JSX.Element
}

/** Morphing status pill — a compact row that stays visible while the detail
 * panel unfolds beneath it through the house 0fr -> 1fr grid trick. Escape
 * collapses; reduced motion snaps. */
export default function Island(raw: IslandProps) {
  const props = mergeProps({ modelValue: false, label: "Status", color: "green" as PixelColor, live: true }, raw)
  return (
    <div
      class={cn(
        "inline-block overflow-hidden rounded-2xl border border-border/60 bg-background/80 font-mono",
        props.class,
      )}
      onKeyDown={(e) => e.key === "Escape" && props.onUpdateModelValue?.(false)}
    >
      <button
        type="button"
        class="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-card/40"
        aria-expanded={props.modelValue}
        onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
      >
        <span
          aria-hidden="true"
          class={cn(
            "size-1.5 shrink-0 rounded-full motion-reduce:animate-none",
            props.live && !props.modelValue ? "animate-pulse" : "",
          )}
          style={{ background: cssColor(props.color) }}
        />
        {props.compact ?? props.label}
        <span
          aria-hidden="true"
          class={cn(
            "ml-auto pl-3 text-[10px] text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            props.modelValue ? "rotate-180" : "",
          )}
        >
          ▾
        </span>
      </button>
      <div
        class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
        style={{ "grid-template-rows": props.modelValue ? "1fr" : "0fr" }}
      >
        <div class="min-h-0 overflow-hidden" inert={!props.modelValue}>
          <div class="border-t border-border/40 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
            {props.children}
          </div>
        </div>
      </div>
    </div>
  )
}
