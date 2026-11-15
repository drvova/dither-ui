import { createSignal } from "solid-js"
import { DitherHoldAction } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [completed, setCompleted] = createSignal(0)

  return (
    <>
      {/* a liquid fill with a dotted crest; release early to drain */}
      <DitherHoldAction
        duration={1200}
        direction="vertical"
        color="orange"
        onComplete={() => setCompleted(completed() + 1)}
      >
        Hold to purge cache
      </DitherHoldAction>
      <p class="text-[10px]">completed: {completed()}</p>
    </>
  )
}

export const meta = defineExample({
  component: DitherHoldAction,
  title: "Hold action",
  studio: {
    group: "display",
    frame: { w: 260, h: 110 },
    controls: {
      duration: { min: 400, max: 4000, step: 100 },
      direction: { options: ["vertical", "horizontal"] },
      color: { demo: "blue" },
      disabled: {},
    },
    slot: "Hold to confirm",
  },
})
