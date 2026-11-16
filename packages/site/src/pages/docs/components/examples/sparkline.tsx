import { For } from "solid-js"
import { createStore } from "solid-js/store"
import { cssColor, DitherNumberFlow, Sparkline, type DitherColor } from "@dither-kit"

// The last 24 hours of a metric: every figure a card states is read from the
// series it plots, the headline the last hour, the delta the change across the day.
const trend = (seed: number, drift: number) =>
  Array.from({ length: 24 }, (_, i) =>
    Number((10 + i * drift + Math.sin(i * 0.8 + seed) * 2 + Math.sin(i * 1.7 + seed * 2) * 1.1).toFixed(1)),
  )
type Unit = { pre: string; scale: number; dec: number; suf: string }
const stat = (label: string, color: DitherColor, data: number[], unit: Unit, lowerIsBetter = false) => {
  const pct = ((data[data.length - 1] ?? 0) / (data[0] ?? 1) - 1) * 100
  return {
    label,
    color,
    data,
    unit,
    read: (v: number) => Number((v * unit.scale).toFixed(unit.dec)),
    delta: `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(1)}%`,
    // a falling error rate is the good way
    up: lowerIsBetter ? pct < 0 : pct > 0,
  }
}
const STATS = [
  stat("Revenue", "green", trend(1, 0.35), { pre: "$", scale: 2.4, dec: 1, suf: "k" }),
  stat("Active users", "blue", trend(2, 0.2), { pre: "", scale: 600, dec: 0, suf: "" }),
  stat(
    "Error rate",
    "red",
    trend(3, -0.18).map((v) => Number((v + 8).toFixed(1))),
    { pre: "", scale: 0.03, dec: 2, suf: "%" },
    true,
  ),
]

export default function Example() {
  // the hour under the pointer, per card
  const [scrubbed, setScrubbed] = createStore<Record<string, number | null>>({})

  return (
    <div class="grid gap-4 sm:grid-cols-3">
      <For each={STATS}>
        {(s) => (
          <div class="rounded-lg border border-border/60 p-4">
            <div class="text-[11px] text-muted-foreground">{s.label}</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="inline-flex items-center text-lg leading-none tracking-tight tabular-nums">
                {s.unit.pre}
                <DitherNumberFlow
                  value={s.read(s.data[scrubbed[s.label] ?? s.data.length - 1] ?? 0)}
                  decimals={s.unit.dec}
                  duration={240}
                />
                {s.unit.suf}
              </span>
              {/* The delta at rest, the hour while scrubbed: one cell. */}
              <span class="grid text-[11px] tabular-nums">
                <span
                  class={`[grid-area:1/1] transition-opacity duration-150 motion-reduce:transition-none ${
                    scrubbed[s.label] == null ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={scrubbed[s.label] != null}
                  style={{ color: cssColor(s.up ? "green" : "red") }}
                >
                  {s.delta}
                </span>
                <span
                  class={`text-muted-foreground [grid-area:1/1] transition-opacity duration-150 motion-reduce:transition-none ${
                    scrubbed[s.label] == null ? "opacity-0" : "opacity-100"
                  }`}
                  aria-hidden={scrubbed[s.label] == null}
                >
                  {s.data.length - 1 - (scrubbed[s.label] ?? s.data.length - 1)}h ago
                </span>
              </span>
            </div>
            <Sparkline
              data={s.data}
              color={s.color}
              interactive
              label={s.label}
              hoverLift={false}
              class="mt-3 h-8 w-full cursor-crosshair"
              onHoverChange={(i) => setScrubbed(s.label, i)}
            />
          </div>
        )}
      </For>
    </div>
  )
}
