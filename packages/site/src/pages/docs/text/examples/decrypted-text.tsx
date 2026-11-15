import { DitherDecryptedText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherDecryptedText text="ACCESS GRANTED" />
}

export const meta = defineExample({
  component: DitherDecryptedText,
  title: "Decrypted text",
  studio: {
    group: "display",
    frame: { w: 300, h: 100 },
    controls: { text: { demo: "DECRYPTED" }, speed: { min: 0.2, max: 4, step: 0.1 }, trigger: {} },
  },
})
