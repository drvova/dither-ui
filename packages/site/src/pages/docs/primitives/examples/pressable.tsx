import { DitherPressable } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherPressable>Press me</DitherPressable>
}

export const meta = defineExample({
  component: DitherPressable,
  title: "Pressable",
  studio: {
    group: "inputs",
    frame: { w: 200, h: 80 },
    controls: { variant: { options: ["solid", "outline", "ghost", "plain"] }, type: {}, disabled: {} },
  },
})
