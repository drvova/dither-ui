// Generated from dither-kit/solid/IconPicker.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { ICONS } from "dither-kit/engine/icons.ts"
import { cn, type StyleProp } from "./lib"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: {
    minHeight: "2rem",
    width: "100%",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "transparent",
    paddingInline: "0.5rem",
    paddingBlock: "0.25rem",
    fontSize: "12.5px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
    transitionProperty: { default: null, "@media (prefers-reduced-motion: reduce)": "none" },
  },
  grid: {
    display: "grid",
    maxHeight: "12rem",
    gridTemplateColumns: {
      default: "repeat(6, minmax(0, 1fr))",
      "@media (width >= 40rem)": "repeat(8, minmax(0, 1fr))",
    },
    gap: "0.25rem",
    overflow: "auto",
  },
  input2: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  p: {
    gridColumn: "1 / -1",
    paddingInline: "0.25rem",
    paddingBlock: "0.5rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  grid2: {
    display: "grid",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.5rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  label: {
    display: "grid",
    aspectRatio: "1 / 1",
    cursor: "pointer",
    placeItems: "center",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  borderAccent70: {
    borderColor: "color-mix(in oklab, var(--accent) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  borderTransparent: {
    borderColor: {
      default: "transparent",
      ":hover": { default: null, "@media (hover: hover)": "var(--border)" },
    },
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
})

/** Icon picker over the kit's own glyph set: a filter field over the names
 * and a radio grid (native radio semantics — arrow keys navigate the whole
 * grid, one tab stop). Value = the icon name. */
export type IconPickerProps = {
  modelValue?: string
  placeholder?: string
  size?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}

const names = Object.keys(ICONS) as Array<keyof typeof ICONS> // Object.keys widens to string

export default function IconPicker(raw: IconPickerProps) {
  const props = mergeProps({ placeholder: "Filter icons…", size: 16, disabled: false }, raw)

  const [query, setQuery] = createSignal("")

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    return q === "" ? names : names.filter((n) => n.toLowerCase().includes(q))
  })

  return (
    <div class={cn(styles.grid2, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}>
      <input
        value={query()}
        type="search"
        placeholder={props.placeholder}
        disabled={props.disabled}
        {...stylex.props(styles.input)}
        onInput={(e) => setQuery(e.currentTarget.value)}
      />
      <div {...stylex.props(styles.grid)}>
        <For each={filtered()}>
          {(name) => (
            <label
              title={name}
              class={cn(styles.label, props.modelValue === name ? styles.borderAccent70 : styles.borderTransparent)}
            >
              <input
                {...stylex.props(styles.input2)}
                type="radio"
                name="dk-icon-picker"
                aria-label={name}
                value={name}
                checked={props.modelValue === name}
                disabled={props.disabled}
                onChange={() => props.onUpdateModelValue?.(name)}
              />
              <Icon name={name} size={props.size} />
            </label>
          )}
        </For>
        <Show when={filtered().length === 0}>
          <p {...stylex.props(styles.p)}>No icons match “{query()}”</p>
        </Show>
      </div>
    </div>
  )
}
