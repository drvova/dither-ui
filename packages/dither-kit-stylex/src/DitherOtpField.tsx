// Generated from dither-kit/solid/DitherOtpField.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createSignal, Index, mergeProps, on } from "solid-js"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", gap: "0.5rem" },
  input: {
    height: "2.75rem",
    width: "2.25rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: { default: "var(--border)", ":focus": "var(--ring)" },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
  },
})

export type DitherOtpFieldProps = {
  length?: number
  modelValue?: string
  onUpdateModelValue?: (value: string) => void
  onComplete?: (code: string) => void
}

export default function DitherOtpField(raw: DitherOtpFieldProps) {
  const props = mergeProps({ length: 6, modelValue: "" }, raw)

  const inputs: HTMLInputElement[] = []
  const [digits, setDigits] = createSignal<string[]>(
    Array.from({ length: props.length }, (_, i) => props.modelValue[i] ?? ""),
  )
  const setDigit = (i: number, v: string) => setDigits((d) => d.map((x, j) => (j === i ? v : x)))

  createEffect(
    on(
      () => props.modelValue,
      (v) => {
        // Skip our own emit echo — joining drops empty positions, so re-parsing
        // a partial fill would shift digits leftward.
        if (v === digits().join("")) return
        setDigits(Array.from({ length: props.length }, (_, i) => v[i] ?? ""))
      },
      { defer: true },
    ),
  )

  function commit() {
    const joined = digits().join("")
    props.onUpdateModelValue?.(joined)
    if (digits().every((d) => d !== "")) props.onComplete?.(joined)
  }

  function onInput(i: number, event: InputEvent & { currentTarget: HTMLInputElement }) {
    const el = event.currentTarget
    const v = el.value.replace(/\D/g, "").slice(-1)
    el.value = v
    setDigit(i, v)
    if (v && i < props.length - 1) inputs[i + 1]?.focus()
    commit()
  }

  function onKeydown(i: number, event: KeyboardEvent) {
    if (event.key === "Backspace" && !digits()[i] && i > 0) {
      event.preventDefault()
      setDigit(i - 1, "")
      inputs[i - 1]?.focus()
      commit()
    }
  }

  function onPaste(event: ClipboardEvent) {
    const pasted = (event.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, props.length)
    if (!pasted) return
    event.preventDefault()
    setDigits(Array.from({ length: props.length }, (_, i) => pasted[i] ?? ""))
    inputs[Math.min(pasted.length, props.length - 1)]?.focus()
    commit()
  }

  return (
    <div {...stylex.props(styles.row)} role="group" aria-label="Verification code">
      <Index each={Array.from({ length: props.length })}>
        {(_, i) => (
          <input
            ref={(el) => (inputs[i] = el)}
            type="text"
            maxlength="1"
            inputmode="numeric"
            pattern="[0-9]*"
            autocomplete="one-time-code"
            aria-label={`Digit ${i + 1}`}
            value={digits()[i] ?? ""}
            {...stylex.props(styles.input)}
            onInput={(e) => onInput(i, e)}
            onKeyDown={(e) => onKeydown(i, e)}
            onPaste={onPaste}
          />
        )}
      </Index>
    </div>
  )
}
