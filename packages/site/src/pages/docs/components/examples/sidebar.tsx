import { createSignal, Show } from "solid-js"
import { DitherSidebar, DitherSidebarGroup, DitherSidebarItem, DitherSidebarSub } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [collapsed, setCollapsed] = createSignal(false)
  const [active, setActive] = createSignal("Overview")
  const [components, setComponents] = createSignal(true)

  return (
    <>
      <div class="flex h-80 overflow-hidden rounded-lg border">
        <DitherSidebar
          modelValue={collapsed()}
          onUpdateModelValue={setCollapsed}
          variant="default"
          collapse="rail"
          header={
            <div class="flex h-8 items-center gap-2 px-2.5 text-[12px]">
              <span class="size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <Show when={!collapsed()}>
                <span>dither-ui</span>
              </Show>
            </div>
          }
        >
          {/* a group's label folds to a hairline on the rail, a badge to a dot */}
          <DitherSidebarGroup label="Platform">
            <DitherSidebarItem
              label="Overview"
              active={active() === "Overview"}
              onSelect={() => setActive("Overview")}
            />
            <DitherSidebarItem
              label="Charts"
              badge={12}
              active={active() === "Charts"}
              onSelect={() => setActive("Charts")}
            />
          </DitherSidebarGroup>

          <DitherSidebarGroup label="Library">
            <DitherSidebarSub modelValue={components()} onUpdateModelValue={setComponents} label="Components">
              <DitherSidebarItem
                label="Buttons"
                active={active() === "Buttons"}
                onSelect={() => setActive("Buttons")}
              />
              <DitherSidebarItem label="Forms" active={active() === "Forms"} onSelect={() => setActive("Forms")} />
            </DitherSidebarSub>
          </DitherSidebarGroup>
        </DitherSidebar>
        <div class="grid flex-1 place-items-center text-[12px]">{active()}</div>
      </div>

      {/* variant: default, floating, inset or washed (dither gradient chrome);
           collapse: rail, hide or none; side: left or right;
           density: default or compact; toggle={false} keeps a permanent rail */}
    </>
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
