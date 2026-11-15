import { DitherVariableProximity } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherVariableProximity text="Move the cursor across this line" />
}

export const meta = defineExample({
  component: DitherVariableProximity,
  title: "Variable proximity",
  studio: {
    group: "display",
    frame: { w: 400, h: 120 },
    controls: {
      text: { demo: "Move the cursor across this line to feel the weight shift" },
      radius: { min: 20, max: 400, step: 10 },
    },
  },
})
