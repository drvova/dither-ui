import { createSignal } from "solid-js"
import { DitherSidebar, DitherSidebarItem, DitherSidebarSub } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(true)

  return (
    <div class="flex h-72 overflow-hidden rounded-lg border">
      <DitherSidebar label="Project">
        <DitherSidebarSub modelValue={open()} onUpdateModelValue={setOpen} label="Projects">
          <DitherSidebarItem label="Prints" active />
          <DitherSidebarItem label="Zines" />
        </DitherSidebarSub>
      </DitherSidebar>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSidebarSub,
  title: "Sidebar sub",
  studio: { group: "structure", frame: { w: 300, h: 280 }, controls: { label: {} } },
})
