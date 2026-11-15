import { Legend, Radar, RadarChart, type ChartConfig } from "@dither-kit"

export default function Example() {
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

  return (
    <div class="h-72">
      <RadarChart data={radarRows} config={radarConfig} nameKey="axis">
        <Radar dataKey="current" />
        <Radar dataKey="previous" />
        <Legend align="center" />
      </RadarChart>
    </div>
  )
}
