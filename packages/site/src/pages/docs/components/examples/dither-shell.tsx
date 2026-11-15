import { createSignal, For } from "solid-js"
import {
  DitherShell,
  DitherAvatar,
  DitherRail,
  DitherTooltip,
  DitherSidebarItem,
  DitherCanvas,
  DitherGrid,
  Sparkline,
  DitherConsole,
  type ConsoleLine,
} from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const items = ["Overview", "Deploys", "Data", "Alerts"]
  const [active, setActive] = createSignal("Overview")
  const stats = [
    { label: "Requests", value: "84k", color: "blue" as const, trend: [62, 70, 66, 78, 74, 86, 84] },
    { label: "Errors", value: "0.2%", color: "red" as const, trend: [0.4, 0.3, 0.5, 0.3, 0.2, 0.3, 0.2] },
    { label: "P95", value: "212ms", color: "green" as const, trend: [260, 240, 251, 230, 222, 218, 212] },
  ]
  const log: ConsoleLine[] = [
    { text: "$ deploy --prod", at: "12:01" },
    { text: "build ok (4.2s)", at: "12:01", level: "success" },
  ]

  return (
    <DitherShell
      frame
      class="h-96"
      topbar={
        <div class="flex h-10 w-full items-center justify-between px-3 text-[12px]">
          acme ops
          <DitherAvatar name="Ada Byte" size={22} />
        </div>
      }
      aside={
        <>
          {/* items fold to icons */}
          <DitherRail label="Primary">
            <For each={items}>
              {(i) => (
                <DitherTooltip text={i}>
                  <DitherSidebarItem label={i} active={active() === i} onSelect={() => setActive(i)} />
                </DitherTooltip>
              )}
            </For>
          </DitherRail>
        </>
      }
      statusbar={<div class="flex h-7 w-full items-center px-3 text-[10px]">production: all systems normal</div>}
    >
      <DitherCanvas pattern="dots" class="h-full p-4">
        {/* stat cards */}
        <DitherGrid min={130}>
          <For each={stats}>
            {(s) => (
              <div class="rounded-md border bg-background/70 p-3 text-[12px]">
                {s.label} <b>{s.value}</b>
                <Sparkline data={s.trend} color={s.color} class="h-8" />
              </div>
            )}
          </For>
        </DitherGrid>
        <DitherConsole lines={log} title="deploys" class="mt-3 h-36" />
      </DitherCanvas>
    </DitherShell>
  )
}

export const meta = defineExample({
  component: DitherShell,
  title: "Shell",
  studio: { group: "structure", frame: { w: 360, h: 260 }, controls: { frame: {} }, slot: "Content" },
})
