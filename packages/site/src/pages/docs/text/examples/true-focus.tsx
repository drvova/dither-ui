import { DitherTrueFocus } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherTrueFocus text="True focus mode" />
}

export const meta = defineExample({
  component: DitherTrueFocus,
  title: "True focus",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: { text: {}, interval: { min: 300, max: 5000, step: 100 }, blur: { min: 0, max: 12, step: 0.5 } },
  },
})
