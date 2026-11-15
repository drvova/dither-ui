import { createSignal } from "solid-js"
import { DitherMenu } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const items = [{ label: "New" }, { label: "Duplicate" }, { divider: true }, { label: "Delete", danger: true }]
  const [last, setLast] = createSignal("none")

  return (
    <div class="flex flex-col items-center gap-3">
      <DitherMenu items={items} onSelect={(label) => setLast(label)}>
        Actions
      </DitherMenu>
      <p class="text-[12px] text-muted-foreground">last action: {last()}</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherMenu,
  title: "Menu",
  studio: {
    group: "overlays",
    frame: { w: 220, h: 180 },
    controls: { items: { kind: "list", demo: ["Copy", "Paste", "Delete"] } },
    slot: "Open menu",
  },
})
