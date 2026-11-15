import { DitherTextType } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherTextType texts={["Charts, dithered.", "Buttons, dithered.", "Everything, dithered."]} />
}

export const meta = defineExample({
  component: DitherTextType,
  title: "Text type",
  studio: {
    group: "display",
    frame: { w: 340, h: 100 },
    controls: {
      texts: { demo: ["Type this out.", "Then this."] },
      typingSpeed: { min: 10, max: 300, step: 5 },
      deletingSpeed: { min: 10, max: 300, step: 5 },
      pause: { min: 200, max: 5000, step: 100 },
      loop: {},
      cursor: {},
    },
  },
})
