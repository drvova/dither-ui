import { Bar, BarChart, Grid, Legend, Tooltip, XAxis, YAxis, type AreaVariant, type ChartConfig } from "@dither-kit"

export default function Example(props: { variant?: AreaVariant; replayToken?: number }) {
  const trafficRows = [
    { month: "Jan", organic: 820, paid: 420 },
    { month: "Feb", organic: 932, paid: 532 },
    { month: "Mar", organic: 901, paid: 501 },
    { month: "Apr", organic: 1290, paid: 654 },
    { month: "May", organic: 1330, paid: 690 },
    { month: "Jun", organic: 1320, paid: 720 },
    { month: "Jul", organic: 1450, paid: 810 },
    { month: "Aug", organic: 1682, paid: 932 },
  ]
  const trafficConfig: ChartConfig = {
    organic: { label: "Organic", color: "green" },
    paid: { label: "Paid", color: "orange" },
  }

  return (
    <div class="h-64">
      <BarChart data={trafficRows} config={trafficConfig} replayToken={props.replayToken}>
        <Grid horizontal />
        <XAxis dataKey="month" />
        <YAxis tickCount={4} />
        <Bar dataKey="organic" variant={props.variant ?? "gradient"} />
        <Bar dataKey="paid" variant={props.variant ?? "gradient"} />
        <Legend align="right" />
        <Tooltip labelKey="month" />
      </BarChart>
    </div>
  )
}
