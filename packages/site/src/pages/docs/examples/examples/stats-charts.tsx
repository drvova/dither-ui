import { DitherMeter, Sparkline } from "@dither-kit"

const TRENDS = {
  revenue: [12, 14, 13, 17, 16, 19, 22, 21, 24, 27, 26, 31],
  sessions: [420, 380, 460, 510, 470, 560, 540, 620, 590, 680, 710, 690],
  latency: [92, 88, 95, 84, 81, 86, 78, 74, 79, 71, 68, 66],
}

export default function Example() {
  return (
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
  )
}
