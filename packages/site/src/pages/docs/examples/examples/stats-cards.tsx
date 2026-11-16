import { createMemo, createSignal, For } from "solid-js"
import {} from "@dither-kit"

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

export default function Example() {
  const [period, setPeriod] = createSignal<(typeof PERIODS)[number]>("30d")

  const kpis = createMemo(() => KPIS[period()])

  /** Churn is inverted — a falling rate is the good direction. */
  const good = (k: Kpi) => (k.label === "Churn" ? k.delta < 0 : k.delta > 0)

  // churn is inverted: a falling rate is the good direction
  return (
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
              <div class="mt-2 text-[19px] leading-none tracking-tight tabular-nums text-foreground">{k.value}</div>
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
  )
}
