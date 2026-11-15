import { DitherAnimatedContent } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherAnimatedContent distance={40} direction="vertical">
      <div class="grid h-28 w-52 place-items-center rounded-lg border bg-card text-sm text-muted-foreground">
        Slides up on view
      </div>
    </DitherAnimatedContent>
  )
}

export const meta = defineExample({
  component: DitherAnimatedContent,
  title: "Animated content",
  studio: {
    group: "display",
    frame: { w: 260, h: 120 },
    controls: {
      distance: { kind: "number", min: 0, max: 200, step: 5 },
      direction: { options: ["vertical", "horizontal"] },
      reverse: {},
      duration: { min: 100, max: 3000, step: 50 },
      delay: { min: 0, max: 2000, step: 50 },
    },
    slot: "Animated content",
  },
})
