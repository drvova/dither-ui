// The Examples' pages: whole screens composed from the kit (a dashboard, an
// app shell, an ops board, a team panel, usage and billing, a sign-in),
// each with the snippet that builds it from the same rows.
import { cssColor, DitherAvatar, DitherButton, DitherGradient, type DitherColor } from "@dither-ui/kit"
import { createSignal, For } from "solid-js"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Grid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Sparkline,
  Tooltip,
  XAxis,
} from "@/shared/ui/charts"
import DemoCard from "../DemoCard"
import { config, MONTHS, pieConfig, pieRows, radarConfig, radarRows, rows, STAT_ROWS, STATS, trend } from "../demo-data"
import DocSection from "../DocSection"
import { dataCode } from "../snippet"

// App shell example.
const SHELL_NAV = ["Overview", "Reports", "Alerts", "Settings"]

// Team example — contributors and their commit pulse.
const TEAM = [
  { name: "ada", role: "maintainer", commits: 284, color: "green" as DitherColor, data: trend(11, 0.3) },
  { name: "grace", role: "charts", commits: 197, color: "blue" as DitherColor, data: trend(12, 0.24) },
  { name: "linus", role: "engine", commits: 151, color: "purple" as DitherColor, data: trend(13, 0.18) },
  { name: "barbara", role: "docs", commits: 96, color: "orange" as DitherColor, data: trend(14, 0.12) },
]

// Usage example — renders per month and quota.
const usageRows = MONTHS.slice(0, 8).map((month, i) => ({
  month,
  renders: [212, 248, 231, 290, 341, 322, 398, 441][i],
}))
const usageConfig = { renders: { label: "Renders (k)", color: "blue" as DitherColor } }
const quotaRows = [
  { name: "used", value: 68 },
  { name: "free", value: 32 },
]
const quotaConfig = {
  used: { label: "Used", color: "blue" as DitherColor },
  free: { label: "Free", color: "grey" as DitherColor },
}

// Monitoring example — four services, their pulse and state.
const SERVICES = [
  { name: "api-gateway", uptime: "99.98%", ok: true, color: "green" as DitherColor, data: trend(4, 0.1) },
  { name: "render-farm", uptime: "99.91%", ok: true, color: "blue" as DitherColor, data: trend(5, 0.22) },
  { name: "dither-engine", uptime: "100%", ok: true, color: "purple" as DitherColor, data: trend(6, 0.16) },
  {
    name: "webhook-relay",
    uptime: "97.20%",
    ok: false,
    color: "red" as DitherColor,
    data: trend(7, -0.2).map((v) => Number((v + 8).toFixed(1))),
  },
]

