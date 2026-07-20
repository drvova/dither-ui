<script lang="ts">
  import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    RadarChart,
    Sparkline,
    Grid,
    XAxis,
    Tooltip,
    DitherAvatar,
    DitherButton,
    DitherGradient,
    cssColor,
    type ButtonVariant,
    type DitherColor,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"

  // Believable dashboard numbers, not sine waves.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const revenue = [42, 51, 48, 63, 71, 68, 79, 86, 82, 94, 102, 118]
  const expenses = [31, 34, 33, 39, 44, 47, 46, 52, 55, 58, 61, 67]
  const rows = MONTHS.map((month, i) => ({ month, revenue: revenue[i], expenses: expenses[i] }))
  const config = {
    revenue: { label: "Revenue", color: "blue" as DitherColor },
    expenses: { label: "Expenses", color: "purple" as DitherColor },
  }

  const pieRows = [
    { name: "Chrome", value: 61 },
    { name: "Safari", value: 19 },
    { name: "Firefox", value: 11 },
    { name: "Other", value: 9 },
  ]
  const pieConfig = {
    Chrome: { label: "Chrome", color: "blue" as DitherColor },
    Safari: { label: "Safari", color: "purple" as DitherColor },
    Firefox: { label: "Firefox", color: "orange" as DitherColor },
    Other: { label: "Other", color: "grey" as DitherColor },
  }

  const radarConfig = {
    current: { label: "This sprint", color: "blue" as DitherColor },
    previous: { label: "Last sprint", color: "grey" as DitherColor },
  }
  const radarRows = [
    { axis: "shipped", current: 9, previous: 6 },
    { axis: "reviewed", current: 7, previous: 7 },
    { axis: "tested", current: 8, previous: 5 },
    { axis: "documented", current: 6, previous: 3 },
    { axis: "on time", current: 8, previous: 6 },
  ]

  // Stat-card sparklines — last 24 data points each.
  const trend = (seed: number, drift: number) =>
    Array.from({ length: 24 }, (_, i) => 10 + i * drift + Math.sin(i * 0.8 + seed) * 2 + Math.sin(i * 1.7 + seed * 2) * 1.1)
  const STATS = [
    { label: "Revenue", value: "$48.2k", delta: "+12.4%", up: true, color: "green" as DitherColor, data: trend(1, 0.35) },
    { label: "Active users", value: "8,110", delta: "+3.2%", up: true, color: "blue" as DitherColor, data: trend(2, 0.2) },
    { label: "Error rate", value: "0.42%", delta: "−8.1%", up: false, color: "red" as DitherColor, data: trend(3, -0.18).map((v) => v + 8) },
  ]

  // App shell example.
  const SHELL_NAV = ["Overview", "Reports", "Alerts", "Settings"]
  let shellNav = $state("Overview")

  // Monitoring example — four services, their pulse and state.
  const SERVICES = [
    { name: "api-gateway", uptime: "99.98%", ok: true, color: "green" as DitherColor, data: trend(4, 0.1) },
    { name: "render-farm", uptime: "99.91%", ok: true, color: "blue" as DitherColor, data: trend(5, 0.22) },
    { name: "dither-engine", uptime: "100%", ok: true, color: "purple" as DitherColor, data: trend(6, 0.16) },
    { name: "webhook-relay", uptime: "97.20%", ok: false, color: "red" as DitherColor, data: trend(7, -0.2).map((v) => v + 8) },
  ]

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

  // Sign up — a working plan picker.
  const PLANS = ["Free", "Pro", "Scale"]
  let signupPlan = $state("Free")

  // Magic link — two states, send then confirm.
  let magicEmail = $state("")
  let sent = $state(false)

  // Two-factor — six cells with auto-advancing focus.
  let codeInputs = $state<HTMLInputElement[]>([])
  function onCodeInput(i: number) {
    if (codeInputs[i]?.value && i < 5) codeInputs[i + 1]?.focus()
  }

  // Pricing tiers.
  const TIERS: {
    name: string
    price: string
    blurb: string
    popular: boolean
    features: string[]
    cta: { label: string; variant: ButtonVariant; color: DitherColor }
  }[] = [
    {
      name: "Free",
      price: "$0",
      blurb: "for side projects",
      popular: false,
      features: ["1 workspace", "10k renders / mo", "Community support"],
      cta: { label: "Start free", variant: "dotted", color: "grey" },
    },
    {
      name: "Pro",
      price: "$12",
      blurb: "for products",
      popular: true,
      features: ["Unlimited workspaces", "10M renders / mo", "All chart types", "Email support"],
      cta: { label: "Go Pro", variant: "gradient", color: "blue" },
    },
    {
      name: "Scale",
      price: "$49",
      blurb: "for teams",
      popular: false,
      features: ["Everything in Pro", "SSO + audit log", "Priority support", "Custom palettes"],
      cta: { label: "Contact us", variant: "solid", color: "purple" },
    },
  ]

  // Activity feed.
  const FEED = [
    { name: "ada", text: "pushed to dither-engine", time: "2m", unread: true },
    { name: "grace", text: "opened #128 dithered tooltips", time: "14m", unread: true },
    { name: "linus", text: "released v0.2.0", time: "1h", unread: false },
    { name: "barbara", text: "commented on #124", time: "3h", unread: false },
    { name: "alan", text: "merged #122 radar sparkles", time: "5h", unread: false },
  ]

  // Changelog releases.
  const RELEASES = [
    { version: "v0.3.0", title: "Interactive docs playgrounds", date: "today", tags: ["docs", "charts"] },
    { version: "v0.2.0", title: "Motion, bloom and replay", date: "last week", tags: [] as string[] },
    { version: "v0.1.0", title: "First public dither", date: "Jan", tags: [] as string[] },
  ]

  // Code tabs — Svelte syntax mirrors of each demo.
  const dashboardCode = `<!-- stat cards -->
{#each stats as s}
  <div class="rounded-lg border p-4">
    <span>{s.label}</span> <b>{s.value}</b>
    <Sparkline data={s.data} color={s.color} class="h-8" />
  </div>
{/each}

<!-- main panel -->
<AreaChart {data} {config} stackType="stacked">
  <XAxis dataKey="month" /> <Area dataKey="expenses" variant="dotted" />
  <Area dataKey="revenue" /> <Tooltip labelKey="month" />
</AreaChart>
<PieChart data={share} config={shareConfig} dataKey="value"
  nameKey="name" innerRadius={0.55}><Pie /></PieChart>`

  const shellCode = `<div class="grid grid-cols-[160px_1fr] rounded-lg border">
  <aside class="border-r p-3">          <!-- sidebar -->
    brand · nav (active chip) · <DitherAvatar /> footer
  </aside>
  <div>
    <header class="border-b px-4">      <!-- topbar -->
      title · <DitherButton>Export</DitherButton>
    </header>
    <main class="grid gap-4 p-4">
      stat cards with <Sparkline />
      <AreaChart ... />                    <!-- main panel -->
    </main>
  </div>
</div>`

  const monitoringCode = `<LineChart {data} {config}>              <!-- pulse -->
  <Grid horizontal /> <XAxis dataKey="month" />
  <Line dataKey="revenue" /> <Line dataKey="expenses" />
</LineChart>

<RadarChart {data} {config} nameKey="axis" />   <!-- sprint health -->

{#each services as s}                     <!-- status rows -->
  <div>
    <span class={s.ok ? "bg-green" : "bg-red"} />  <!-- dot -->
    {s.name} <Sparkline data={s.data} color={s.color} />
    {s.uptime}
  </div>
{/each}`

  const teamCode = `{#each team as m}
  <div class="flex items-center gap-4">
    <DitherAvatar name={m.name} size={32} />
    {m.name} · {m.role}
    <Sparkline data={m.data} color={m.color} class="h-5 flex-1" />
    <span class="tabular-nums">{m.commits}</span>
  </div>
{/each}`

  const usageCode = `<BarChart data={usageRows} config={usageConfig}>   <!-- renders/mo -->
  <XAxis dataKey="month" /> <Bar dataKey="renders" />
</BarChart>

<PieChart data={quotaRows} config={quotaConfig}    <!-- quota donut -->
  dataKey="value" nameKey="name" innerRadius={0.62}>
  <Pie />
</PieChart>

<DitherButton color="blue">Upgrade to Pro</DitherButton>`

  const signinCode = `<div class="relative overflow-hidden rounded-lg border p-8">
  <DitherGradient from="blue" direction="up" opacity={0.2} />
  <span>dither-ui</span>                    <!-- wordmark -->
  <input placeholder="you@dither-ui.com" />
  <input type="password" placeholder="••••••••" />
  <DitherButton color="blue" class="w-full">Sign in</DitherButton>
</div>`

  const signupCode = `<div class="relative overflow-hidden rounded-lg border p-7">
  <DitherGradient from="purple" direction="up" opacity={0.16} />
  <span>dither-ui</span>                    <!-- wordmark -->
  <input name="signup-name" placeholder="Ada Byte" />
  <input name="signup-email" placeholder="you@dither-ui.com" />
  <input type="password" placeholder="••••••••" />
  <div role="group">                        <!-- plan picker -->
    {#each plans as p}
      <button aria-pressed={plan === p} onclick={() => (plan = p)}>{p}</button>
    {/each}
  </div>
  <DitherButton color="purple" class="w-full">Create account</DitherButton>
</div>`

  const magicCode = `<div class="relative overflow-hidden rounded-lg border p-7">
  <DitherGradient from="green" direction="up" opacity={0.14} />
  <span>dither-ui</span>                    <!-- wordmark -->
  {#if !sent}
    <input bind:value={email} placeholder="you@dither-ui.com" />
    <DitherButton color="green" class="w-full" onclick={() => (sent = true)}>
      Send magic link
    </DitherButton>
  {:else}
    <span>✓</span> Check your inbox — {email}
    <button onclick={() => (sent = false)}>use a different email</button>
  {/if}
</div>`

  const twofactorCode = `<div class="relative overflow-hidden rounded-lg border p-7">
  <DitherGradient from="blue" direction="up" opacity={0.14} />
  <span>dither-ui</span>                    <!-- wordmark -->
  <div class="flex gap-2">                  <!-- code inputs -->
    {#each Array(6) as _, i (i)}
      <input bind:this={cells[i]} maxlength="1" inputmode="numeric"
        class="w-9 h-11 text-center" oninput={() => focusNext(i)} />
    {/each}
  </div>
  <DitherButton color="blue" class="w-full">Verify</DitherButton>
  <button>resend in 24s</button>
</div>`

  const pricingCode = `<div class="grid gap-4 sm:grid-cols-3">
  {#each tiers as tier}
    <div class="relative rounded-lg border p-4">
      {#if tier.popular}<DitherGradient from="blue" opacity={0.12} />{/if}
      <span>{tier.name}</span>
      <b class="tabular-nums">{tier.price}</b><span>/mo</span>
      <ul>
        {#each tier.features as f}
          <li><span class="size-1.5 bg-foreground/40" /> {f}</li>
        {/each}
      </ul>
      <DitherButton variant={tier.cta.variant} color={tier.cta.color} class="w-full">
        {tier.cta.label}
      </DitherButton>
    </div>
  {/each}
</div>`

  const activityCode = `<div class="rounded-lg border">
  <header>dither-ui · activity</header>
  {#each feed as row}
    <div class="flex items-center gap-3 border-t px-4 py-2.5">
      <DitherAvatar name={row.name} size={24} animate={false} />
      <span><b>{row.name}</b> {row.text}</span>
      {#if row.unread}
        <span class="size-1.5 rounded-full" style:background-color={cssColor("blue")} />
      {/if}
      <time class="tabular-nums">{row.time}</time>
    </div>
  {/each}
</div>`

  const changelogCode = `{#each releases as r, i}
  <div class="flex gap-3">
    <div class="flex flex-col items-center">
      <span class="size-2 rounded-[2px]"
        style:background-color={i === 0 ? cssColor("green") : ""} />
      <span class="w-px flex-1 bg-border/60" />
    </div>
    <div>
      <b>{r.version}</b> {r.title} <time>{r.date}</time>
      {#each r.tags as tag}<span class="rounded border px-1.5">{tag}</span>{/each}
    </div>
  </div>
{/each}`
</script>

