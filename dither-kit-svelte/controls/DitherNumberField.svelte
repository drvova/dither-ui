<script lang="ts">
  import { CONTROL, CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"

  type Props = {
    value?: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
  }

  let {
    value = $bindable(0),
    min,
    max,
    step = 1,
    disabled = false,
  }: Props = $props()

  // `typed` holds the in-progress buffer; when null the field shows the model
  // value. This derives the Vue `text` ref + its `watch(modelValue)` without an
  // `$effect`: any external value change is reflected because `typed` is null
  // outside active editing, and commits reset it to null.
  let typed = $state<string | null>(null)
  const text = $derived(typed ?? String(value))

  const atMin = $derived(min !== undefined && value <= min)
  const atMax = $derived(max !== undefined && value >= max)

  function clampStep(raw: number): number {
    const base = min ?? 0
    let v = base + Math.round((raw - base) / step) * step
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    return v
  }

  function set(raw: number) {
    value = clampStep(raw)
    typed = null
  }

  function onBlur() {
    const parsed = Number.parseFloat(text)
    if (Number.isNaN(parsed)) {
      typed = null
      return
    }
    set(parsed)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault()
      set(value + step)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      set(value - step)
    }
  }
</script>

<div class="flex items-center gap-2">
  <button
    type="button"
    aria-label="Decrease"
    disabled={disabled || atMin}
    class={cn(
      CONTROL_BUTTON,
      "size-10 rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
    )}
    onclick={() => set(value - step)}
  >
    -
  </button>
  <input
    value={text}
    type="text"
    inputmode="numeric"
    role="spinbutton"
    aria-valuenow={value}
    aria-valuemin={min}
    aria-valuemax={max}
    {disabled}
    class={cn(CONTROL, "w-20 text-center tabular-nums")}
    oninput={(e) => (typed = e.currentTarget.value)}
    onblur={onBlur}
    onkeydown={onKeydown}
  />
  <button
    type="button"
    aria-label="Increase"
    disabled={disabled || atMax}
    class={cn(
      CONTROL_BUTTON,
      "size-10 rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
    )}
    onclick={() => set(value + step)}
  >
    +
  </button>
</div>
