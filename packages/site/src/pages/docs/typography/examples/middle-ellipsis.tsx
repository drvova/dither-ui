import { DitherMiddleEllipsis } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherMiddleEllipsis text="packages/site/src/pages/docs/typography/TypographyDocs.tsx" />
}

export const meta = defineExample({
  component: DitherMiddleEllipsis,
  title: "Middle ellipsis",
  studio: {
    group: "display",
    frame: { w: 300, h: 80 },
    controls: { text: {}, head: { min: 2, max: 24 }, tail: { min: 2, max: 24 }, title: {} },
  },
})