const SNIPPETS = {
  dashboard: `${dataCode("stats", STAT_ROWS)}
${dataCode("rows", rows)}
${dataCode("config", config)}
${dataCode("share", pieRows)}
${dataCode("shareConfig", pieConfig)}

{/* stat cards */}
<div class="grid gap-4 sm:grid-cols-3">
  <For each={stats}>
    {(s) => (
      <div class="rounded-lg border p-4">
        <div class="text-[11px] text-muted-foreground">{s.label}</div>
        <span class="text-lg tabular-nums">{s.value}</span>
        <span class="ml-2 text-[11px]" style={{ color: cssColor(s.up ? 'green' : 'red') }}>{s.delta}</span>
        <Sparkline data={s.data} color={s.color} class="mt-3 h-8 w-full" />
      </div>
    )}
  </For>
</div>

{/* main panel */}
<div class="mt-4 grid gap-4 lg:grid-cols-3">
  <AreaChart data={rows} config={config} stackType="stacked" class="h-44 lg:col-span-2">
    <XAxis dataKey="month" maxTicks={6} />
    <Area dataKey="expenses" variant="dotted" />
    <Area dataKey="revenue" variant="gradient" />
    <Tooltip labelKey="month" />
  </AreaChart>
  <PieChart data={share} config={shareConfig} dataKey="value" nameKey="name" innerRadius={0.55} class="h-44">
    <Pie variant="gradient" />
  </PieChart>
</div>`,
  shell: `const nav = ${JSON.stringify(SHELL_NAV).replace(/,/g, ", ")}
const [page, setPage] = createSignal("Overview")
${dataCode("stats", STAT_ROWS)}
${dataCode("rows", rows)}
${dataCode("config", config)}

<div class="grid grid-cols-[160px_1fr] overflow-hidden rounded-lg border">
  {/* sidebar */}
  <aside class="flex min-h-[360px] flex-col border-r p-3" aria-label="Sidebar">
    <span class="px-2 py-1.5 text-[12px]">dither-ui</span>
    <nav class="mt-4 grid gap-0.5" aria-label="Pages">
      <For each={nav}>
        {(item) => (
          <button type="button" aria-pressed={page() === item}
            class={\`rounded-md px-2 py-1.5 text-left text-[11px] \${page() === item ? 'bg-card' : 'text-muted-foreground'}\`} onClick={() => setPage(item)}>{item}</button>
        )}
      </For>
    </nav>
    <div class="mt-auto flex items-center gap-2 px-2 pt-3 text-[11px]">
      <DitherAvatar name="ada" size={24} animate={false} /> ada
    </div>
  </aside>
  <div class="flex min-w-0 flex-col">
    {/* topbar */}
    <header class="flex h-10 items-center justify-between border-b px-4 text-[12px]">
      {page()}
      <DitherButton color="blue" variant="gradient">Export</DitherButton>
    </header>
    <main class="grid gap-3 p-4">
      <div class="grid grid-cols-3 gap-3">
        <For each={stats}>
          {(s) => (
            <div class="rounded-md border p-2.5 text-[10px]">
              {s.label} <b class="text-[13px]">{s.value}</b>
              <Sparkline data={s.data} color={s.color} class="mt-1.5 h-5 w-full" />
            </div>
          )}
        </For>
      </div>
      {/* main panel */}
      <AreaChart data={rows} config={config} stackType="stacked" interactive={false} class="h-36">
        <Area dataKey="expenses" variant="dotted" />
        <Area dataKey="revenue" variant="gradient" />
      </AreaChart>
    </main>
  </div>
</div>`,
  monitoring: `${dataCode("rows", rows)}
${dataCode("config", config)}
${dataCode("radarRows", radarRows)}
${dataCode("radarConfig", radarConfig)}
${dataCode("services", SERVICES)}

<div class="grid gap-4 lg:grid-cols-5">
  {/* pulse */}
  <LineChart data={rows} config={config} interactive={false} class="h-44 lg:col-span-3">
    <Grid horizontal />
    <XAxis dataKey="month" maxTicks={6} />
    <Line dataKey="revenue" />
    <Line dataKey="expenses" />
  </LineChart>
  {/* sprint health */}
  <RadarChart data={radarRows} config={radarConfig} nameKey="axis" class="h-44 lg:col-span-2">
    <Radar dataKey="current" />
    <Radar dataKey="previous" />
  </RadarChart>
  {/* status rows */}
  <div class="rounded-lg border lg:col-span-5">
    <For each={services}>
      {(s) => (
        <div class="flex items-center gap-4 px-4 py-2.5 text-[11px]">
          <span class="size-1.5 rounded-full" style={{ "background-color": cssColor(s.ok ? 'green' : 'red') }} />
          <span class="w-28 truncate">{s.name}</span>
          <Sparkline data={s.data} color={s.color} class="h-5 min-w-0 flex-1" />
          {s.uptime}
        </div>
      )}
    </For>
  </div>
</div>`,
  team: `${dataCode("team", TEAM)}

<For each={team}>
  {(m) => (
    <div class="flex items-center gap-4 px-4 py-2.5">
      <DitherAvatar name={m.name} size={32} animate={false} />
      <span class="text-[11px]">{m.name}</span>
      <span class="text-[10px] text-muted-foreground">{m.role}</span>
      <Sparkline data={m.data} color={m.color} class="h-5 flex-1" />
      <span class="tabular-nums">{m.commits}</span>
    </div>
  )}
</For>`,
  usage: `${dataCode("usageRows", usageRows)}
${dataCode("usageConfig", usageConfig)}
${dataCode("quotaRows", quotaRows)}
${dataCode("quotaConfig", quotaConfig)}

<div class="grid gap-4 sm:grid-cols-5">
  {/* renders a month */}
  <BarChart data={usageRows} config={usageConfig} interactive={false} class="h-40 sm:col-span-3">
    <XAxis dataKey="month" maxTicks={4} />
    <Bar dataKey="renders" />
  </BarChart>
  <div class="flex flex-col sm:col-span-2">
    {/* quota donut */}
    <PieChart data={quotaRows} config={quotaConfig} dataKey="value" nameKey="name" innerRadius={0.62} class="h-28">
      <Pie variant="gradient" />
    </PieChart>
    <p class="mt-2 text-center text-[11px]">6.8M / 10M renders</p>
    <DitherButton color="blue" variant="gradient" class="mt-3 w-full">Upgrade</DitherButton>
  </div>
</div>`,
  signin: `<div class="relative overflow-hidden rounded-lg border p-8">
  <DitherGradient from="blue" direction="up" opacity={0.2} />
  <span>dither-ui</span>                    {/* wordmark */}
  <input placeholder="you@dither-ui.com" />
  <input type="password" placeholder="••••••••" />
  <DitherButton color="blue" class="w-full">Sign in</DitherButton>
</div>`,
}

