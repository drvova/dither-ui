import { createSignal } from "solid-js"
import { DitherGooeyMenu } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [expanded, setExpanded] = createSignal(false)
  const [picked, setPicked] = createSignal("none")

  return (
    <>
      {/* one SVG goo filter fuses the circles while they travel */}
      <DitherGooeyMenu
        modelValue={expanded()}
        onUpdateModelValue={setExpanded}
        items={[
          { value: "add", label: "Add", color: "green" },
          { value: "export", label: "Export", color: "blue" },
          { value: "share", label: "Share", color: "purple" },
        ]}
        direction="up"
        onSelect={(value) => setPicked(value)}
      />
      <p class="mt-3 text-[10px]">picked: {picked()}</p>
    </>
  )
}

export const meta = defineExample({
  component: DitherGooeyMenu,
  title: "Gooey menu",
  studio: {
    group: "display",
    frame: { w: 220, h: 280 },
    controls: {
      items: { kind: "list", demo: ["Add", "Export", "Share"] },
      direction: { options: ["up", "down", "left", "right"] },
      spacing: { min: 32, max: 100, step: 4 },
    },
  },
})
