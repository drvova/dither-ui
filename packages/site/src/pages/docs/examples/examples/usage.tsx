import { Bar, BarChart, DitherButton, Pie, PieChart, XAxis, type ChartConfig } from "@dither-kit"

export default function Example() {
  const usageRows = [
    { month: "Jan", renders: 212 },
    { month: "Feb", renders: 248 },
    { month: "Mar", renders: 231 },
    { month: "Apr", renders: 290 },
    { month: "May", renders: 341 },
    { month: "Jun", renders: 322 },
    { month: "Jul", renders: 398 },
    { month: "Aug", renders: 441 },
  ]
  const usageConfig: ChartConfig = {
    renders: { label: "Renders (k)", color: "blue" },
  }
  const quotaRows = [
    { name: "used", value: 68 },
    { name: "free", value: 32 },
  ]
  const quotaConfig: ChartConfig = {
    used: { label: "Used", color: "blue" },
    free: { label: "Free", color: "grey" },
  }

  return (
    <div class="grid gap-4 sm:grid-cols-5">
      <div class="rounded-lg border border-border/60 p-4 sm:col-span-3">
        <div class="text-[11px] text-muted-foreground">Renders per month</div>
        <div class="mt-3 h-40">
          <BarChart data={usageRows} config={usageConfig} interactive={false}>
            <XAxis dataKey="month" maxTicks={4} />
            <Bar dataKey="renders" />
          </BarChart>
        </div>
      </div>
      <div class="flex flex-col rounded-lg border border-border/60 p-4 sm:col-span-2">
        <div class="text-[11px] text-muted-foreground">dither-ui pro quota</div>
        <div class="mt-3 h-28">
          <PieChart data={quotaRows} config={quotaConfig} dataKey="value" nameKey="name" innerRadius={0.62}>
            <Pie variant="gradient" />
          </PieChart>
        </div>
        <div class="mt-2 text-center text-[11px] tabular-nums text-muted-foreground">6.8M / 10M renders</div>
        <DitherButton color="blue" variant="gradient" class="mt-3 w-full py-2 text-[11px]">
          Upgrade
        </DitherButton>
      </div>
    </div>
  )
}
