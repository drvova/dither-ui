import { DitherText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherText tone="muted" size="sm">
        Default paragraph tone.
      </DitherText>
      <DitherText as="span" tone="faint" size="xs">
        Caption-weight aside.
      </DitherText>
      <DitherText as="h3" size="lg">
        A heading in the native scale.
      </DitherText>
    </>
  )
}

export const meta = defineExample({
  component: DitherText,
  title: "Text",
  studio: {
    group: "display",
    frame: { w: 300, h: 90 },
    controls: {
      as: { kind: "select", options: ["p", "span", "h3", "li"] },
      tone: { options: ["default", "muted", "faint"] },
      size: {},
    },
    slot: "The quick brown fox",
  },
})
