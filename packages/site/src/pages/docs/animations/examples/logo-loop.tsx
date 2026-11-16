import { DitherLogoLoop } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherLogoLoop items={["DITHER", "BAYER", "CANVAS", "SOLID", "PIXELS"]} />
}

export const meta = defineExample({
  component: DitherLogoLoop,
  title: "Logo loop",
  studio: {
    group: "display",
    frame: { w: 360, h: 70 },
    controls: { items: {}, speed: { min: 3, max: 60, step: 1 }, gap: { min: 8, max: 160, step: 4 } },
  },
})
