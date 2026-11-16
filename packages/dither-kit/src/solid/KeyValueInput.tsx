import { Index, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherInput from "./DitherInput"
import Icon from "./Icon"

/** Repeatable key/value rows — headers, metadata, query params. Every edit
 * emits the whole array (the parent owns the source of truth); empty rows
 * are the caller's to keep or prune. */
export interface KeyValueRow {
  key: string
  value: string
}

export type KeyValueInputProps = {
  /** @docs { key, value }[] (with onUpdateModelValue)
   * @default [] */
  modelValue?: KeyValueRow[]
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: KeyValueRow[]) => void
}

export default function KeyValueInput(raw: KeyValueInputProps) {
  const props = mergeProps({ disabled: false }, raw)

  function clone(): KeyValueRow[] {
    return (props.modelValue ?? []).map((r) => ({ ...r }))
  }

  function updateRow(index: number, field: keyof KeyValueRow, text: string) {
    const next = clone()
    if (!next[index]) return
    next[index][field] = text
    props.onUpdateModelValue?.(next)
  }

  function addRow() {
    props.onUpdateModelValue?.([...clone(), { key: "", value: "" }])
  }

  function removeRow(index: number) {
    props.onUpdateModelValue?.(clone().filter((_, i) => i !== index))
  }

  return (
    <div class={cn("grid gap-2", props.class)}>
      {/* By position, as the rows are keyed: a row's fields stay in the page
          (and keep their focus) while its text changes. */}
      <Index each={props.modelValue ?? []}>
        {(row, i) => (
          <div class={cn("flex items-center gap-2", props.disabled && "opacity-40")}>
            <DitherInput
              modelValue={row().key}
              placeholder="key"
              disabled={props.disabled}
              class="w-1/3 font-mono text-[12.5px]"
              onUpdateModelValue={(v) => updateRow(i, "key", v)}
            />
            <DitherInput
              modelValue={row().value}
              placeholder="value"
              disabled={props.disabled}
              class="flex-1"
              onUpdateModelValue={(v) => updateRow(i, "value", v)}
            />
            <button
              type="button"
              aria-label={`Remove row ${i + 1}`}
              disabled={props.disabled}
              class="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none motion-reduce:transition-none"
              onClick={() => removeRow(i)}
            >
              <Icon name="Close" size={13} />
            </button>
          </div>
        )}
      </Index>
      <button
        type="button"
        disabled={props.disabled}
        class="justify-self-start rounded border border-dashed border-border/70 px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
        onClick={addRow}
      >
        + Add row
      </button>
    </div>
  )
}
