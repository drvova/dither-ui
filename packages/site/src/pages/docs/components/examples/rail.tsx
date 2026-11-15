import { For } from "solid-js"
import { DitherAvatar, DitherRail, DitherSidebarItem, DitherTooltip } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="mx-auto flex h-72 max-w-sm overflow-hidden rounded-lg border border-border/60">
      {/* icons only: each item's name rides in a tooltip */}
      <DitherRail
        label="Demo rail"
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
        <For each={["Home", "Library", "Exports"]}>
          {(i) => (
            <DitherTooltip text={i}>
              <DitherSidebarItem label={i} active={i === "Home"} />
            </DitherTooltip>
          )}
        </For>
      </DitherRail>
      <div class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">Content</div>
    </div>
  )
}

export const meta = defineExample({
  component: DitherRail,
  title: "Rail",
  studio: { group: "structure", frame: { w: 220, h: 300 }, controls: { label: { demo: "Rail" }, side: {} } },
})
