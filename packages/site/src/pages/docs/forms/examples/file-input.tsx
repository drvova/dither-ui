import { createSignal } from "solid-js"
import { DitherFileInput } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [picked, setPicked] = createSignal<File[]>([])

  return <DitherFileInput modelValue={picked()} onUpdateModelValue={setPicked} multiple accept="image/*" />
}

export const meta = defineExample({
  component: DitherFileInput,
  title: "File input",
  studio: {
    group: "inputs",
    frame: { w: 320, h: 170 },
    controls: { multiple: { demo: false }, accept: {}, buttonLabel: {}, disabled: {} },
  },
})