<!-- Dashboard -->
<section id="dashboard" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Dashboard example</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    Everything composed: stat cards, a stacked area, a donut — one palette, one texture, zero SVG.
  </p>
  <DemoCard code={dashboardCode}>
    <div class="grid gap-4">
      <div class="grid gap-4 sm:grid-cols-3">
        {#each STATS as s (s.label)}
          <div class="rounded-lg border border-border/60 p-4">
            <div class="text-[11px] text-muted-foreground">{s.label}</div>
            <div class="mt-1 flex items-baseline gap-2">
              <span class="text-lg tracking-tight tabular-nums">{s.value}</span>
              <span class="text-[11px] tabular-nums" style:color={cssColor(s.up ? "green" : "red")}>{s.delta}</span>
            </div>
            <Sparkline data={s.data} color={s.color} class="mt-3 h-8 w-full" />
          </div>
        {/each}
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-lg border border-border/60 p-4 lg:col-span-2">
          <div class="text-[11px] text-muted-foreground">Revenue vs expenses</div>
          <div class="mt-3 h-44">
            <AreaChart data={rows} {config} stackType="stacked">
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
</section>

<!-- App shell -->
<section id="shell" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">App shell</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    Sidebar, topbar, content — a whole product frame from tokens and kit primitives. The nav works; click around.
  </p>
  <DemoCard code={shellCode}>
    <div class="grid grid-cols-[150px_1fr] overflow-hidden rounded-lg border border-border/60 text-left sm:grid-cols-[170px_1fr]">
      <!-- Sidebar -->
      <aside class="flex min-h-[360px] flex-col border-r border-border/60 bg-background/40 p-3">
        <div class="flex items-center gap-2 px-2 py-1.5">
          <span class="inline-block size-2.5 rounded-[2px] bg-foreground"></span>
          <span class="text-[12px] tracking-tight">dither-ui</span>
        </div>
        <nav class="mt-4 grid gap-0.5">
          {#each SHELL_NAV as item (item)}
            <button
              type="button"
              aria-pressed={shellNav === item}
              class="rounded-md px-2 py-1.5 text-left text-[11px] transition-colors {shellNav === item
                ? 'bg-card text-foreground'
                : 'text-muted-foreground hover:text-foreground'}"
              onclick={() => (shellNav = item)}
            >
              {item}
            </button>
          {/each}
        </nav>
        <div class="mt-auto flex items-center gap-2 px-2 pt-3">
          <DitherAvatar name="ada" size={24} animate={false} />
          <div class="min-w-0">
            <div class="truncate text-[11px] text-foreground/90">ada</div>
            <div class="text-[10px] text-muted-foreground">admin</div>
          </div>
        </div>
      </aside>
      <!-- Main -->
      <div class="flex min-w-0 flex-col">
        <header class="flex h-10 shrink-0 items-center justify-between border-b border-border/60 px-4">
          <span class="text-[12px]">{shellNav}</span>
          <DitherButton color="blue" variant="gradient" class="px-2.5 py-1 text-[10px]">Export</DitherButton>
        </header>
        <main class="grid flex-1 content-start gap-3 p-4">
          <div class="grid grid-cols-3 gap-3">
            {#each STATS as s (s.label)}
              <div class="rounded-md border border-border/60 p-2.5">
                <div class="truncate text-[10px] text-muted-foreground">{s.label}</div>
                <div class="text-[13px] tracking-tight tabular-nums">{s.value}</div>
                <Sparkline data={s.data} color={s.color} class="mt-1.5 h-5 w-full" />
              </div>
            {/each}
          </div>
          <div class="rounded-md border border-border/60 p-3">
            <div class="text-[10px] text-muted-foreground">Revenue vs expenses</div>
            <div class="mt-2 h-36">
              <AreaChart data={rows} {config} stackType="stacked" interactive={false}>
                <Area dataKey="expenses" variant="dotted" />
                <Area dataKey="revenue" variant="gradient" />
              </AreaChart>
            </div>
          </div>
        </main>
      </div>
    </div>
  </DemoCard>
</section>

<!-- Monitoring -->
<section id="monitoring" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Monitoring</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    An ops board: system pulse, sprint health, and per-service status rows — the grey seed marks what is quiet, red what is not.
  </p>
  <DemoCard code={monitoringCode}>
    <div class="grid gap-4 lg:grid-cols-5">
      <div class="rounded-lg border border-border/60 p-4 lg:col-span-3">
        <div class="text-[11px] text-muted-foreground">System pulse</div>
        <div class="mt-3 h-44">
          <LineChart data={rows} {config} interactive={false}>
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
          <RadarChart data={radarRows} config={radarConfig} nameKey="axis" />
        </div>
      </div>
      <div class="rounded-lg border border-border/60 lg:col-span-5">
        {#each SERVICES as s, i (s.name)}
          <div class="flex items-center gap-4 px-4 py-2.5 {i > 0 ? 'border-t border-border/40' : ''}">
            <span class="size-1.5 shrink-0 rounded-full" style:background-color={cssColor(s.ok ? "green" : "red")}></span>
            <span class="w-28 truncate text-[11px] text-foreground/90 sm:w-36">{s.name}</span>
            <Sparkline data={s.data} color={s.color} class="h-5 min-w-0 flex-1" />
            <span
              class="w-14 text-right text-[11px] tabular-nums {s.ok ? 'text-muted-foreground' : 'text-foreground'}"
              style:color={s.ok ? undefined : cssColor("red")}
            >
              {s.uptime}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </DemoCard>
</section>

<!-- Team -->
<section id="team" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Team</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    Contributors panel — deterministic avatars, a commit pulse per person, one palette seed each.
  </p>
  <DemoCard code={teamCode}>
    <div class="mx-auto max-w-md rounded-lg border border-border/60">
      <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <span class="text-[11px] text-muted-foreground">dither-ui · contributors</span>
        <span class="text-[11px] tabular-nums text-muted-foreground">this quarter</span>
      </div>
      {#each TEAM as m, i (m.name)}
        <div class="flex items-center gap-3 px-4 py-2.5 {i > 0 ? 'border-t border-border/40' : ''}">
          <DitherAvatar name={m.name} size={32} animate={false} />
          <div class="w-20 min-w-0 sm:w-24">
            <div class="truncate text-[11px] text-foreground/90">{m.name}</div>
            <div class="truncate text-[10px] text-muted-foreground">{m.role}</div>
          </div>
          <Sparkline data={m.data} color={m.color} class="h-5 min-w-0 flex-1" />
          <span class="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{m.commits}</span>
        </div>
      {/each}
    </div>
  </DemoCard>
</section>

<!-- Usage & billing -->
<section id="usage" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Usage & billing</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    Renders per month, quota as a donut, and the one button every billing page needs.
  </p>
  <DemoCard code={usageCode}>
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
        <div class="text-[11px] text-muted-foreground">Quota · dither-ui pro</div>
        <div class="mt-3 h-28">
          <PieChart data={quotaRows} config={quotaConfig} dataKey="value" nameKey="name" innerRadius={0.62}>
            <Pie variant="gradient" />
          </PieChart>
        </div>
        <div class="mt-2 text-center text-[11px] tabular-nums text-muted-foreground">6.8M / 10M renders</div>
        <DitherButton color="blue" variant="gradient" class="mt-3 w-full py-2 text-[11px]">Upgrade</DitherButton>
      </div>
    </div>
  </DemoCard>
</section>

<!-- Sign in -->
<section id="signin" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Sign in</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    An auth card washed by a DitherGradient — the pixels do the decoration, the form stays plain.
  </p>
  <DemoCard code={signinCode}>
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient from="blue" to="transparent" direction="up" opacity={0.18} cell={4} renderMode="static" class="-z-10" />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground"></span>
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      <p class="mt-1.5 text-[11px] text-muted-foreground">Sign in to your workspace</p>
      <div class="mt-5 grid gap-2.5">
        <input
          type="email"
          name="demo-email"
          placeholder="you@dither-ui.com"
          autocomplete="off"
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
        />
        <input
          type="password"
          name="demo-password"
          placeholder="••••••••"
          autocomplete="off"
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
        />
        <DitherButton color="blue" variant="gradient" class="w-full py-2 text-[11px]">Sign in</DitherButton>
      </div>
      <p class="mt-4 text-center text-[10px] text-muted-foreground">
        No account?
        <a href="#/docs/signin" class="text-foreground/80 underline decoration-border underline-offset-2" onclick={(e) => e.preventDefault()}>Request access</a>
      </p>
    </div>
  </DemoCard>
</section>

<!-- Sign up -->
<section id="signup" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Sign up</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    A signup card with a working plan picker — segmented control from plain aria-pressed buttons, purple wash behind.
  </p>
  <DemoCard code={signupCode}>
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient from="purple" to="transparent" direction="up" opacity={0.16} cell={4} renderMode="static" class="-z-10" />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground"></span>
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      <p class="mt-1.5 text-[11px] text-muted-foreground">Create your workspace</p>
      <div class="mt-5 grid gap-2.5">
        <input
          type="text"
          name="signup-name"
          placeholder="Ada Byte"
          autocomplete="off"
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
        />
        <input
          type="email"
          name="signup-email"
          placeholder="you@dither-ui.com"
          autocomplete="off"
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
        />
        <input
          type="password"
          name="signup-password"
          placeholder="••••••••"
          autocomplete="off"
          class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
        />
        <div class="grid grid-cols-3 gap-1 rounded-md border border-border/60 p-1" role="group" aria-label="Plan">
          {#each PLANS as p (p)}
            <button
              type="button"
              aria-pressed={signupPlan === p}
              class="rounded px-2 py-1 text-[11px] transition-colors {signupPlan === p
                ? 'bg-card text-foreground'
                : 'text-muted-foreground hover:text-foreground'}"
              onclick={() => (signupPlan = p)}
            >
              {p}
            </button>
          {/each}
        </div>
        <DitherButton color="purple" variant="gradient" class="w-full py-2 text-[11px]">Create account</DitherButton>
      </div>
    </div>
  </DemoCard>
</section>

<!-- Magic link -->
<section id="magic-link" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Magic link</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    Passwordless in two states — send the link, then echo the address back with a pixel checkmark. Green wash, green button.
  </p>
  <DemoCard code={magicCode}>
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient from="green" to="transparent" direction="up" opacity={0.14} cell={4} renderMode="static" class="-z-10" />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground"></span>
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      {#if !sent}
        <p class="mt-1.5 text-[11px] text-muted-foreground">Sign in without a password</p>
        <div class="mt-5 grid gap-2.5">
          <input
            bind:value={magicEmail}
            type="email"
            name="magic-email"
            placeholder="you@dither-ui.com"
            autocomplete="off"
            class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
          />
          <DitherButton color="green" variant="gradient" class="w-full py-2 text-[11px]" onclick={() => (sent = true)}>Send magic link</DitherButton>
        </div>
      {:else}
        <div class="mt-5 text-center">
          <span class="inline-block" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 10 10" class="text-foreground" shape-rendering="crispEdges">
              <path d="M1 5h1v1H1zM2 6h1v1H2zM3 7h1v1H3zM4 6h1v1H4zM5 5h1v1H5zM6 4h1v1H6zM7 3h1v1H7zM8 2h1v1H8z" fill="currentColor" />
            </svg>
          </span>
          <p class="mt-2 text-[12px] tracking-tight">Check your inbox</p>
          <p class="mt-1 text-[11px] text-muted-foreground">
            We sent a link to {magicEmail || "your email"}
          </p>
          <button
            type="button"
            class="mt-4 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            onclick={() => {
              sent = false
              magicEmail = ""
            }}
          >
            use a different email
          </button>
        </div>
      {/if}
    </div>
  </DemoCard>
</section>

<!-- Two-factor -->
<section id="twofactor" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Two-factor</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    Six code cells with auto-advancing focus — plain inputs, token borders, blue wash behind.
  </p>
  <DemoCard code={twofactorCode}>
    <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
      <DitherGradient from="blue" to="transparent" direction="up" opacity={0.14} cell={4} renderMode="static" class="-z-10" />
      <div class="flex items-center gap-2">
        <span class="inline-block size-2.5 rounded-[2px] bg-foreground"></span>
        <span class="text-[12px] tracking-tight">dither-ui</span>
      </div>
      <p class="mt-1.5 text-[11px] text-muted-foreground">Enter the code from your authenticator</p>
      <div class="mt-5 grid gap-2.5">
        <div class="flex justify-between gap-2" role="group" aria-label="Verification code">
          {#each Array(6) as _, i (i)}
            <input
              bind:this={codeInputs[i]}
              type="text"
              maxlength="1"
              inputmode="numeric"
              name={`twofactor-digit-${i + 1}`}
              autocomplete="off"
              aria-label={`Digit ${i + 1}`}
              class="h-11 w-9 rounded-md border border-border bg-background/60 text-center text-[13px] text-foreground outline-none focus:border-accent/60"
              oninput={() => onCodeInput(i)}
            />
          {/each}
        </div>
        <DitherButton color="blue" variant="gradient" class="w-full py-2 text-[11px]">Verify</DitherButton>
      </div>
      <p class="mt-4 text-center">
        <button type="button" class="text-[10px] text-muted-foreground transition-colors hover:text-foreground">
          resend in 24s
        </button>
      </p>
    </div>
  </DemoCard>
</section>

<!-- Pricing -->
<section id="pricing" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Pricing</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    Three tiers from tokens and kit primitives — the popular plan gets a dither wash, nothing else shouts.
  </p>
  <DemoCard code={pricingCode}>
    <div class="grid gap-4 text-left sm:grid-cols-3">
      {#each TIERS as tier (tier.name)}
        <div class="relative isolate flex flex-col overflow-hidden rounded-lg border border-border/60 p-4">
          {#if tier.popular}
            <DitherGradient from="blue" opacity={0.12} cell={4} renderMode="static" class="-z-10" />
          {/if}
          <div class="flex items-center justify-between">
            <span class="text-[11px] text-muted-foreground">{tier.name}</span>
            {#if tier.popular}
              <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">popular</span>
            {/if}
          </div>
          <div class="mt-2 text-lg tracking-tight tabular-nums">
            {tier.price}<span class="text-[11px] text-muted-foreground">/mo</span>
          </div>
          <div class="text-[10px] text-muted-foreground">{tier.blurb}</div>
          <ul class="mt-4 grid gap-1.5">
            {#each tier.features as f (f)}
              <li class="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span class="size-1.5 shrink-0 bg-foreground/40"></span>
                {f}
              </li>
            {/each}
          </ul>
          <DitherButton variant={tier.cta.variant} color={tier.cta.color} class="mt-4 w-full py-2 text-[11px]">
            {tier.cta.label}
          </DitherButton>
        </div>
      {/each}
    </div>
  </DemoCard>
</section>

<!-- Activity feed -->
<section id="activity" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Activity feed</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    A team feed — deterministic avatars, one accent dot per unread row, times right-aligned.
  </p>
  <DemoCard code={activityCode}>
    <div class="mx-auto max-w-md rounded-lg border border-border/60 text-left">
      <div class="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <span class="text-[11px] text-muted-foreground">dither-ui · activity</span>
        <span class="text-[11px] tabular-nums text-muted-foreground">today</span>
      </div>
      {#each FEED as row, i (row.name)}
        <div class="flex items-center gap-3 px-4 py-2.5 {i > 0 ? 'border-t border-border/40' : ''}">
          <DitherAvatar name={row.name} size={24} animate={false} />
          <span class="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
            <span class="text-foreground/90">{row.name}</span>
            {row.text}
          </span>
          {#if row.unread}
            <span class="size-1.5 shrink-0 rounded-full" style:background-color={cssColor("blue")}></span>
          {/if}
          <span class="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{row.time}</span>
        </div>
      {/each}
    </div>
  </DemoCard>
</section>

<!-- Changelog -->
<section id="changelog" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Changelog</h2>
  <p class="mt-3 text-[13px] text-muted-foreground">
    A release timeline — square markers on a thin rail, the newest release seeded green.
  </p>
  <DemoCard code={changelogCode}>
    <div class="mx-auto max-w-md text-left">
      {#each RELEASES as r, i (r.version)}
        <div class="flex gap-3">
          <div class="flex flex-col items-center">
            <span
              class="mt-1 size-2 shrink-0 rounded-[2px] {i === 0 ? '' : 'bg-border'}"
              style:background-color={i === 0 ? cssColor("green") : undefined}
            ></span>
            {#if i < RELEASES.length - 1}
              <span class="w-px flex-1 bg-border/60"></span>
            {/if}
          </div>
          <div class={i < RELEASES.length - 1 ? "pb-6" : ""}>
            <div class="flex items-baseline gap-2">
              <span class="text-[11px] text-foreground/90">{r.version}</span>
              <span class="text-[10px] text-muted-foreground">{r.date}</span>
            </div>
            <div class="mt-0.5 text-[13px] tracking-tight">{r.title}</div>
            {#if r.tags.length}
              <div class="mt-2 flex gap-1.5">
                {#each r.tags as tag (tag)}
                  <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </DemoCard>
</section>
