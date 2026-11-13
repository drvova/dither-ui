// Generated from dither-kit/solid/DitherCombobox.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, For, mergeProps, on, onMount, Show } from "solid-js"
import { cssColor } from "dither-kit/engine/palette.ts"
import type { PixelColor } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import type { Option } from "./DitherSelect"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: {
    width: "100%",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    paddingRight: "2rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "0.75rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    color: "var(--muted-foreground)",
  },
  layer2: {
    position: "absolute",
    top: "100%",
    zIndex: "30",
    marginTop: "0.25rem",
    width: "100%",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
  },
  box: {
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
  text: { width: "0.5rem", height: "0.5rem", flexShrink: "0" },
  frame: { position: "relative" },
  row: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "var(--radius)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
  },
  bgBackground: { backgroundColor: "var(--background)" },
  cursorDefault: { cursor: "default", opacity: "40%" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})

export type DitherComboboxProps = {
  options: Option[]
  modelValue: string
  onUpdateModelValue?: (value: string) => void
  placeholder?: string
  color?: PixelColor
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
}

export default function DitherCombobox(raw: DitherComboboxProps) {
  const props = mergeProps({ placeholder: "Select…", color: "blue" as PixelColor, disabled: false }, raw)

  const [open, setOpen] = createSignal(false)
  const [highlighted, setHighlighted] = createSignal(-1)

  const selected = createMemo(() => props.options.find((o) => o.value === props.modelValue) ?? null)
  const marker = createMemo(() => cssColor(props.color))

  const [query, setQuery] = createSignal(selected()?.label ?? "")
  onMount(() => {
    createEffect(
      on(
        () => props.modelValue,
        () => setQuery(selected()?.label ?? ""),
        { defer: true },
      ),
    )
  })

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    if (!q) return props.options
    return props.options.filter((o) => o.label.toLowerCase().includes(q))
  })

  function openPanel() {
    setOpen(true)
    const i = filtered().findIndex((o) => o.value === props.modelValue && !o.disabled)
    setHighlighted(i >= 0 ? i : filtered().findIndex((o) => !o.disabled))
  }

  function onInput(e: InputEvent & { currentTarget: HTMLInputElement }) {
    setQuery(e.currentTarget.value)
    setOpen(true)
    setHighlighted(filtered().findIndex((o) => !o.disabled))
  }

  function pick(o: Option) {
    if (o.disabled) return
    props.onUpdateModelValue?.(o.value)
    setQuery(o.label)
    setOpen(false)
  }

  /** Blur / Escape — snap the text back to the last valid value. */
  function revert() {
    setOpen(false)
    setQuery(selected()?.label ?? "")
  }

  function move(dir: number) {
    const list = filtered()
    const n = list.length
    let i = highlighted()
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!list[i].disabled) {
        setHighlighted(i)
        return
      }
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open()) openPanel()
      else move(e.key === "ArrowDown" ? 1 : -1)
    } else if (e.key === "Enter") {
      if (!open()) return
      e.preventDefault()
      const o = filtered()[highlighted()]
      if (o) pick(o)
    } else if (e.key === "Escape" && open()) {
      e.preventDefault()
      revert()
    }
  }

  return (
    <div class={cn(styles.frame, props.xstyle, props.class)}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open()}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={query()}
        {...stylex.props(styles.input)}
        onInput={onInput}
        onClick={() => open() || openPanel()}
        onKeyDown={onKeydown}
        onBlur={revert}
      />
      <span aria-hidden="true" {...stylex.props(styles.layer)}>
        ▾
      </span>
      <Show when={open()}>
        <div role="listbox" {...stylex.props(styles.layer2)}>
          <Show when={!filtered().length}>
            <div {...stylex.props(styles.box)}>no matches</div>
          </Show>
          <For each={filtered()}>
            {(o, i) => (
              <div
                role="option"
                aria-selected={o.value === props.modelValue}
                aria-disabled={o.disabled || undefined}
                class={cn(
                  styles.row,
                  i() === highlighted() && !o.disabled ? styles.bgBackground : null,
                  o.disabled
                    ? styles.cursorDefault
                    : o.value === props.modelValue || i() === highlighted()
                      ? styles.textForeground
                      : styles.textMutedForeground,
                )}
                onPointerEnter={() => !o.disabled && setHighlighted(i())}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
              >
                <span>{o.label}</span>
                <Show when={o.value === props.modelValue}>
                  <span
                    aria-hidden="true"
                    {...stylex.props(styles.text)}
                    style={{ "background-color": marker(), "image-rendering": "pixelated" }}
                  />
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
