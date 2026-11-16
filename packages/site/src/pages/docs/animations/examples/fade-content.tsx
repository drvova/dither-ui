import { DitherFadeContent } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherFadeContent blur={true}>
      <div class="grid h-28 w-52 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground">
        Fades in on view
      </div>
    </DitherFadeContent>
  )
}

export const meta = defineExample({
  component: DitherFadeContent,
  title: "Fade content",
  studio: {
    group: "display",
    frame: { w: 260, h: 120 },
    controls: {
      duration: { min: 100, max: 3000, step: 50 },
      delay: { min: 0, max: 2000, step: 50 },
      blur: { demo: false },
    },
    slot: "Fade content",
  },
})
