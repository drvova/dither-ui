import { createSignal } from "solid-js"
import { DitherHoldAction } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [count, setCount] = createSignal(0)

  // a liquid fill with a dotted crest; release early to drain
  return (
    <div class="flex min-h-24 flex-col items-center justify-center gap-3">
      <div class="flex items-center gap-4">
        <DitherHoldAction color="orange" onComplete={() => setCount((n) => n + 1)}>
          Hold to purge cache
        </DitherHoldAction>
        <DitherHoldAction direction="horizontal" color="red" duration={900} onComplete={() => setCount((n) => n + 1)}>
          Hold to delete
        </DitherHoldAction>
      </div>
      <p class="font-mono text-[10px] text-muted-foreground">completed: {count()}</p>
    </div>
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
