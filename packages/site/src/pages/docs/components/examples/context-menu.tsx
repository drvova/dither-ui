import { createSignal } from "solid-js"
import { DitherContextMenu } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const items = [
    { label: "Cut" },
    { label: "Copy" },
    { label: "Paste" },
    { divider: true },
    { label: "Delete", danger: true },
  ]
  const [last, setLast] = createSignal("none")

  return (
    <>
      <DitherContextMenu items={items} onSelect={(label) => setLast(label)}>
        <div class="rounded-lg border border-dashed border-border p-10">right-click me</div>
      </DitherContextMenu>
      <p class="mt-3 text-[12px] text-muted-foreground">last action: {last()}</p>
    </>
  )
}

export const meta = defineExample({
  component: DitherContextMenu,
  title: "Context menu",
  studio: {
    group: "overlays",
    frame: { w: 260, h: 140 },
    controls: { items: { kind: "list", demo: ["Copy", "Paste", "Delete"] } },
    slot: "Right-click this area",
  },
})
