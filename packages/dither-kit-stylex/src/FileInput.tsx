// Generated from @dither-ui/kit/solid/FileInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, Index, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherButton from "./DitherButton"
import FileSizeText from "./FileSizeText"
import Icon from "./Icon"
import "@dither-ui/kit/solid/FileInput.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: {
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
  icon: { color: "var(--muted-foreground)" },
  text: { fontSize: "12.5px", color: "var(--muted-foreground)" },
  text2: { color: "var(--foreground)", textDecorationLine: "underline", textUnderlineOffset: "2px" },
  text3: { fontSize: "11px", color: "var(--muted-foreground)" },
  ul: { display: "grid", gap: "0.375rem" },
  li: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 50%, transparent)",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
  },
  icon2: { flexShrink: "0", color: "var(--muted-foreground)" },
  text4: {
    minWidth: "0px",
    flex: "1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "12.5px",
    color: "var(--foreground)",
  },
  fileSizeText: { flexShrink: "0", fontSize: "11px", color: "var(--muted-foreground)" },
  button: {
    borderRadius: "0.25rem",
    padding: "0.25rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
  },
  button2: { justifySelf: "flex-start" },
  grid: { display: "grid", gap: "0.5rem" },
  label: {
    display: "flex",
    cursor: "pointer",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    borderStyle: "dashed",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 30%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "1.5rem",
    textAlign: "center",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  borderAccent70: {
    borderColor: "color-mix(in oklab, var(--accent) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--accent) 10%, transparent)",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
})

/** File picker with a visible selection: a hidden native input (label
 * driven, so it's keyboard-reachable), the chosen files listed with sizes,
 * per-file remove, one clear-all. The model is `File[]` — read-only in the
 * DOM, owned by the parent through `modelValue`. */
export type FileInputProps = {
  modelValue?: File[]
  multiple?: boolean
  accept?: string
  disabled?: boolean
  buttonLabel?: string
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: File[]) => void
  onChange?: (value: File[]) => void
}

export default function FileInput(raw: FileInputProps) {
  const props = mergeProps({ multiple: false, disabled: false, buttonLabel: "Choose files" }, raw)

  let inputEl: HTMLInputElement | undefined
  const [dragOver, setDragOver] = createSignal(false)

  const files = createMemo(() => props.modelValue ?? [])

  function commit(next: File[]) {
    props.onUpdateModelValue?.(next)
    props.onChange?.(next)
  }

  function onInputFiles() {
    const list = inputEl?.files
    if (!list || list.length === 0) return
    const picked = Array.from(list)
    commit(props.multiple ? [...files(), ...picked] : [picked[0] as File])
    if (inputEl) inputEl.value = ""
  }

  function removeFile(index: number) {
    commit(files().filter((_, i) => i !== index))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (props.disabled) return
    const dropped = Array.from(e.dataTransfer?.files ?? [])
    if (dropped.length === 0) return
    commit(props.multiple ? [...files(), ...dropped] : [dropped[0] as File])
  }

  return (
    <div class={cn(styles.grid, props.xstyle, props.class)}>
      <label
        class={cn(
          [styles.label, "dk-file-drop"],
          dragOver() && styles.borderAccent70,
          props.disabled && styles.pointerEventsNone,
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(!props.disabled)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={(el) => (inputEl = el)}
          type="file"
          {...stylex.props(styles.input)}
          multiple={props.multiple}
          accept={props.accept}
          disabled={props.disabled}
          onChange={onInputFiles}
        />
        <Icon name="Plus" size={16} xstyle={styles.icon} />
        <span {...stylex.props(styles.text)}>
          Drop files here or <span {...stylex.props(styles.text2)}>{props.buttonLabel}</span>
        </span>
        <Show when={props.accept}>
          <span {...stylex.props(styles.text3)}>{props.accept}</span>
        </Show>
      </label>

      <Show when={files().length > 0}>
        <ul {...stylex.props(styles.ul)}>
          <Index each={files()}>
            {(file, i) => (
              <li {...stylex.props(styles.li)}>
                <Icon name="Check" size={12} xstyle={styles.icon2} />
                <span {...stylex.props(styles.text4)}>{file().name}</span>
                <FileSizeText bytes={file().size} xstyle={styles.fileSizeText} />
                <button
                  type="button"
                  aria-label={`Remove ${file().name}`}
                  disabled={props.disabled}
                  {...stylex.props(styles.button)}
                  onClick={() => removeFile(i)}
                >
                  <Icon name="Close" size={12} />
                </button>
              </li>
            )}
          </Index>
        </ul>
        <DitherButton variant="solid" disabled={props.disabled} xstyle={styles.button2} onClick={() => commit([])}>
          Clear all
        </DitherButton>
      </Show>
    </div>
  )
}
