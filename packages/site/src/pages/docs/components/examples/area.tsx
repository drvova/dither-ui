import { Area, AreaChart, Grid, Legend, Tooltip, XAxis, YAxis, type AreaVariant, type ChartConfig } from "@dither-kit"

export default function Example(props: { variant?: AreaVariant | number; replayToken?: number }) {
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

  return (
    <div class="h-64">
      {/* variant: a fill's name, or a seed: one integer, one deterministic texture */}
      <AreaChart data={rows} config={config} stackType="stacked" replayToken={props.replayToken}>
        <Grid horizontal />
        <XAxis dataKey="month" maxTicks={6} />
        <YAxis tickCount={4} />
        <Area dataKey="expenses" variant="dotted" />
        <Area dataKey="revenue" variant={props.variant ?? "gradient"} />
        <Legend align="right" isClickable={true} />
        <Tooltip labelKey="month" />
      </AreaChart>
    </div>
  )
}
