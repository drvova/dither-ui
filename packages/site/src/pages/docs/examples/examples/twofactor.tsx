import { For } from "solid-js"
import { DitherButton, DitherGradient } from "@dither-kit"

export default function Example() {
  const codeInputs: HTMLInputElement[] = []
  function onCodeInput(i: number) {
    const el = codeInputs[i]
    if (el?.value && i < 5) codeInputs[i + 1]?.focus()
  }

  // a typed digit moves the focus to the next cell
  return (
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient
        class="-z-10"
        from="blue"
        to="transparent"
        direction="up"
        opacity={0.14}
        cell={4}
        renderMode="static"
      />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      <p class="mt-1.5 text-[11px] text-muted-foreground">Enter the code from your authenticator</p>
      <div class="mt-5 grid gap-2.5">
        <div class="flex justify-between gap-2" role="group" aria-label="Verification code">
          <For each={Array.from({ length: 6 }, (_, k) => k + 1)}>
            {(i) => (
              <input
                class="h-11 w-9 rounded-md border border-border bg-background/60 text-center text-[13px] text-foreground outline-none focus:border-ring"
                ref={(el) => (codeInputs[i - 1] = el)}
                type="text"
                maxlength="1"
                inputmode="numeric"
                name={`twofactor-digit-${i}`}
                autocomplete="off"
                aria-label={`Digit ${i}`}
                onInput={() => onCodeInput(i - 1)}
              />
            )}
          </For>
        </div>
        <DitherButton class="w-full py-2 text-[11px]" color="blue" variant="gradient">
          Verify
        </DitherButton>
      </div>
      {/* the card's foot, where the wash is densest: the full ink */}
      <p class="mt-4 text-center">
        <button class="text-[10px] text-foreground underline-offset-2 hover:underline" type="button">
          resend in 24s
        </button>
      </p>
    </div>
  )
}
