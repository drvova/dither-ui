import { DitherSplashCursor } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherSplashCursor class="grid h-40 w-full place-items-center rounded-lg border border-border/60 text-sm text-muted-foreground">
      Move your cursor here
    </DitherSplashCursor>
  )
}

export const meta = defineExample({
  component: DitherSplashCursor,
  title: "Splash cursor",
  studio: {
    group: "display",
    frame: { w: 240, h: 160 },
    controls: {
      color: { kind: "color", demo: "blue" },
      maxRadius: { min: 10, max: 200, step: 5 },
      duration: { min: 100, max: 2000, step: 50 },
    },
  },
})
