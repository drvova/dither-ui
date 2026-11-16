import { createSignal, For } from "solid-js"
import { Area, AreaChart, DitherAvatar, DitherButton, Sparkline, type ChartConfig, type DitherColor } from "@dither-kit"

export default function Example() {
  const nav = ["Overview", "Reports", "Alerts", "Settings"]
  const [page, setPage] = createSignal("Overview")
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

  return (
    <div class="grid grid-cols-[150px_1fr] overflow-hidden rounded-lg border border-border/60 text-left sm:grid-cols-[170px_1fr]">
      {/* Sidebar */}
      <aside class="flex min-h-[360px] flex-col border-r border-border/60 bg-background/40 p-3" aria-label="Sidebar">
        <div class="flex items-center gap-2 px-2 py-1.5">
          <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
          <span class="text-[12px] tracking-tight">dither-ui</span>
        </div>
        <nav class="mt-4 grid gap-0.5" aria-label="Pages">
          <For each={nav}>
            {(item) => (
              <button
                type="button"
                aria-pressed={page() === item}
                class={`rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${
                  page() === item ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            )}
          </For>
        </nav>
        <div class="mt-auto flex items-center gap-2 px-2 pt-3">
          <DitherAvatar name="ada" size={24} animate={false} />
          <div class="min-w-0">
            <div class="truncate text-[11px] text-foreground/90">ada</div>
            <div class="text-[10px] text-muted-foreground">admin</div>
          </div>
        </div>
      </aside>
      {/* Main */}
      <div class="flex min-w-0 flex-col">
        <header class="flex h-10 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <span class="text-[12px]">{page()}</span>
          <DitherButton color="blue" variant="gradient" class="px-2.5 py-1 text-[10px]">
            Export
          </DitherButton>
        </header>
        {/* The docs' own main holds the preview: its page is a plain block (the snippet keeps main). */}
        <div class="grid flex-1 content-start gap-3 p-4">
          <div class="grid grid-cols-3 gap-3">
            <For each={stats}>
              {(s) => (
                <div class="rounded-md border border-border/60 p-2.5">
                  <div class="truncate text-[10px] text-muted-foreground">{s.label}</div>
                  <div class="text-[13px] tracking-tight tabular-nums">{s.value}</div>
                  <Sparkline data={s.data} color={s.color as DitherColor} class="mt-1.5 h-5 w-full" />
                </div>
              )}
            </For>
          </div>
          <div class="rounded-md border border-border/60 p-3">
            <div class="text-[10px] text-muted-foreground">Revenue vs expenses</div>
            <div class="mt-2 h-36">
              <AreaChart data={rows} config={config} stackType="stacked" interactive={false}>
                <Area dataKey="expenses" variant="dotted" />
                <Area dataKey="revenue" variant="gradient" />
              </AreaChart>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
