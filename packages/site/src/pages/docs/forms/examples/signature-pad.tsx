import { DitherSignaturePad } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherSignaturePad />
}

export const meta = defineExample({
  component: DitherSignaturePad,
  title: "Signature pad",
  studio: {
    group: "inputs",
    frame: { w: 440, h: 230 },
    controls: { width: { min: 200, max: 800 }, height: { min: 80, max: 400 }, disabled: {} },
  },
})
