import { DitherMiddleEllipsis } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid gap-2 text-[12px]">
      <DitherMiddleEllipsis
        class="font-mono"
        text="packages/site/src/pages/docs/typography/TypographyDocs.tsx"
        head={14}
        tail={10}
      />
      <DitherMiddleEllipsis
        class="font-mono"
        text="sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
        head={10}
        tail={8}
      />
    </div>
  )
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
