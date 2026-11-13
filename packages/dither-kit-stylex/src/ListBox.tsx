// Generated from dither-kit/solid/ListBox.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, createUniqueId, For, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  ul: {
    display: "grid",
    maxHeight: "14rem",
    width: "100%",
    overflow: "auto",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: { default: "var(--border)", ":focus-visible": "var(--ring)" },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.25rem",
    outlineStyle: "none",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  cursorPointer: {
    cursor: "pointer",
    borderRadius: "0.25rem",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "13px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  bgAccent15: {
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  bgAccent10: {
    backgroundColor: "color-mix(in oklab, var(--accent) 10%, transparent)",
    color: "var(--foreground)",
  },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})

export type ListBoxProps = {
  options?: string[]
  value?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  onSelect?: (value: string) => void
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
      aria-activedescendant={describedBy()}
      aria-disabled={props.disabled || undefined}
      tabindex={props.disabled ? -1 : 0}
      class={cn(styles.ul, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}
      onKeyDown={onKeydown}
    >
      <For each={props.options}>
        {(option, i) => (
          <li
            id={optionId(i())}
            role="option"
            aria-selected={option === props.value}
            class={cn([
              styles.cursorPointer,
              option === props.value
                ? styles.bgAccent15
                : i() === active()
                  ? styles.bgAccent10
                  : styles.textMutedForeground,
            ])}
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
