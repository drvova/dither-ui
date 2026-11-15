import { DitherShinyText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherShinyText>Shimmering headline</DitherShinyText>
}

export const meta = defineExample({
  component: DitherShinyText,
  title: "Shiny text",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: { speed: { min: 0, max: 4, step: 0.1 }, disabled: {} },
    slot: "Shiny text",
  },
})
