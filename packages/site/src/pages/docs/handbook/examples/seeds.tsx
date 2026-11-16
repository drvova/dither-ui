import { createSignal, For } from "solid-js"
import { Area, AreaChart, DitherButton, XAxis, type ChartConfig } from "@dither-kit"

export default function Example() {
  // Master-seed playground: one integer drives texture, motion, easing, bloom.
  const [masterSeed, setMasterSeed] = createSignal(1984)
  const [masterReplay, setMasterReplay] = createSignal(0)
  function rollMaster() {
    setMasterSeed(Math.floor(Math.random() * 1_000_000))
    setMasterReplay((n) => n + 1)
  }

  const rows = [
    { month: "Jan", revenue: 42, expenses: 31 },
    { month: "Feb", revenue: 51, expenses: 34 },
    { month: "Mar", revenue: 48, expenses: 33 },
    { month: "Apr", revenue: 63, expenses: 39 },
    { month: "May", revenue: 71, expenses: 44 },
    { month: "Jun", revenue: 68, expenses: 47 },
    { month: "Jul", revenue: 79, expenses: 46 },
    { month: "Aug", revenue: 86, expenses: 52 },
    { month: "Sep", revenue: 82, expenses: 55 },
    { month: "Oct", revenue: 94, expenses: 58 },
    { month: "Nov", revenue: 102, expenses: 61 },
    { month: "Dec", revenue: 118, expenses: 67 },
  ]
  const config: ChartConfig = {
    revenue: { label: "Revenue", color: "blue" },
    expenses: { label: "Expenses", color: "purple" },
  }

  // one integer is a complete visual personality
  // seed derives duration, delay, easing, stagger, sparkles and bloom for every prop you leave
  // unset; explicit props always win. Seeds also work per prop: bloom, easing, variant, color (hue).
  return (
    <div class="grid gap-5">
      <div class="h-52">
        {/* a new seed is a new chart */}
        <For each={[masterSeed()]}>
          {(seed) => (
            <AreaChart data={rows} config={config} seed={seed} interactive={false} replayToken={masterReplay()}>
              <XAxis dataKey="month" maxTicks={6} />
              <Area dataKey="expenses" variant={seed + 1} />
              <Area dataKey="revenue" variant={seed} />
            </AreaChart>
          )}
        </For>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <DitherButton color="blue" variant="gradient" onClick={rollMaster}>
          Roll a personality
        </DitherButton>
        <span class="font-mono text-[11px] text-muted-foreground tabular-nums">seed: {masterSeed()}</span>
        <DitherButton color="purple" variant="dotted" bloom={masterSeed()}>
          seeded bloom
        </DitherButton>
      </div>
    </div>
  )
}
