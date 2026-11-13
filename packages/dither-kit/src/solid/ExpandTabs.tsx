import { For, mergeProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type ExpandTab = { value: string; label: string; color?: PixelColor }

/** Icon bar where only the active tab unfolds its label — the rest stay
 * square glyphs. The label slides through a 0fr -> 1fr column, the house
 * grid trick, stilled under reduced motion. */
export type ExpandTabsProps = {
  tabs: ExpandTab[]
  modelValue: string
  color?: PixelColor
  class?: string
  onUpdateModelValue?: (value: string) => void
}

export default function ExpandTabs(raw: ExpandTabsProps) {
  const props = mergeProps({ color: "blue" as PixelColor }, raw)

  const hue = (t: ExpandTab) => cssColor(t.color ?? props.color)

  return (
    <div
      class={cn("inline-flex gap-1 rounded-lg border border-border/60 bg-background/40 p-1", props.class)}
      role="tablist"
    >
      <For each={props.tabs}>
        {(t) => (
          <button
            type="button"
            role="tab"
            aria-selected={props.modelValue === t.value}
            class={cn(
              "flex h-8 items-center gap-0 rounded-md px-2.5 font-mono text-[12px] transition-colors",
              props.modelValue === t.value
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
            onClick={() => props.onUpdateModelValue?.(t.value)}
          >
            <span
              aria-hidden="true"
              class="size-1.5 shrink-0 rounded-[1px]"
              style={{
                background: props.modelValue === t.value ? hue(t) : "currentColor",
                opacity: props.modelValue === t.value ? 1 : 0.7,
              }}
            />
            <span
              class="grid transition-[grid-template-columns] duration-200 motion-reduce:transition-none"
              style={{ "grid-template-columns": props.modelValue === t.value ? "1fr" : "0fr" }}
            >
              <span
                class="min-w-0 overflow-hidden whitespace-nowrap"
                classList={{ "pl-2": props.modelValue === t.value }}
              >
                {t.label}
              </span>
            </span>
          </button>
        )}
      </For>
    </div>
  )
}
