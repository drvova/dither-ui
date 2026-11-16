import { Legend, Pie, PieChart, type AreaVariant, type ChartConfig } from "@dither-kit"

export default function Example(props: { variant?: AreaVariant; replayToken?: number }) {
  const pieRows = [
    { name: "Chrome", value: 61 },
    { name: "Safari", value: 19 },
    { name: "Firefox", value: 11 },
    { name: "Other", value: 9 },
  ]
  const pieConfig: ChartConfig = {
    Chrome: { label: "Chrome", color: "blue" },
    Safari: { label: "Safari", color: "purple" },
    Firefox: { label: "Firefox", color: "orange" },
    Other: { label: "Other", color: "grey" },
  }

  return (
    <div class="h-64">
      <PieChart
        data={pieRows}
        config={pieConfig}
        dataKey="value"
        nameKey="name"
        innerRadius={0.55}
        replayToken={props.replayToken}
      >
        {/* Pie takes no isClickable: the legend isolates */}
        <Pie variant={props.variant ?? "gradient"} />
        <Legend align="center" isClickable={true} />
      </PieChart>
    </div>
  )
}
