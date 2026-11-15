import {
  Area,
  AreaChart,
  DitherAvatar,
  DitherGradient,
  DitherScreen,
  type ChartConfig,
  type ScreenKind,
} from "@dither-kit"

export default function Example(props: { screen?: ScreenKind }) {
  const rows = [
    { day: 1, sessions: 12, signups: 11 },
    { day: 2, sessions: 18, signups: 14 },
    { day: 3, sessions: 15, signups: 12 },
    { day: 4, sessions: 24, signups: 17 },
    { day: 5, sessions: 21, signups: 16 },
    { day: 6, sessions: 30, signups: 21 },
    { day: 7, sessions: 27, signups: 19 },
    { day: 8, sessions: 36, signups: 24 },
  ]
  const config: ChartConfig = {
    sessions: { label: "Sessions", color: "blue" },
    signups: { label: "Signups", color: "orange" },
  }

  // one DitherScreen around three surfaces: its screen reprints all of them,
  // the chart's series included. Or the matrices alone, for your own painter:
  // screenMatrix("dot", seed) gives the 4x4 thresholds, read as m[y & 3][x & 3]
  return (
    <DitherScreen screen={props.screen ?? "diagonal"}>
      <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div class="h-36 rounded-md bg-card p-2">
          <AreaChart data={rows} config={config} class="h-full">
            <Area dataKey="sessions" />
            <Area dataKey="signups" />
          </AreaChart>
        </div>
        <div class="flex items-center gap-3 sm:flex-col">
          <DitherAvatar name="print" size={64} />
          <div class="relative h-16 w-28 overflow-hidden rounded-md">
            <DitherGradient from="purple" direction="right" />
          </div>
        </div>
      </div>
    </DitherScreen>
  )
}
