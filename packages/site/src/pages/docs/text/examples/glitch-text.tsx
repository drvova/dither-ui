import { DitherGlitchText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherGlitchText text="MALFUNCTION" />
}

export const meta = defineExample({
  component: DitherGlitchText,
  title: "Glitch text",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: { text: { demo: "GLITCH" }, speed: { min: 0, max: 4, step: 0.1 } },
  },
})
