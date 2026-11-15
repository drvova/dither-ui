import { createSignal } from "solid-js"
import { DitherMenubar } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const menus = [
    { label: "File", items: [{ label: "New" }, { label: "Open" }, { label: "Save" }] },
    { label: "Edit", items: [{ label: "Undo" }, { label: "Redo" }, { label: "Find" }] },
    { label: "View", items: [{ label: "Zoom in" }, { label: "Zoom out" }] },
  ]
  const [last, setLast] = createSignal("none")

  return (
    <>
      <DitherMenubar menus={menus} onSelect={(m, i) => setLast(`${m} → ${i}`)} />
      <p class="mt-3 text-[12px] text-muted-foreground">last action: {last()}</p>
    </>
  )
}

export const meta = defineExample({
  component: DitherMenubar,
  title: "Menubar",
  studio: {
    group: "overlays",
    frame: { w: 360, h: 100 },
    controls: { menus: { kind: "list", demo: ["File", "Edit", "View"] } },
  },
})
