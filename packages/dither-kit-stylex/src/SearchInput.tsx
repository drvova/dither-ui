// Generated from @dither-ui/kit/solid/SearchInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { Show, splitProps } from "solid-js"
import { type StyleProp } from "./lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  icon: {
    pointerEvents: "none",
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "0.625rem",
    zIndex: "10",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    color: "var(--muted-foreground)",
  },
  button: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "0.375rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    borderRadius: "0.25rem",
    padding: "0.375rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  input: {
    paddingRight: "2rem",
    paddingLeft: "2rem",
    "::-webkit-search-cancel-button": { appearance: "none" },
  },
})

/** Search field: leading glyph, one-click clear (shown only when there is
 * something to clear), Escape empties the field. */
type Own = {
  /** @docs string (with onUpdateModelValue)
   * @default "" */
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  /** @docs () on clear/Escape */
  onClear?: () => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "disabled",
  "class",
  "xstyle",
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
    <div {...stylex.props(styles.frame)}>
      <Icon name="Search" size={14} xstyle={styles.icon} />
      <DitherInput
        {...rest}
        type="search"
        modelValue={props.modelValue ?? ""}
        placeholder={props.placeholder ?? "Search…"}
        disabled={props.disabled}
        xstyle={[styles.input, props.xstyle, props.class]}
        onUpdateModelValue={(v) => props.onUpdateModelValue?.(v)}
        on:keydown={(e) => {
          if (e.key !== "Escape") return
          e.stopPropagation()
          clear()
        }}
      />
      <Show when={props.modelValue}>
        <button type="button" aria-label="Clear search" {...stylex.props(styles.button)} onClick={clear}>
          <Icon name="Close" size={13} />
        </button>
      </Show>
    </div>
  )
}
