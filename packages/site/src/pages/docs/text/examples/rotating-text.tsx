import { DitherRotatingText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex min-h-24 items-center justify-center text-3xl tracking-tight">
      <span>Built for&nbsp;</span>
      <DitherRotatingText class="text-foreground" texts={["Solid", "canvas", "the studio"]} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherRotatingText,
  title: "Rotating text",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: { texts: { demo: ["Solid", "canvas", "dither"] }, interval: { min: 400, max: 6000, step: 100 } },
  },
})
