import { createSignal } from "solid-js"
import { DitherSnapButton } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [count, setCount] = createSignal(0)

  // a 1:1 drag, rubber-band past the line, the border arms at the threshold; release fires snap, and
  // Enter or Space fires without the pull
  return (
    <div class="grid min-h-28 place-items-center gap-3">
      <DitherSnapButton threshold={64} axis="x" color="green" onSnap={() => setCount((n) => n + 1)}>
        Pull to deploy
      </DitherSnapButton>
      <p class="text-[10px] tabular-nums text-muted-foreground">deploys fired: {count()}</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSnapButton,
  title: "Snap button",
  studio: {
    group: "display",
    frame: { w: 260, h: 110 },
    controls: {
      threshold: { min: 24, max: 200, step: 4 },
      axis: { options: ["x", "y", "both"] },
      color: { demo: "blue" },
      disabled: {},
    },
    slot: "Pull to confirm",
  },
})
