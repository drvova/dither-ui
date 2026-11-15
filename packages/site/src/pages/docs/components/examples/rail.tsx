import { createSignal, For } from "solid-js"
import { DitherRail, DitherTooltip, DitherSidebarItem, DitherAvatar } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const items = [
    { label: "Home", color: "blue" },
    { label: "Library", color: "blue", badge: 3 },
    { label: "Exports", color: "purple" },
  ]
  const [active, setActive] = createSignal("Home")

  return (
    <>
      {/* the rail provides the sidebar's collapsed context:
           DitherSidebarItem folds its label with zero extra props */}
      <div class="flex h-72 overflow-hidden rounded-lg border">
        <DitherRail
          label="Primary"
          header={
            <div class="grid h-8 place-items-center">
              <span class="size-2.5 rounded-[2px] bg-foreground" />
            </div>
          }
          footer={<DitherAvatar name="Ada Byte" size={22} />}
        >
          {/* labels ride tooltips */}
          <For each={items}>
            {(i) => (
              <DitherTooltip text={i.label}>
                <DitherSidebarItem
                  label={i.label}
                  badge={i.badge}
                  color={i.color}
                  active={active() === i.label}
                  onSelect={() => setActive(i.label)}
                />
              </DitherTooltip>
            )}
          </For>
        </DitherRail>
        <div class="grid flex-1 place-items-center text-[12px]">{active()}</div>
      </div>
    </>
  )
}

export const meta = defineExample({
  component: DitherRail,
  title: "Rail",
  studio: { group: "structure", frame: { w: 220, h: 300 }, controls: { label: { demo: "Rail" }, side: {} } },
})
