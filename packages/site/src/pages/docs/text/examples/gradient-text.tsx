import { DitherGradientText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherGradientText colors={["#358ff3", "#7CFF67", "#358ff3"]}>Beautifully dithered</DitherGradientText>
}

export const meta = defineExample({
  component: DitherGradientText,
  title: "Gradient text",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: { colors: {}, speed: { min: 0, max: 4, step: 0.1 } },
    slot: "Gradient text",
  },
})
