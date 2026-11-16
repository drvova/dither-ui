import { For } from "solid-js"
import {
  cssColor,
  Grid,
  Line,
  LineChart,
  Radar,
  RadarChart,
  Sparkline,
  XAxis,
  type ChartConfig,
  type DitherColor,
} from "@dither-kit"

export default function Example() {
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
  const radarRows = [
    { axis: "shipped", current: 9, previous: 6 },
    { axis: "reviewed", current: 7, previous: 7 },
    { axis: "tested", current: 8, previous: 5 },
    { axis: "documented", current: 6, previous: 3 },
    { axis: "on time", current: 8, previous: 6 },
  ]
  const radarConfig: ChartConfig = {
    current: { label: "This sprint", color: "blue" },
    previous: { label: "Last sprint", color: "grey" },
  }
  const services = [
    {
      name: "api-gateway",
      uptime: "99.98%",
      ok: true,
      color: "green",
      data: [
        9.6, 7.8, 7.9, 11.1, 12.9, 11.7, 11.1, 11.3, 9.6, 7.9, 9.8, 12.7, 12.8, 12.2, 12.8, 11.9, 9.2, 9, 11.8, 13.2,
        12.8, 13.7, 14, 11.5,
      ],
    },
    {
      name: "render-farm",
      uptime: "99.91%",
      ok: true,
      color: "blue",
      data: [
        7.5, 8.5, 11.9, 13.1, 11.8, 11.5, 11.7, 9.8, 8.8, 11.4, 14.1, 13.9, 13.5, 14.2, 12.9, 10.5, 11.3, 14.3, 15.3,
        15, 16.1, 16.1, 13.4, 12.1,
      ],
    },
    {
      name: "dither-engine",
      uptime: "100%",
      ok: true,
      color: "purple",
      data: [
        8.9, 12.1, 12.6, 11.1, 11, 10.8, 8.8, 8.4, 11.4, 13.5, 12.9, 12.6, 13.1, 11.3, 9.2, 10.7, 13.6, 14, 13.8, 14.8,
        14.2, 11.3, 10.7, 13.2,
      ],
    },
    {
      name: "webhook-relay",
      uptime: "97.20%",
      ok: false,
      color: "red",
      data: [
        20.4, 19.8, 18, 17.7, 16.8, 14.5, 14.5, 17.4, 18.6, 17.3, 16.9, 16.7, 14.2, 12.3, 14.1, 16.4, 16, 15.6, 16.2,
        14.6, 11.5, 11.3, 13.6, 14.3,
      ],
    },
  ]

  return (
    <div class="grid gap-4 lg:grid-cols-5">
      <div class="rounded-lg border border-border/60 p-4 lg:col-span-3">
        <div class="text-[11px] text-muted-foreground">System pulse</div>
        <div class="mt-3 h-44">
          <LineChart data={rows} config={config} interactive={false}>
            <Grid horizontal />
            <XAxis dataKey="month" maxTicks={6} />
            <Line dataKey="revenue" />
            <Line dataKey="expenses" />
          </LineChart>
        </div>
      </div>
      <div class="rounded-lg border border-border/60 p-4 lg:col-span-2">
        <div class="text-[11px] text-muted-foreground">Sprint health</div>
        <div class="mt-3 h-44">
          <RadarChart data={radarRows} config={radarConfig} nameKey="axis">
            <Radar dataKey="current" />
            <Radar dataKey="previous" />
          </RadarChart>
        </div>
      </div>
      <div class="rounded-lg border border-border/60 lg:col-span-5">
        <For each={services}>
          {(s, i) => (
            <div class={`flex items-center gap-4 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}>
              <span
                class="size-1.5 shrink-0 rounded-full"
                style={{ "background-color": cssColor(s.ok ? "green" : "red") }}
              />
              <span class="w-28 truncate text-[11px] text-foreground/90 sm:w-36">{s.name}</span>
              <Sparkline data={s.data} color={s.color as DitherColor} class="h-5 min-w-0 flex-1" />
              <span
                class={`w-14 text-right text-[11px] tabular-nums ${s.ok ? "text-muted-foreground" : "text-foreground"}`}
                style={s.ok ? {} : { color: cssColor("red") }}
              >
                {s.uptime}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
