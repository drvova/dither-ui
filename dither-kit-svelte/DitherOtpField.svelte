<script lang="ts">
  import { untrack } from "svelte"

  type Props = {
    length?: number
    value?: string
    oncomplete?: (code: string) => void
  }

  let { length = 6, value = $bindable(""), oncomplete }: Props = $props()

  let inputs = $state<(HTMLInputElement | null)[]>([])
  // `digits` is authoritative: it preserves gaps (["1", "", "3"]) that the
  // joined `value` cannot round-trip, so it is seeded once (untrack) and drives
  // the model one-way through `commit`.
  let digits = $state<string[]>(
    untrack(() => Array.from({ length }, (_, i) => value[i] ?? ""))
  )

  function commit() {
    const joined = digits.join("")
    value = joined
    if (digits.every((d) => d !== "")) oncomplete?.(joined)
  }

  function onInput(i: number, event: Event) {
    const el = event.target as HTMLInputElement
    const v = el.value.replace(/\D/g, "").slice(-1)
    el.value = v
    digits[i] = v
    if (v && i < length - 1) inputs[i + 1]?.focus()
    commit()
  }

  function onKeydown(i: number, event: KeyboardEvent) {
    if (event.key === "Backspace" && !digits[i] && i > 0) {
      event.preventDefault()
      digits[i - 1] = ""
      inputs[i - 1]?.focus()
      commit()
    }
  }

  function onPaste(event: ClipboardEvent) {
    const pasted = (event.clipboardData?.getData("text") ?? "")
      .replace(/\D/g, "")
      .slice(0, length)
    if (!pasted) return
    event.preventDefault()
    digits = Array.from({ length }, (_, i) => pasted[i] ?? "")
    inputs[Math.min(pasted.length, length - 1)]?.focus()
    commit()
  }
</script>

<div class="flex gap-2" role="group" aria-label="Verification code">
  {#each Array(length) as _, i (i)}
    <input
      bind:this={inputs[i]}
      type="text"
      maxlength="1"
      inputmode="numeric"
      pattern="[0-9]*"
      autocomplete="one-time-code"
      aria-label={`Digit ${i + 1}`}
      value={digits[i]}
      class="h-11 w-9 rounded-md border border-border bg-background/60 text-center font-mono text-[13px] text-foreground outline-none transition-colors focus:border-accent/60"
      oninput={(e) => onInput(i, e)}
      onkeydown={(e) => onKeydown(i, e)}
      onpaste={onPaste}
    />
  {/each}
</div>
