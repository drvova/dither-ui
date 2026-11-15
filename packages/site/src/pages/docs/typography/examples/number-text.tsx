import { DitherNumberText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid justify-center gap-1 text-[13px]">
      <DitherNumberText value={1234567.5} decimals={2} />
      <DitherNumberText class="text-muted-foreground" value={1234567.5} locale="de-DE" />
      <DitherNumberText class="text-muted-foreground" value={98.76} locale="ja-JP" grouping={false} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherNumberText,
  title: "Number",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { value: {}, decimals: { min: 0, max: 4 }, locale: {}, grouping: {} },
  },
  states: [{ locale: "de-DE" }],
})
