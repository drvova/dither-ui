import { createSignal, For } from "solid-js"
import {
  DitherAvatar,
  DitherBadge,
  DitherCanvas,
  DitherConsole,
  DitherGrid,
  DitherRail,
  DitherShell,
  DitherSidebarItem,
  DitherTooltip,
  Sparkline,
  type ConsoleLine,
} from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const items = ["Overview", "Deploys", "Data", "Alerts"]
  const [active, setActive] = createSignal("Overview")
  const stats = [
    ["Requests", "84k", "blue"],
    ["Errors", "0.2%", "red"],
    ["P95", "212ms", "green"],
  ] as const
  const trend = [12, 14, 13, 17, 16, 19, 22, 21, 24, 27, 26, 31]
  const log: ConsoleLine[] = [
    { text: "$ deploy --prod", at: "12:01" },
    { text: "building 34 routes…", at: "12:01" },
    { text: "build ok (4.2s)", at: "12:01", level: "success" },
  ]

  return (
    <DitherShell
      frame
      class="mx-auto h-[26rem] max-w-2xl"
      topbar={
        <div class="flex h-10 w-full items-center gap-2 px-3">
          <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
          <span class="text-[12px] tracking-tight text-foreground">acme ops</span>
          <span class="ml-auto rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </span>
          <DitherAvatar name="Ada Byte" size={22} />
        </div>
      }
      aside={
        <DitherRail
          label="Primary"
          footer={
            <div class="grid place-items-center border-t border-border/60 pt-2">
              <DitherAvatar name="Rei Toma" size={20} color="purple" />
            </div>
          }
        >
          <For each={items}>
            {(i) => (
              <DitherTooltip text={i}>
                <DitherSidebarItem
                  label={i}
                  color={i === "Alerts" ? "red" : "blue"}
                  badge={i === "Alerts" ? 2 : undefined}
                  active={active() === i}
                  onSelect={() => setActive(i)}
                />
              </DitherTooltip>
            )}
          </For>
        </DitherRail>
      }
      statusbar={
        <div class="flex h-7 w-full items-center gap-2 px-3 text-[10px] text-muted-foreground">
          <span class="size-1.5 rounded-full" style={{ background: "var(--swatch-green)" }} aria-hidden="true" />
          production: all systems normal
          <span class="ml-auto tabular-nums">{active()}</span>
        </div>
      }
    >
      <DitherCanvas pattern="dots" class="h-full p-3">
        <DitherGrid min={130}>
          <For each={stats}>
            {(s) => (
              <div class="rounded-md border border-border/60 bg-background/70 p-2.5">
                <div class="flex items-baseline justify-between">
                  <span class="text-[10px] text-muted-foreground">{s[0]}</span>
                  <span class="text-[13px] tabular-nums text-foreground">{s[1]}</span>
                </div>
                <Sparkline data={trend} color={s[2]} class="mt-1.5 h-6" />
              </div>
            )}
          </For>
        </DitherGrid>
        <DitherConsole
          lines={log}
          title="deploys"
          caret={false}
          class="mt-3 h-36"
          actions={
            <DitherBadge color="green" class="text-[9px]">
              live
            </DitherBadge>
          }
        />
      </DitherCanvas>
    </DitherShell>
  )
}

export const meta = defineExample({
  component: DitherShell,
  title: "Shell",
  studio: { group: "structure", frame: { w: 360, h: 260 }, controls: { frame: {} }, slot: "Content" },
})
