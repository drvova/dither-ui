import { DitherSidebar, DitherSidebarGroup, DitherSidebarItem } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="flex h-64 overflow-hidden rounded-lg border">
      <DitherSidebar label="Project">
        <DitherSidebarGroup label="Workspace">
          <DitherSidebarItem label="Overview" active />
          <DitherSidebarItem label="Members" />
        </DitherSidebarGroup>
        <DitherSidebarGroup label="Library">
          <DitherSidebarItem label="Components" />
        </DitherSidebarGroup>
      </DitherSidebar>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSidebarGroup,
  title: "Sidebar group",
  studio: { group: "structure", frame: { w: 300, h: 260 }, controls: { label: {} } },
})
