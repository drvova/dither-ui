import { createMemo, createSignal, Index, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherButton from "./DitherButton"
import FileSizeText from "./FileSizeText"
import Icon from "./Icon"
import "./FileInput.css"

/** File picker with a visible selection: a hidden native input (label
 * driven, so it's keyboard-reachable), the chosen files listed with sizes,
 * per-file remove, one clear-all. The model is `File[]` — read-only in the
 * DOM, owned by the parent through `modelValue`. */
export type FileInputProps = {
  /** @docs File[] (with onUpdateModelValue)
   * @default [] */
  modelValue?: File[]
  multiple?: boolean
  /** @docs string (input accept) */
  accept?: string
  disabled?: boolean
  buttonLabel?: string
  class?: string
  onUpdateModelValue?: (value: File[]) => void
  /** @docs (File[]) after pick/remove */
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
    <div class={cn("grid gap-2", props.class)}>
      <label
        class={cn(
          "dk-file-drop flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border/70 bg-card/30 px-4 py-6 text-center transition-colors motion-reduce:transition-none",
          dragOver() && "border-accent/70 bg-accent/10",
          props.disabled && "pointer-events-none opacity-40",
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
          class="sr-only"
          multiple={props.multiple}
          accept={props.accept}
          disabled={props.disabled}
          onChange={onInputFiles}
        />
        <Icon name="Plus" size={16} class="text-muted-foreground" />
        <span class="text-[12.5px] text-muted-foreground">
          Drop files here or <span class="text-foreground underline underline-offset-2">{props.buttonLabel}</span>
        </span>
        <Show when={props.accept}>
          <span class="text-[11px] text-muted-foreground">{props.accept}</span>
        </Show>
      </label>

      <Show when={files().length > 0}>
        <ul class="grid gap-1.5">
          <Index each={files()}>
            {(file, i) => (
              <li class="flex items-center gap-2 rounded border border-border/60 bg-card/50 px-2.5 py-1.5">
                <Icon name="Check" size={12} class="shrink-0 text-muted-foreground" />
                <span class="min-w-0 flex-1 truncate text-[12.5px] text-foreground">{file().name}</span>
                <FileSizeText bytes={file().size} class="shrink-0 text-[11px] text-muted-foreground" />
                <button
                  type="button"
                  aria-label={`Remove ${file().name}`}
                  disabled={props.disabled}
                  class="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none motion-reduce:transition-none"
                  onClick={() => removeFile(i)}
                >
                  <Icon name="Close" size={12} />
                </button>
              </li>
            )}
          </Index>
        </ul>
        <DitherButton variant="solid" disabled={props.disabled} class="justify-self-start" onClick={() => commit([])}>
          Clear all
        </DitherButton>
      </Show>
    </div>
  )
}
