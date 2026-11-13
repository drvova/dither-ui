import { createMemo, createSignal, For } from "solid-js"
import { DitherMeter, Sparkline } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import { dataCode } from "../snippet"

type Kpi = { label: string; icon: string; value: string; delta: number; note: string }

const PERIODS = ["30d", "90d"] as const

const KPIS: Record<(typeof PERIODS)[number], Kpi[]> = {
  "30d": [
    { label: "Revenue", icon: "$", value: "$54,239", delta: 12.5, note: "vs prior 30 days" },
    { label: "Active users", icon: "◩", value: "8,947", delta: 8.2, note: "vs prior 30 days" },
    { label: "Orders", icon: "▤", value: "1,254", delta: 24.1, note: "vs prior 30 days" },
    { label: "Churn", icon: "▽", value: "0.84%", delta: -0.3, note: "vs prior 30 days" },
  ],
  "90d": [
    { label: "Revenue", icon: "$", value: "$148,102", delta: 6.1, note: "vs prior 90 days" },
    { label: "Active users", icon: "◩", value: "9,410", delta: 3.4, note: "vs prior 90 days" },
    { label: "Orders", icon: "▤", value: "3,876", delta: -2.2, note: "vs prior 90 days" },
    { label: "Churn", icon: "▽", value: "1.02%", delta: 0.1, note: "vs prior 90 days" },
  ],
}

const TRENDS = {
  revenue: [12, 14, 13, 17, 16, 19, 22, 21, 24, 27, 26, 31],
  sessions: [420, 380, 460, 510, 470, 560, 540, 620, 590, 680, 710, 690],
  latency: [92, 88, 95, 84, 81, 86, 78, 74, 79, 71, 68, 66],
}

const SNIPPET_CARDS = `const periods = ${JSON.stringify(PERIODS).replace(/,/g, ", ")}
${dataCode("kpis", KPIS)}
const period = ref("30d")
// churn is inverted: a falling rate is the good direction
const good = (k: { label: string; delta: number }) => (k.label === "Churn" ? k.delta < 0 : k.delta > 0)

<!-- period picker -->
<div role="group" aria-label="Period" class="flex gap-1">
  <button v-for="p in periods" :key="p" type="button" :aria-pressed="period === p"
    @click="period = p">{{ p }}</button>
</div>

<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
  <div v-for="k in kpis[period]" :key="k.label" class="rounded-lg border p-3.5">
    <div class="flex items-center justify-between text-[11px]">
      <span class="text-muted-foreground">{{ k.label }}</span>
      <span class="grid size-6 place-items-center rounded-md border" aria-hidden="true">{{ k.icon }}</span>
    </div>
    <div class="mt-2 text-xl tabular-nums">{{ k.value }}</div>
    <!-- delta chip -->
    <span class="text-[10px]" :style="{ color: good(k) ? 'var(--swatch-green)' : 'var(--swatch-red)' }">
      {{ k.delta > 0 ? "▲" : "▼" }} {{ Math.abs(k.delta) }}%
    </span>
    <span class="ml-1.5 text-[10px] text-muted-foreground">{{ k.note }}</span>
  </div>
</div>`

const SNIPPET_CHARTS = `const revenue = [${TRENDS.revenue.join(", ")}]
const sessions = [${TRENDS.sessions.join(", ")}]

<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <!-- sparkline cards -->
  <div class="rounded-lg border p-3.5">
    <span class="text-[11px] text-muted-foreground">MRR</span>
    <div class="mt-1.5 text-[19px] tabular-nums">$31,204</div>
    <Sparkline :data="revenue" color="green" class="mt-3 h-10" />
  </div>
  <div class="rounded-lg border p-3.5">
    <span class="text-[11px] text-muted-foreground">Sessions</span>
    <div class="mt-1.5 text-[19px] tabular-nums">690k</div>
    <Sparkline :data="sessions" color="blue" variant="dotted" class="mt-3 h-10" />
  </div>
  <!-- goal card -->
  <div class="rounded-lg border p-3.5">
    <span class="text-[11px] text-muted-foreground">Q3 target</span>
    <div class="mt-1.5 text-[19px] tabular-nums">$34,000</div>
    <DitherMeter :value="68" class="mt-4 h-2 w-full" />
    <div class="mt-2 text-[10px] text-muted-foreground">of $50,000 booked</div>
  </div>
</div>`

