import { createSignal } from "solid-js"
import { DitherFileInput } from "@dither-kit"

export default function Example() {
  const [picked, setPicked] = createSignal<File[]>([])

  return <DitherFileInput modelValue={picked()} onUpdateModelValue={setPicked} multiple accept="image/*" />
}
