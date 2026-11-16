import { DitherPressable } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex flex-wrap items-center justify-center gap-3">
      <DitherPressable>Get started</DitherPressable>
      <DitherPressable variant="outline">Compare plans</DitherPressable>
      <DitherPressable variant="ghost">Later</DitherPressable>
      <DitherPressable disabled>Sold out</DitherPressable>
      <DitherPressable class="text-[12px] underline underline-offset-4" variant="plain">
        Bare base, your look
      </DitherPressable>
    </div>
  )
}

export const meta = defineExample({
  component: DitherPressable,
  title: "Pressable",
  studio: {
    group: "inputs",
    frame: { w: 200, h: 80 },
    slot: "Press me",
    controls: { variant: { options: ["solid", "outline", "ghost", "plain"] }, type: {}, disabled: {} },
  },
})
