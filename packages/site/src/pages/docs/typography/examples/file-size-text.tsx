import { DitherFileSizeText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherFileSizeText bytes={1536} />
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
