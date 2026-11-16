import { createSignal } from "solid-js"
import { DitherGooeyMenu } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)
  const [pick, setPick] = createSignal("none")

  // one SVG goo filter fuses the circles while they travel
  return (
    <div class="grid min-h-64 place-items-end justify-center pb-4">
      <div class="text-center">
        <DitherGooeyMenu
          modelValue={open()}
          onUpdateModelValue={setOpen}
          direction="up"
          items={[
            { value: "add", label: "Add", color: "green" },
            { value: "export", label: "Export", color: "blue" },
            { value: "share", label: "Share", color: "purple" },
          ]}
          onSelect={setPick}
        />
        <p class="mt-3 text-[10px] text-muted-foreground">picked: {pick()}</p>
      </div>
    </div>
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
