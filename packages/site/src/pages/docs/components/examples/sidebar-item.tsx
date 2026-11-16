import { createSignal } from "solid-js"
import { DitherSidebar, DitherSidebarItem } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [active, setActive] = createSignal("Dashboard")

  return (
    <div class="flex h-60 overflow-hidden rounded-lg border">
      <DitherSidebar label="Project">
        <DitherSidebarItem
          label="Dashboard"
          badge={3}
          active={active() === "Dashboard"}
          onSelect={() => setActive("Dashboard")}
        />
        <DitherSidebarItem label="Reports" active={active() === "Reports"} onSelect={() => setActive("Reports")} />
      </DitherSidebar>
      <div class="grid flex-1 place-items-center text-[12px]">{active()}</div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSidebarItem,
  title: "Sidebar item",
  studio: {
    group: "structure",
    frame: { w: 300, h: 240 },
    controls: { label: {}, active: { demo: true }, color: {}, badge: { kind: "text", demo: "3" } },
  },
})
