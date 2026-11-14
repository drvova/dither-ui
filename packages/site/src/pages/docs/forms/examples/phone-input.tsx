import { createSignal } from "solid-js"
import { DitherPhoneInput } from "@dither-kit"

export default function Example() {
  const [phone, setPhone] = createSignal("(415) 555-2671")

  return <DitherPhoneInput modelValue={phone()} onUpdateModelValue={setPhone} />
}
