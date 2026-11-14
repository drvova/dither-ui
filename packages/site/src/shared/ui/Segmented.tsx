import { For, type JSX, Show, splitProps } from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { breakable } from "@/shared/lib/words"

// `labels` names an option where its value is not how a reader writes it
// (a styling system's proper name); unnamed options show their value.
type Own<T extends string | number> = {
  options: readonly T[]
  modelValue: T
  label?: string
  labels?: Partial<Record<string, string>>
  class?: string
  onUpdateModelValue?: (value: T) => void
}
export type SegmentedProps<T extends string | number> = Own<T> & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own<T>>

export default function Segmented<T extends string | number>(raw: SegmentedProps<T>) {
  const [props, rest] = splitProps(raw, ["options", "modelValue", "label", "labels", "class", "onUpdateModelValue"])
  return (
    <div {...rest} class={cn("flex items-center gap-2", props.class)}>
      <Show when={props.label}>
        {(label) => <span class="prop-name text-[11px] text-muted-foreground">{breakable(label())}</span>}
      </Show>
      <div class="flex flex-1 flex-wrap rounded-md border border-border bg-background/60 p-0.5">
        <For each={props.options}>
          {(opt) => (
            <button
              type="button"
              aria-pressed={opt === props.modelValue}
              class={cn(
                "min-h-6 rounded-[5px] px-2 text-[11px] leading-none transition-colors",
                opt === props.modelValue ? "ring-on" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => props.onUpdateModelValue?.(opt)}
            >
              {props.labels?.[String(opt)] ?? opt}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}
