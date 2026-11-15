import { createSignal, Show } from "solid-js"
import { DitherSidebar, DitherSidebarGroup, DitherSidebarItem, DitherSidebarSub } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [collapsed, setCollapsed] = createSignal(false)
  const [active, setActive] = createSignal("Overview")
  const [components, setComponents] = createSignal(true)

  return (
    <div class="mx-auto flex h-80 max-w-md overflow-hidden rounded-lg border border-border/60">
      <DitherSidebar
        modelValue={collapsed()}
        onUpdateModelValue={setCollapsed}
        label="Demo sidebar"
        header={
          <div class="flex h-8 items-center gap-2 px-2.5">
            <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
            <Show when={!collapsed()}>
              <span class="text-[12px] tracking-tight">dither-ui</span>
            </Show>
          </div>
        }
      >
        {/* a group's label folds to a hairline on the rail, a badge to a dot */}
        <DitherSidebarGroup label="Platform">
          <DitherSidebarItem label="Overview" active={active() === "Overview"} onSelect={() => setActive("Overview")} />
          <DitherSidebarItem
            label="Charts"
            badge={12}
            active={active() === "Charts"}
            onSelect={() => setActive("Charts")}
          />
          <DitherSidebarItem
            label="Alerts"
            badge={3}
            color="red"
            active={active() === "Alerts"}
            onSelect={() => setActive("Alerts")}
          />
        </DitherSidebarGroup>
        <DitherSidebarGroup label="Library">
          <DitherSidebarSub modelValue={components()} onUpdateModelValue={setComponents} label="Components">
            <DitherSidebarItem label="Buttons" active={active() === "Buttons"} onSelect={() => setActive("Buttons")} />
            <DitherSidebarItem label="Forms" active={active() === "Forms"} onSelect={() => setActive("Forms")} />
          </DitherSidebarSub>
          <DitherSidebarItem label="Palette" active={active() === "Palette"} onSelect={() => setActive("Palette")} />
        </DitherSidebarGroup>
      </DitherSidebar>
      <div class="grid flex-1 place-items-center text-[12px] text-muted-foreground">{active()}</div>
      {/* variant: default, floating, inset or washed (dither gradient chrome);
           collapse: rail, hide or none; side: left or right;
           density: default or compact; toggle={false} keeps a permanent rail */}
    </div>
  )
}

export const meta = defineExample({
  component: DitherSidebar,
  title: "Sidebar",
  studio: {
    group: "structure",
    frame: { w: 300, h: 420 },
    controls: {
      label: { demo: "Project" },
      variant: { options: ["default", "floating", "inset", "washed"] },
      side: {},
      collapse: { options: ["rail", "hide", "none"] },
      density: {},
      toggle: {},
      washColor: {},
    },
  },
})
