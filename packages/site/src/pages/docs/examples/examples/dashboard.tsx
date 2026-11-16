import { For } from "solid-js"
import {
  Area,
  AreaChart,
  cssColor,
  Pie,
  PieChart,
  Sparkline,
  Tooltip,
  XAxis,
  type ChartConfig,
  type DitherColor,
} from "@dither-kit"

export default function Example() {
  const stats = [
    {
      label: "Revenue",
      value: "$45.1k",
      delta: "+48.0%",
      up: true,
      color: "green",
      data: [
        12.7, 11.7, 10.9, 11.3, 10.3, 8.9, 10.8, 14.1, 14.7, 13.9, 14.5, 14.2, 11.9, 11.8, 14.9, 16.9, 16.6, 17.2, 17.9,
        16, 14, 15.6, 18.3, 18.8,
      ],
    },
    {
      label: "Active users",
      value: "9,480",
      delta: "+43.6%",
      up: true,
      color: "blue",
      data: [
        11, 10.3, 10.5, 9, 8, 10.4, 13.3, 13.1, 12.3, 12.7, 11.8, 9.5, 10, 13.2, 14.5, 13.9, 14.5, 14.7, 12.3, 10.7,
        12.8, 15.1, 15.2, 15.8,
      ],
    },
    {
      label: "Error rate",
      value: "0.48%",
      delta: "−11.1%",
      up: true,
      color: "red",
      data: [
        18, 17.7, 15.7, 14.8, 17.4, 19.4, 18.4, 17.3, 17.4, 15.7, 13.3, 14.2, 17, 17.3, 16.4, 16.7, 16, 13, 11.8, 14,
        15.5, 15, 15.4, 16,
      ],
    },
  ]
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
  const share = [
    { name: "Chrome", value: 61 },
    { name: "Safari", value: 19 },
    { name: "Firefox", value: 11 },
    { name: "Other", value: 9 },
  ]
  const shareConfig: ChartConfig = {
    Chrome: { label: "Chrome", color: "blue" },
    Safari: { label: "Safari", color: "purple" },
    Firefox: { label: "Firefox", color: "orange" },
    Other: { label: "Other", color: "grey" },
  }

  return (
    <div class="grid gap-4">
      <div class="grid gap-4 sm:grid-cols-3">
        <For each={stats}>
          {(s) => (
            <div class="rounded-lg border border-border/60 p-4">
              <div class="text-[11px] text-muted-foreground">{s.label}</div>
              <div class="mt-1 flex items-baseline gap-2">
                <span class="text-lg tracking-tight tabular-nums">{s.value}</span>
                <span class="text-[11px] tabular-nums" style={{ color: cssColor(s.up ? "green" : "red") }}>
                  {s.delta}
                </span>
              </div>
              <Sparkline data={s.data} color={s.color as DitherColor} class="mt-3 h-8 w-full" />
            </div>
          )}
        </For>
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-lg border border-border/60 p-4 lg:col-span-2">
          <div class="text-[11px] text-muted-foreground">Revenue vs expenses</div>
          <div class="mt-3 h-44">
            <AreaChart data={rows} config={config} stackType="stacked">
              <XAxis dataKey="month" maxTicks={6} />
              <Area dataKey="expenses" variant="dotted" />
              <Area dataKey="revenue" variant="gradient" />
              <Tooltip labelKey="month" />
            </AreaChart>
          </div>
        </div>
        <div class="rounded-lg border border-border/60 p-4">
          <div class="text-[11px] text-muted-foreground">Browser share</div>
          <div class="mt-3 h-44">
            <PieChart data={share} config={shareConfig} dataKey="value" nameKey="name" innerRadius={0.55}>
              <Pie variant="gradient" />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  )
}