export default function StatsExamples() {
  const [period, setPeriod] = createSignal<(typeof PERIODS)[number]>("30d")

  const kpis = createMemo(() => KPIS[period()])

  /** Churn is inverted — a falling rate is the good direction. */
  const good = (k: Kpi) => (k.label === "Churn" ? k.delta < 0 : k.delta > 0)

  return (
    <>
      {/* Stat cards */}
      <section class="mt-16 scroll-mt-24" id="stats-cards">
        <h2 class="text-lg tracking-tight">Stat cards</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The classic KPI grid: label, corner glyph, a big tabular number, and a signed delta that knows churn falling
          is good news. The period picker swaps the whole dataset live.
        </p>
        <DemoCard code={SNIPPET_CARDS}>
          <div class="mx-auto max-w-2xl">
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-muted-foreground">Overview</span>
              <div class="flex gap-1 rounded-md border border-border/60 p-0.5" role="group" aria-label="Period">
                <For each={PERIODS}>
                  {(p) => (
                    <button
                      class={`rounded px-2 py-0.5 text-[11px] transition-colors ${period() === p ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      type="button"
                      aria-pressed={period() === p}
                      onClick={() => setPeriod(p)}
                    >
                      {p}
                    </button>
                  )}
                </For>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <For each={kpis()}>
                {(k) => (
                  <div class="rounded-lg border border-border/60 bg-background/40 p-3.5">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] text-muted-foreground">{k.label}</span>
                      <span
                        class="grid size-6 place-items-center rounded-md border border-border/60 text-[11px] text-muted-foreground"
                        aria-hidden="true"
                      >
                        {k.icon}
                      </span>
                    </div>
                    <div class="mt-2 text-[19px] leading-none tracking-tight tabular-nums text-foreground">
                      {k.value}
                    </div>
                    <div class="mt-2 flex items-baseline gap-1.5">
                      <span
                        class="rounded border px-1 py-px text-[10px] tabular-nums"
                        style={{
                          color: `var(--swatch-${good(k) ? "green" : "red"})`,
                          "border-color": `color-mix(in oklab, var(--swatch-${good(k) ? "green" : "red"}) 35%, transparent)`,
                        }}
                      >
                        <span aria-hidden="true">{k.delta > 0 ? "▲" : "▼"}</span>
                        <span class="sr-only">{k.delta > 0 ? "up" : "down"}</span> {Math.abs(k.delta)}%
                      </span>
                      <span class="text-[10px] text-muted-foreground">{k.note}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </DemoCard>
      </section>
      {/* Stats with charts */}
      <section class="mt-16 scroll-mt-24" id="stats-charts">
        <h2 class="text-lg tracking-tight">Stats with charts</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Numbers with their shape: sparkline cards for trends, a meter card for progress toward a goal. Twelve points
          is plenty; the dither does the rest.
        </p>
        <DemoCard code={SNIPPET_CHARTS}>
          <div class="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-lg border border-border/60 bg-background/40 p-3.5">
              <div class="flex items-baseline justify-between">
                <span class="text-[11px] text-muted-foreground">MRR</span>
                <span
                  class="rounded border px-1 py-px text-[10px] tabular-nums"
                  style={{
                    color: "var(--swatch-green)",
                    "border-color": "color-mix(in oklab, var(--swatch-green) 35%, transparent)",
                  }}
                >
                  ▲ 18.9%
                </span>
              </div>
              <div class="mt-1.5 text-[19px] leading-none tracking-tight tabular-nums text-foreground">$31,204</div>
              <Sparkline class="mt-3 h-10" data={TRENDS.revenue} color="green" />
            </div>
            <div class="rounded-lg border border-border/60 bg-background/40 p-3.5">
              <div class="flex items-baseline justify-between">
                <span class="text-[11px] text-muted-foreground">Sessions</span>
                <span
                  class="rounded border px-1 py-px text-[10px] tabular-nums"
                  style={{
                    color: "var(--swatch-blue)",
                    "border-color": "color-mix(in oklab, var(--swatch-blue) 35%, transparent)",
                  }}
                >
                  ▲ 9.6%
                </span>
              </div>
              <div class="mt-1.5 text-[19px] leading-none tracking-tight tabular-nums text-foreground">690k</div>
              <Sparkline class="mt-3 h-10" data={TRENDS.sessions} color="blue" variant="dotted" />
            </div>
            <div class="rounded-lg border border-border/60 bg-background/40 p-3.5">
              <div class="flex items-baseline justify-between">
                <span class="text-[11px] text-muted-foreground">Q3 target</span>
                <span class="text-[10px] tabular-nums text-muted-foreground">68%</span>
              </div>
              <div class="mt-1.5 text-[19px] leading-none tracking-tight tabular-nums text-foreground">$34,000</div>
              <DitherMeter class="mt-4 h-2 w-full" value={68} />
              <div class="mt-2 text-[10px] text-muted-foreground">of $50,000 booked</div>
            </div>
          </div>
        </DemoCard>
      </section>
    </>
  )
}
