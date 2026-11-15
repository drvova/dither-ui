import { DitherClickSpark } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherClickSpark
      color="#7CFF67"
      class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground"
    >
      Click anywhere here
    </DitherClickSpark>
  )
}

export const meta = defineExample({
  component: DitherClickSpark,
  title: "Click spark",
  studio: {
    group: "display",
    frame: { w: 240, h: 140 },
    controls: {
      color: { kind: "color", demo: "blue" },
      count: { min: 3, max: 20, step: 1 },
      size: { min: 4, max: 60, step: 2 },
      duration: { min: 100, max: 1500, step: 20 },
    },
  },
})
