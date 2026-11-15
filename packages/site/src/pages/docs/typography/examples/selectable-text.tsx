import { DitherSelectableText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherSelectableText>sk_live_51NqH2vKf9X</DitherSelectableText>
}

export const meta = defineExample({
  component: DitherSelectableText,
  title: "Selectable text",
  studio: {
    group: "display",
    frame: { w: 260, h: 80 },
    controls: { as: { kind: "select", options: ["span", "div"] } },
  },
})
