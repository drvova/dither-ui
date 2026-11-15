import { DitherIcon } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherIcon name="Check" />
}

export const meta = defineExample({
  component: DitherIcon,
  title: "Icon",
  studio: {
    group: "display",
    frame: { w: 160, h: 80 },
    controls: { name: {}, size: { min: 8, max: 48 }, strokeWidth: { min: 1, max: 3 } },
  },
})
