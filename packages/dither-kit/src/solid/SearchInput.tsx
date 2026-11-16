import { Show, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"
import Icon from "./Icon"

/** Search field: leading glyph, one-click clear (shown only when there is
 * something to clear), Escape empties the field. */
type Own = {
  /** @docs string (with onUpdateModelValue)
   * @default "" */
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** @docs () on clear/Escape */
  onClear?: () => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "disabled",
  "class",
  "onUpdateModelValue",
  "onClear",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type SearchInputProps = Own & Omit<DitherInputProps, keyof Own>

export default function SearchInput(raw: SearchInputProps) {
  const [props, rest] = splitProps(raw, OWN)

  const clear = () => {
    props.onUpdateModelValue?.("")
    props.onClear?.()
  }

  return (
    <div class="relative">
      <Icon
        name="Search"
        size={14}
        class="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
      />
      <DitherInput
        {...rest}
        type="search"
        modelValue={props.modelValue ?? ""}
        placeholder={props.placeholder ?? "Search…"}
        disabled={props.disabled}
        class={cn("pl-8 pr-8 [&::-webkit-search-cancel-button]:appearance-none", props.class)}
        onUpdateModelValue={(v) => props.onUpdateModelValue?.(v)}
        on:keydown={(e) => {
          if (e.key !== "Escape") return
          e.stopPropagation()
          clear()
        }}
      />
      <Show when={props.modelValue}>
        <button
          type="button"
          aria-label="Clear search"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          onClick={clear}
        >
          <Icon name="Close" size={13} />
        </button>
      </Show>
    </div>
  )
}
