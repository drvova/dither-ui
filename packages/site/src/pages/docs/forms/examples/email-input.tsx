import { createSignal } from "solid-js"
import { DitherEmailInput } from "@dither-kit"

export default function Example() {
  const [email, setEmail] = createSignal("")

  return <DitherEmailInput modelValue={email()} onUpdateModelValue={setEmail} />
}
