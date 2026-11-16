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
    <div class="flex flex-col items-center gap-3">
      <DitherContextMenu items={items} onSelect={(label) => setLast(label)}>
        <div class="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground select-none">
          right-click me
        </div>
      </DitherContextMenu>
      <p class="text-[12px] text-muted-foreground">last action: {last()}</p>
    </div>
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
