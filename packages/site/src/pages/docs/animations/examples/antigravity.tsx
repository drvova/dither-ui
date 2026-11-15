import { DitherAntigravity } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherAntigravity class="grid h-40 w-full place-items-center rounded-lg border text-sm text-muted-foreground">
      Antigravity
    </DitherAntigravity>
  )
}

export const meta = defineExample({
  component: DitherAntigravity,
  title: "Antigravity",
  studio: {
    group: "display",
    frame: { w: 280, h: 200 },
    controls: {
      color: { kind: "color", demo: "green" },
      count: { min: 4, max: 160, step: 4 },
      speed: { min: 0, max: 4, step: 0.1 },
    },
  },
})