export default function PageExamples() {
  // App shell example.
  const [shellNav, setShellNav] = createSignal("Overview")

  return (
    <>
      {/* Dashboard */}
      <DocSection defer id="dashboard">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Everything composed: stat cards, a stacked area and a donut. One palette, one texture, zero SVG.
        </p>
        <DemoCard code={SNIPPETS.dashboard}>
          <div class="grid gap-4">
            <div class="grid gap-4 sm:grid-cols-3">
              <For each={STATS}>
                {(s) => (
                  <div class="rounded-lg border border-border/60 p-4">
                    <div class="text-[11px] text-muted-foreground">{s.label}</div>
                    <div class="mt-1 flex items-baseline gap-2">
                      <span class="text-lg tracking-tight tabular-nums">{s.value}</span>
                      <span class="text-[11px] tabular-nums" style={{ color: cssColor(s.up ? "green" : "red") }}>
                        {s.delta}
                      </span>
                    </div>
                    <Sparkline data={s.data} color={s.color} class="mt-3 h-8 w-full" />
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
                  <PieChart data={pieRows} config={pieConfig} dataKey="value" nameKey="name" innerRadius={0.55}>
                    <Pie variant="gradient" />
                  </PieChart>
                </div>
              </div>
            </div>
          </div>
        </DemoCard>
      </DocSection>

      {/* App shell */}
      <DocSection defer id="shell">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sidebar, topbar and content: a whole product frame from tokens and kit primitives. The nav works; click
          around.
        </p>
        <DemoCard code={SNIPPETS.shell}>
          <div class="grid grid-cols-[150px_1fr] overflow-hidden rounded-lg border border-border/60 text-left sm:grid-cols-[170px_1fr]">
            {/* Sidebar */}
            <aside
              class="flex min-h-[360px] flex-col border-r border-border/60 bg-background/40 p-3"
              aria-label="Sidebar"
            >
              <div class="flex items-center gap-2 px-2 py-1.5">
                <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                <span class="text-[12px] tracking-tight">dither-ui</span>
              </div>
              <nav class="mt-4 grid gap-0.5" aria-label="Pages">
                <For each={SHELL_NAV}>
                  {(item) => (
                    <button
                      type="button"
                      aria-pressed={shellNav() === item}
                      class={`rounded-md px-2 py-1.5 text-left text-[11px] transition-colors ${
                        shellNav() === item ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setShellNav(item)}
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
                <span class="text-[12px]">{shellNav()}</span>
                <DitherButton color="blue" variant="gradient" class="px-2.5 py-1 text-[10px]">
                  Export
                </DitherButton>
              </header>
              {/* The docs' own main holds the preview: its page is a plain block (the snippet keeps main). */}
              <div class="grid flex-1 content-start gap-3 p-4">
                <div class="grid grid-cols-3 gap-3">
                  <For each={STATS}>
                    {(s) => (
                      <div class="rounded-md border border-border/60 p-2.5">
                        <div class="truncate text-[10px] text-muted-foreground">{s.label}</div>
                        <div class="text-[13px] tracking-tight tabular-nums">{s.value}</div>
                        <Sparkline data={s.data} color={s.color} class="mt-1.5 h-5 w-full" />
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
        </DemoCard>
      </DocSection>

      {/* Monitoring */}
      <DocSection defer id="monitoring">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An ops board: system pulse, sprint health and per-service status rows. The grey seed marks what is quiet, red
          what is not.
        </p>
        <DemoCard code={SNIPPETS.monitoring}>
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
              <For each={SERVICES}>
                {(s, i) => (
                  <div class={`flex items-center gap-4 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}>
                    <span
                      class="size-1.5 shrink-0 rounded-full"
                      style={{ "background-color": cssColor(s.ok ? "green" : "red") }}
                    />
                    <span class="w-28 truncate text-[11px] text-foreground/90 sm:w-36">{s.name}</span>
                    <Sparkline data={s.data} color={s.color} class="h-5 min-w-0 flex-1" />
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
        </DemoCard>
      </DocSection>

      {/* Team */}
      <DocSection defer id="team">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A contributors panel: deterministic avatars, a commit pulse per person, one palette seed each.
        </p>
        <DemoCard code={SNIPPETS.team}>
          <div class="mx-auto max-w-md rounded-lg border border-border/60">
            <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <span class="text-[11px] text-muted-foreground">dither-ui contributors</span>
              <span class="text-[11px] tabular-nums text-muted-foreground">this quarter</span>
            </div>
            <For each={TEAM}>
              {(m, i) => (
                <div class={`flex items-center gap-3 px-4 py-2.5 ${i() > 0 ? "border-t border-border/40" : ""}`}>
                  <DitherAvatar name={m.name} size={32} animate={false} />
                  <div class="w-20 min-w-0 sm:w-24">
                    <div class="truncate text-[11px] text-foreground/90">{m.name}</div>
                    <div class="truncate text-[10px] text-muted-foreground">{m.role}</div>
                  </div>
                  <Sparkline data={m.data} color={m.color} class="h-5 min-w-0 flex-1" />
                  <span class="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{m.commits}</span>
                </div>
              )}
            </For>
          </div>
        </DemoCard>
      </DocSection>

      {/* Usage & billing */}
      <DocSection defer id="usage">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Renders per month, quota as a donut, and the one button every billing page needs.
        </p>
        <DemoCard code={SNIPPETS.usage}>
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
        </DemoCard>
      </DocSection>

      {/* Sign in */}
      <DocSection defer id="signin">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An auth card washed by a DitherGradient: the pixels do the decoration, the form stays plain.
        </p>
        <DemoCard code={SNIPPETS.signin}>
          <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
            <DitherGradient
              from="blue"
              to="transparent"
              direction="up"
              opacity={0.18}
              cell={4}
              renderMode="static"
              class="-z-10"
            />
            <div class="flex items-center gap-2">
              <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
              <span class="text-[12px] tracking-tight">dither-ui</span>
            </div>
            <p class="mt-1.5 text-[11px] text-muted-foreground">Sign in to your workspace</p>
            <div class="mt-5 grid gap-2.5">
              <input
                type="email"
                name="demo-email"
                placeholder="you@dither-ui.com"
                autocomplete="off"
                class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <input
                type="password"
                name="demo-password"
                placeholder="••••••••"
                autocomplete="off"
                class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <DitherButton color="blue" variant="gradient" class="w-full py-2 text-[11px]">
                Sign in
              </DitherButton>
            </div>
            {/* the card's foot, where the wash is densest: the full ink */}
            <p class="mt-4 text-center text-[10px] text-foreground">
              No account?{" "}
              <a
                href="#/docs/signin"
                class="underline decoration-border underline-offset-2"
                onClick={(e) => e.preventDefault()}
              >
                Request access
              </a>
            </p>
          </div>
        </DemoCard>
      </DocSection>
    </>
  )
}
