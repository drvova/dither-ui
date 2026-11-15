import { DitherSelectableText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid gap-2 text-center text-[13px]">
      <span class="text-muted-foreground">Click the key and it all selects:</span>
      <DitherSelectableText class="font-mono">sk_live_51NqH2vKf9X</DitherSelectableText>
    </div>
  )
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
