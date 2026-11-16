import { createUniqueId, For, type JSX, mergeProps, Show } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./BouncyAccordion.css"

export type BouncyItem = {
  value: string
  label: string
  hint?: string
  /** Text glyph for the leading icon box; omit for a dithered color dot. */
  icon?: string
  color?: PixelColor
  content?: string
}

export type BouncyAccordionProps = {
  /** @docs { value, label, hint?, icon?, color?, content? }[]
   * @default required */
  items: BouncyItem[]
  /** @docs string (with onUpdateModelValue): open item, "" closes all */
  modelValue?: string
  /** @docs PixelColor: icon fallback tint */
  color?: PixelColor
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** A panel's content by its item's `value` (a slot per item);
   * an item without one shows its `content`.
   * @docs Record<value, JSX.Element>: rich panel content (else item.content) */
  slots?: Record<string, JSX.Element>
}

/** Single-open accordion on a weighted spring — a panel opens on the spring
 * (its content rising past its mark and settling), closes briskly, all in
 * CSS (`BouncyAccordion.css`). Icon rows lead each header; reduced motion
 * swaps every glide for an instant reveal. */
export default function BouncyAccordion(raw: BouncyAccordionProps) {
  const props = mergeProps({ modelValue: "", color: "blue" as PixelColor }, raw)

  const id = `dk-bouncy-${createUniqueId()}`
  const isOpen = (v: string) => props.modelValue === v
  const toggle = (v: string) => props.onUpdateModelValue?.(isOpen(v) ? "" : v)

  return (
    <div class={cn(props.class)}>
      <For each={props.items}>
        {(item, i) => (
          <div class="border-t border-border/40 first:border-t-0">
            <button
              type="button"
              aria-expanded={isOpen(item.value)}
              aria-controls={`${id}-${i()}`}
              class="flex w-full items-center gap-3 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => toggle(item.value)}
            >
              <span
                aria-hidden="true"
                class="grid size-8 shrink-0 place-items-center rounded-md border border-border/60 bg-card/60 text-[13px]"
                style={{ color: cssColor(item.color ?? props.color) }}
              >
                <Show
                  when={item.icon}
                  fallback={
                    <span class="size-2 rounded-[2px]" style={{ background: cssColor(item.color ?? props.color) }} />
                  }
                >
                  {item.icon}
                </Show>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate">{item.label}</span>
                <Show when={item.hint}>
                  <span class="block truncate text-[11px] text-muted-foreground">{item.hint}</span>
                </Show>
              </span>
              <span
                aria-hidden="true"
                class={cn(
                  "text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                  isOpen(item.value) ? "rotate-90" : "",
                )}
              >
                ›
              </span>
            </button>
            <div
              id={`${id}-${i()}`}
              inert={!isOpen(item.value)}
              class="dk-bouncy-panel"
              data-open={isOpen(item.value) ? "" : undefined}
            >
              <div class="dk-bouncy-content pt-1 pb-3 pl-11 text-[13px] leading-relaxed text-muted-foreground">
                {props.slots?.[item.value] ?? item.content}
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
