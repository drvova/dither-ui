import { DitherBlurText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherBlurText text="Blur into focus" by="words" />
}

export const meta = defineExample({
  component: DitherBlurText,
  title: "Blur text",
  studio: {
    group: "display",
    frame: { w: 340, h: 100 },
    controls: {
      text: {},
      by: {},
      stagger: { min: 0, max: 400, step: 10 },
      duration: { min: 100, max: 2000, step: 50 },
    },
  },
})
