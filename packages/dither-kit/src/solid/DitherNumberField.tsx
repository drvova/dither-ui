import { createEffect, createMemo, createSignal, mergeProps, on, onMount } from "solid-js"
import { CONTROL, CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"

export type DitherNumberFieldProps = {
  modelValue: number
  onUpdateModelValue?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** The input's accessible name. */
  label?: string
}

export default function DitherNumberField(raw: DitherNumberFieldProps) {
  const props = mergeProps({ step: 1, disabled: false }, raw)

  const [text, setText] = createSignal(String(props.modelValue))
  onMount(() => {
    createEffect(
      on(
        () => props.modelValue,
        (v) => setText(String(v)),
        { defer: true },
      ),
    )
  })

  const atMin = createMemo(() => props.min !== undefined && props.modelValue <= props.min)
  const atMax = createMemo(() => props.max !== undefined && props.modelValue >= props.max)

  function clampStep(raw: number): number {
    const base = props.min ?? 0
    let v = base + Math.round((raw - base) / props.step) * props.step
    if (props.min !== undefined) v = Math.max(props.min, v)
    if (props.max !== undefined) v = Math.min(props.max, v)
    return v
  }

  function set(raw: number) {
    const next = clampStep(raw)
    props.onUpdateModelValue?.(next)
    setText(String(next))
  }

  function onBlur() {
    const parsed = Number.parseFloat(text())
    if (Number.isNaN(parsed)) {
      setText(String(props.modelValue))
      return
    }
    set(parsed)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault()
      set(props.modelValue + props.step)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      set(props.modelValue - props.step)
    }
  }

  return (
    <div class="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease"
        disabled={props.disabled || atMin()}
        class={cn(
          CONTROL_BUTTON,
          "size-10 rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
        )}
        onClick={() => set(props.modelValue - props.step)}
      >
        -
      </button>
      <input
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
        type="text"
        inputmode="numeric"
        role="spinbutton"
        aria-label={props.label}
        aria-valuenow={props.modelValue}
        aria-valuemin={props.min}
        aria-valuemax={props.max}
        disabled={props.disabled}
        class={cn(CONTROL, "w-20 text-center tabular-nums")}
        onBlur={onBlur}
        onKeyDown={onKeydown}
      />
      <button
        type="button"
        aria-label="Increase"
        disabled={props.disabled || atMax()}
        class={cn(
          CONTROL_BUTTON,
          "size-10 rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground",
        )}
        onClick={() => set(props.modelValue + props.step)}
      >
        +
      </button>
    </div>
  )
}
