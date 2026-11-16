import { DitherBox } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherBox class="rounded-lg border border-border/60 bg-card/40 p-5 text-center" as="section">
      <span class="text-[13px] text-foreground/90">Content lands in a typed container.</span>
    </DitherBox>
  )
}

export const meta = defineExample({
  component: DitherBox,
  title: "Box",
  studio: {
    group: "structure",
    frame: { w: 260, h: 110 },
    slot: "Box content",
    controls: { as: { demo: "div", kind: "select", options: ["div", "section", "span", "article"] } },
  },
})
