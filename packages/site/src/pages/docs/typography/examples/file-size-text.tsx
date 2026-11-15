import { DitherFileSizeText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid justify-center gap-1 text-[13px]">
      <span>
        <DitherFileSizeText bytes={512} /> (raw)
      </span>
      <span>
        <DitherFileSizeText bytes={1536} /> (a small file)
      </span>
      <span class="text-muted-foreground">
        <DitherFileSizeText bytes={8589934592} /> (a game update)
      </span>
    </div>
  )
}

export const meta = defineExample({
  component: DitherFileSizeText,
  title: "File size",
  studio: {
    group: "display",
    frame: { w: 220, h: 80 },
    controls: { bytes: { min: 0, max: 1099511627776 }, decimals: { min: 0, max: 3 }, locale: {} },
  },
  states: [{ locale: "de-DE" }],
})
