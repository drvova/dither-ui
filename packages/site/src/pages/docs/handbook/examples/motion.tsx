import { createSignal, For } from "solid-js"
import { Bar, BarChart, DitherButton, XAxis, type ChartConfig } from "@dither-kit"

const DURATIONS = [300, 900, 2000]

export default function Example() {
  // replay re-runs the entrance; the duration is chosen live
  const [replayToken, setReplayToken] = createSignal(0)
  const [motionDuration, setMotionDuration] = createSignal(900)

  const rows = [
    { month: "Jan", organic: 820, paid: 420 },
    { month: "Feb", organic: 932, paid: 532 },
    { month: "Mar", organic: 901, paid: 501 },
    { month: "Apr", organic: 1290, paid: 654 },
    { month: "May", organic: 1330, paid: 690 },
    { month: "Jun", organic: 1320, paid: 720 },
    { month: "Jul", organic: 1450, paid: 810 },
    { month: "Aug", organic: 1682, paid: 932 },
  ]
  const config: ChartConfig = {
    organic: { label: "Organic", color: "green" },
    paid: { label: "Paid", color: "orange" },
  }

  // prefers-reduced-motion is respected automatically: entrances snap, sparkles hold still
  return (
    <div class="grid gap-5">
      <div class="h-48">
        <BarChart
          data={rows}
          config={config}
          interactive={false}
          animationDuration={motionDuration()}
          replayToken={replayToken()}
        >
          <XAxis dataKey="month" />
          <Bar dataKey="organic" />
          <Bar dataKey="paid" />
        </BarChart>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <DitherButton color="blue" variant="gradient" onClick={() => setReplayToken((n) => n + 1)}>
          Replay
        </DitherButton>
        <div class="flex items-center gap-1 rounded-md border border-border/60 p-1">
          <For each={DURATIONS}>
            {(d) => (
              <button
                type="button"
                class={`rounded px-2.5 py-1 text-[11px] tabular-nums transition-colors ${
                  motionDuration() === d ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setMotionDuration(d)
                  setReplayToken((n) => n + 1)
                }}
              >
                {d}ms
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
