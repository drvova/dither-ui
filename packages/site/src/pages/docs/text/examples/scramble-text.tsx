import { DitherScrambleText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherScrambleText text="Hover to scramble" />
}

export const meta = defineExample({
  component: DitherScrambleText,
  title: "Scramble text",
  studio: {
    group: "display",
    frame: { w: 340, h: 100 },
    controls: { text: {}, speed: { min: 0.2, max: 4, step: 0.1 } },
  },
})
