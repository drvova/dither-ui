import { createSignal, For } from "solid-js"
import { DitherAvatar, DitherSidebar, DitherSidebarItem, DitherTooltip } from "@dither-kit"

const RAIL_ITEMS: { label: string; badge?: number; color: "blue" | "purple" | "green" | "red" }[] = [
  { label: "Charts", color: "blue" },
  { label: "Palettes", badge: 2, color: "purple" },
  { label: "Exports", color: "green" },
  { label: "Alerts", badge: 5, color: "red" },
]

export default function Example() {
  const [railOnly, setRailOnly] = createSignal("Charts")

  // the whole nav in 56px: tooltips carry the labels
  return (
    <div class="mx-auto flex h-80 max-w-md overflow-hidden rounded-lg border border-border/60">
      <DitherSidebar
        label="Rail nav"
        collapse="rail"
        modelValue={true}
        toggle={false}
        header={
          <div class="grid h-8 place-items-center">
            <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
          </div>
        }
        footer={
          <div class="grid place-items-center border-t border-border/60 pt-2">
            <DitherAvatar name="Ada Byte" size={22} />
          </div>
        }
      >
        <For each={RAIL_ITEMS}>
          {(i) => (
            <DitherTooltip text={i.label}>
              <DitherSidebarItem
                label={i.label}
                badge={i.badge}
                color={i.color}
                active={railOnly() === i.label}
                onSelect={() => setRailOnly(i.label)}
              />
            </DitherTooltip>
          )}
        </For>
      </DitherSidebar>
      <div class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">{railOnly()}</div>
    </div>
  )
}
