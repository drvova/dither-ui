import { DitherPercentText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex justify-center gap-4 text-[13px]">
      <DitherPercentText value={0.42} />
      <DitherPercentText class="text-muted-foreground" value={0.4235} decimals={1} />
      <DitherPercentText class="text-muted-foreground" value={1} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherPercentText,
  title: "Percent",
  studio: {
    group: "display",
    frame: { w: 200, h: 80 },
    controls: { value: { min: 0, max: 1, step: 0.01 }, decimals: { min: 0, max: 3 }, locale: {} },
  },
  states: [{ locale: "de-DE" }],
})
