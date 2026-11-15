import { DitherScope } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherScope label="ch1" />
}

export const meta = defineExample({
  component: DitherScope,
  title: "Scope",
  studio: {
    group: "display",
    frame: { w: 300, h: 240 },
    controls: {
      signal: { kind: "select", options: ["sine", "square", "triangle", "saw"] },
      cycles: { min: 0.5, max: 8, step: 0.5 },
      speed: { min: 0, max: 4, step: 0.1 },
      gain: { min: 0.1, max: 1, step: 0.05 },
      afterglow: { min: 0, max: 1, step: 0.05 },
      label: {},
      color: {},
    },
  },
})
