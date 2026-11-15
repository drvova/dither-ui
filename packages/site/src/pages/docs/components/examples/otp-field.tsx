import { createSignal } from "solid-js"
import { DitherOtpField } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [code, setCode] = createSignal("")

  return <DitherOtpField modelValue={code()} onUpdateModelValue={setCode} />
}

export const meta = defineExample({
  component: DitherOtpField,
  title: "OTP field",
  studio: { group: "inputs", frame: { w: 320, h: 90 }, controls: { length: { min: 3, max: 8 } } },
})
