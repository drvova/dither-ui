import { createMemo, createSignal, createUniqueId, For, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"

export type ListBoxProps = {
  options?: string[]
  value?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
  onSelect?: (value: string) => void
  /** The list's accessible name (passed on to the listbox). */
  "aria-label"?: string
  "aria-labelledby"?: string
}

/** Single-select listbox with roving focus (the WAI-ARIA keyboard contract):
 * arrows move, Home/End jump, Enter/Space select, the active option carries
 * `aria-activedescendant`. Options are plain strings; `value` is the picked
 * one. Calls `onSelect` on commit so click-vs-keyboard converge. */
export default function ListBox(raw: ListBoxProps) {
  const props = mergeProps({ options: [] as string[], disabled: false }, raw)

  const [active, setActive] = createSignal(-1)
  const rootId = `dk-listbox-${createUniqueId()}`

  function optionId(i: number): string {
    return `${rootId}-opt-${i}`
  }

  function choose(i: number) {
    const option = props.options[i]
    if (option === undefined) return
    setActive(i)
    props.onUpdateModelValue?.(option)
    props.onSelect?.(option)
  }

  function onKeydown(e: KeyboardEvent) {
    if (props.options.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive(Math.min(props.options.length - 1, active() + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive(Math.max(0, active() - 1))
    } else if (e.key === "Home") {
      e.preventDefault()
      setActive(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setActive(props.options.length - 1)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (active() >= 0) choose(active())
    } else {
      return
    }
  }

  const describedBy = createMemo(() => (active() >= 0 ? optionId(active()) : undefined))

  return (
    <ul
      role="listbox"
      aria-label={props["aria-label"]}
      aria-labelledby={props["aria-labelledby"]}
      aria-activedescendant={describedBy()}
      aria-disabled={props.disabled || undefined}
      tabindex={props.disabled ? -1 : 0}
      class={cn(
        "grid max-h-56 w-full overflow-auto rounded-md border border-border bg-background/60 p-1 outline-none focus-visible:border-ring",
        props.disabled && "pointer-events-none opacity-40",
        props.class,
      )}
      onKeyDown={onKeydown}
    >
      <For each={props.options}>
        {(option, i) => (
          <li
            id={optionId(i())}
            role="option"
            aria-selected={option === props.value}
            class={`cursor-pointer rounded px-2.5 py-1.5 text-[13px] transition-colors motion-reduce:transition-none ${
              option === props.value
                ? "bg-accent/15 text-foreground"
                : i() === active()
                  ? "bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
            }`}
            onMouseMove={() => setActive(i())}
            onClick={() => choose(i())}
          >
            {option}
          </li>
        )}
      </For>
    </ul>
  )
}
