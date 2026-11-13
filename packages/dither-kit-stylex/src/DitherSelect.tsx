// Generated from dither-kit/solid/DitherSelect.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  onCleanup,
  onMount,
  Show,
  splitProps,
} from "solid-js"
import { cssColor } from "dither-kit/engine/palette.ts"
import type { PixelColor } from "dither-kit/engine/pixel.ts"
import { CONTROL, POPOVER } from "./control"
import { cn, type StyleProp } from "./lib"
import { useField } from "dither-kit/solid/runtime/field.ts"
import { Presence } from "dither-kit/solid/runtime/presence.tsx"
import "dither-kit/solid/DitherSelect.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: { width: "0.5rem", height: "0.5rem", flexShrink: "0" },
  frame: { position: "relative" },
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    textAlign: "left",
  },
  text2: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
  text3: {
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  rotate180: { rotate: "180deg" },
  layer: {
    position: "absolute",
    top: "100%",
    zIndex: "30",
    marginTop: "0.25rem",
    maxHeight: "16rem",
    width: "100%",
    overflow: "auto",
    padding: "0.25rem",
  },
  row: {
    display: "flex",
    minHeight: "2.25rem",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
  },
  bgBackground: { backgroundColor: "var(--background)", color: "var(--foreground)" },
  cursorDefault: { cursor: "default", opacity: "40%" },
  cursorPointer: {
    cursor: "pointer",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})

export type Option = { value: string; label: string; disabled?: boolean }

type Own = {
  options: Option[]
  modelValue: string
  onUpdateModelValue?: (value: string) => void
  placeholder?: string
  color?: PixelColor
  disabled?: boolean
  invalid?: boolean
  class?: string
  xstyle?: StyleProp
}
const OWN = [
  "options",
  "modelValue",
  "onUpdateModelValue",
  "placeholder",
  "color",
  "disabled",
  "invalid",
  "class",
  "xstyle",
] as const satisfies readonly (keyof Own)[]

/** `class` sits on the root; everything else a `<button>` takes (listeners,
 * ARIA) reaches the trigger. */
export type DitherSelectProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function DitherSelect(raw: DitherSelectProps) {
  const merged = mergeProps(
    { placeholder: "Select…", color: "blue" as PixelColor, disabled: false, invalid: false },
    raw,
  )
  const [props, rest] = splitProps(merged, OWN)
  const field = useField()
  let root: HTMLDivElement | undefined
  let trigger: HTMLButtonElement | undefined
  const [open, setOpen] = createSignal(false)
  const [highlighted, setHighlighted] = createSignal(-1)
  const idBase = `dk-select-${createUniqueId()}`
  const listId = `${idBase}-listbox`
  const selected = createMemo(() => props.options.find((o) => o.value === props.modelValue) ?? null)
  const marker = createMemo(() => cssColor(props.color))
  const invalid = createMemo(() => props.invalid || field?.invalid() || false)
  const optionId = (i: number) => `${idBase}-option-${i}`

  function openPanel() {
    if (props.disabled) return
    setOpen(true)
    const selectedIndex = props.options.findIndex((o) => o.value === props.modelValue && !o.disabled)
    setHighlighted(selectedIndex >= 0 ? selectedIndex : props.options.findIndex((o) => !o.disabled))
  }
  function close() {
    setOpen(false)
  }
  function pick(o: Option) {
    if (o.disabled) return
    props.onUpdateModelValue?.(o.value)
    close()
    queueMicrotask(() => trigger?.focus())
  }
  function move(dir: number) {
    const n = props.options.length
    if (!n) return
    let i = highlighted()
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!props.options[i].disabled) return void setHighlighted(i)
    }
  }
  function edge(toEnd: boolean) {
    const enabled = props.options.map((o, i) => ({ o, i })).filter(({ o }) => !o.disabled)
    setHighlighted(enabled[toEnd ? enabled.length - 1 : 0]?.i ?? -1)
  }
  function onKeydown(e: KeyboardEvent) {
    if (!open()) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        openPanel()
        if (e.key === "ArrowUp") edge(true)
      }
      return
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      move(e.key === "ArrowDown" ? 1 : -1)
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      edge(e.key === "End")
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const option = props.options[highlighted()]
      if (option) pick(option)
    } else if (e.key === "Escape" || e.key === "Tab") close()
  }
  function onOutside(e: PointerEvent) {
    if (open() && root && !root.contains(e.target as Node)) close()
  }
  onMount(() => {
    document.addEventListener("pointerdown", onOutside)
    onCleanup(() => document.removeEventListener("pointerdown", onOutside))
  })

  return (
    <div ref={(el) => (root = el)} class={cn(styles.frame, props.xstyle, props.class)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={listId}
        aria-activedescendant={open() && highlighted() >= 0 ? optionId(highlighted()) : undefined}
        aria-invalid={invalid() || undefined}
        aria-describedby={field?.describedBy()}
        id={field?.controlId()}
        disabled={props.disabled}
        style={invalid() ? { "border-color": cssColor("red") } : undefined}
        class={cn(CONTROL, styles.button)}
        {...rest}
        ref={(el) => (trigger = el)}
        // Its own listeners, beside any handed in with the rest.
        on:click={() => (open() ? close() : openPanel())}
        on:keydown={onKeydown}
      >
        <span class={cn(styles.text2, selected() ? styles.textForeground : styles.textMutedForeground)}>
          {selected()?.label ?? props.placeholder}
        </span>
        <span aria-hidden="true" class={cn(styles.text3, open() ? styles.rotate180 : null)}>
          ⌄
        </span>
      </button>
      <Presence when={open()} name="dk-popover">
        <div id={listId} role="listbox" class={cn(POPOVER, styles.layer)}>
          <For each={props.options}>
            {(o, i) => (
              <div
                id={optionId(i())}
                role="option"
                aria-selected={o.value === props.modelValue}
                aria-disabled={o.disabled || undefined}
                class={cn(
                  styles.row,
                  i() === highlighted() && !o.disabled ? styles.bgBackground : null,
                  o.disabled ? styles.cursorDefault : styles.cursorPointer,
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
      </Presence>
    </div>
  )
}
