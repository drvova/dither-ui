import { DitherVariableProximity } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex min-h-24 max-w-md items-center justify-center text-center text-xl leading-relaxed tracking-tight">
      <DitherVariableProximity text="Move the cursor across this line to feel the weight shift" />
    </div>
  )
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
