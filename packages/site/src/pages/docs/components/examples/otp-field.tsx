import { createSignal, Show } from "solid-js"
import { cssColor, DitherOtpField } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [otp, setOtp] = createSignal("")
  const [complete, setComplete] = createSignal(false)

  return (
    <div class="mx-auto grid max-w-sm justify-items-center gap-3">
      <DitherOtpField modelValue={otp()} onUpdateModelValue={setOtp} length={6} onComplete={() => setComplete(true)} />
      <Show when={complete()}>
        <p class="text-[11px]" style={{ color: cssColor("green") }}>
          complete!
        </p>
      </Show>
    </div>
  )
}

export const meta = defineExample({
  component: DitherOtpField,
  title: "OTP field",
  studio: { group: "inputs", frame: { w: 320, h: 90 }, controls: { length: { min: 3, max: 8 } } },
})
