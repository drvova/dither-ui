<script lang="ts">
  import { onMount } from "svelte"
  import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Line,
    LineChart,
    Pie,
    PieChart,
    Sparkline,
    Grid,
    XAxis,
    YAxis,
    Legend,
    Tooltip,
    DitherButton,
    DitherAvatar,
    DitherGradient,
    DitherImage,
    DitherInput,
    DitherCheckbox,
    DitherSwitch,
    Aurora,
    Waves,
    Plasma,
    Silk,
    Galaxy,
    Lightning,
    Orb,
    Beams,
    cssColor,
    type DitherColor,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable from "./PropsTable.svelte"

  const GITHUB = "https://github.com/drvova/dither-ui"

  const NAV = [
    { title: "Getting started", items: [{ id: "intro", label: "Introduction" }, { id: "install", label: "Install" }] },
    {
      title: "Charts",
      items: [
        { id: "area", label: "Area" },
        { id: "line", label: "Line" },
        { id: "bar", label: "Bar" },
        { id: "pie", label: "Pie" },
        { id: "sparkline", label: "Sparkline" },
      ],
    },
    {
      title: "Primitives",
      items: [
        { id: "button", label: "Button" },
        { id: "avatar", label: "Avatar" },
        { id: "gradient", label: "Gradient" },
        { id: "image", label: "Image" },
      ],
    },
    { title: "Controls", items: [{ id: "input", label: "Input" }, { id: "checkbox", label: "Checkbox" }, { id: "switch", label: "Switch" }] },
    { title: "Backgrounds", items: [{ id: "backgrounds", label: "Gallery" }] },
    { title: "Utils", items: [{ id: "palette", label: "Palette" }] },
  ]

  // Demo data
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
  const rows = MONTHS.map((month, i) => ({
    month,
    revenue: [42, 51, 48, 63, 71, 68, 79, 86][i],
    expenses: [31, 34, 33, 39, 44, 47, 46, 52][i],
  }))
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
  const spark = Array.from({ length: 24 }, (_, i) => 10 + i * 0.3 + Math.sin(i * 0.8) * 2)
  const swatches: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]
  const backgrounds = [
    { id: "Aurora", C: Aurora },
    { id: "Waves", C: Waves },
    { id: "Plasma", C: Plasma },
    { id: "Silk", C: Silk },
    { id: "Galaxy", C: Galaxy },
    { id: "Lightning", C: Lightning },
    { id: "Orb", C: Orb },
    { id: "Beams", C: Beams },
  ]

  let email = $state("")
  let subscribed = $state(true)
  let dark = $state(false)

  let activeId = $state("intro")

  const buttonRows = [
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: '"gradient"' },
    { prop: "seed", type: "number", default: "—" },
    { prop: "loading", type: "boolean", default: "false" },
    { prop: "disabled", type: "boolean", default: "false" },
  ]
  const chartRows = [
    { prop: "data", type: "Row[]", default: "required" },
    { prop: "config", type: "ChartConfig", default: "required" },
    { prop: "seed", type: "number", default: "—" },
    { prop: "animate", type: "boolean", default: "true" },
    { prop: "interactive", type: "boolean", default: "true" },
  ]

  function go(id: string) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })
    history.replaceState(null, "", `#/docs/${id}`)
  }

  onMount(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) {
          activeId = vis[0].target.id
          history.replaceState(null, "", `#/docs/${activeId}`)
        }
      },
      { rootMargin: "-8% 0px -70% 0px" }
    )
    document.querySelectorAll("section[id]").forEach((s) => io.observe(s))
    const deep = location.hash.replace(/^#\/docs\/?/, "")
    if (deep) requestAnimationFrame(() => document.getElementById(deep)?.scrollIntoView())
    return () => io.disconnect()
  })

  const areaCode = `<AreaChart {data} {config} seed={7}>
  <Grid /><XAxis dataKey="month" /><YAxis />
  <Area dataKey="revenue" />
  <Area dataKey="expenses" />
  <Legend /><Tooltip />
</AreaChart>`
  const barCode = `<BarChart {data} {config} seed={4}>
  <Grid /><XAxis dataKey="month" /><YAxis />
  <Bar dataKey="revenue" />
  <Bar dataKey="expenses" />
  <Legend />
</BarChart>`
  const lineCode = `<LineChart {data} {config} seed={3}>
  <Grid /><XAxis dataKey="month" /><YAxis />
  <Line dataKey="revenue" />
  <Line dataKey="expenses" />
  <Legend /><Tooltip />
</LineChart>`
  const pieCode = `<PieChart data={pieRows} config={pieConfig} dataKey="value" nameKey="name" seed={9}>
  <Pie />
  <Legend />
</PieChart>`
  const sparkCode = `<Sparkline data={spark} color="green" seed={2} />`
  const buttonCode = `<DitherButton color="blue" variant="gradient">Save</DitherButton>
<DitherButton color="green" variant="solid">Run</DitherButton>
<DitherButton seed={42}>Seeded</DitherButton>
<DitherButton loading>Saving</DitherButton>`
  const avatarCode = `<DitherAvatar name="ada" />
<DitherAvatar name="grace" size={40} />`
  const gradientCode = `<div class="relative h-40">
  <DitherGradient seed={7} class="absolute inset-0" />
</div>`
  const imageCode = `<DitherImage src="/faces.webp" class="h-40 w-40" />`
  const inputCode = `<script>
  let email = $state("")
<\/script>
<DitherInput bind:value={email} type="email" placeholder="you@site.dev" />`
  const checkboxCode = `<DitherCheckbox bind:value={subscribed} />`
  const switchCode = `<DitherSwitch bind:value={dark} />`
</script>

<div class="min-h-screen bg-background font-mono text-foreground antialiased">
  <!-- Header -->
  <header class="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
    <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 text-xs">
      <a href="#/" class="tracking-tight transition-colors hover:text-foreground">dither-ui <span class="text-muted-foreground">/ svelte</span></a>
      <nav class="flex items-center gap-5 text-muted-foreground">
        <a href="#/" class="-m-3 p-3 transition-colors hover:text-foreground">home</a>
        <a href={GITHUB} target="_blank" rel="noreferrer" class="-m-3 p-3 transition-colors hover:text-foreground">github</a>
      </nav>
    </div>
  </header>

  <div class="mx-auto flex w-full max-w-6xl gap-10 px-6">
    <!-- Sidebar -->
    <aside class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 pr-4 lg:block">
      <nav class="grid gap-7">
        {#each NAV as group (group.title)}
          <div>
            <p class="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">{group.title}</p>
            <ul class="grid gap-0.5">
              {#each group.items as item (item.id)}
                <li>
                  <a
                    href="#/docs/{item.id}"
                    onclick={(e) => { e.preventDefault(); go(item.id) }}
                    class="block rounded px-2 py-1 text-[12px] transition-colors {activeId === item.id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'}"
                  >
                    {item.label}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </nav>
    </aside>

    <!-- Content -->
    <main class="min-w-0 flex-1 py-12">
      <section id="intro" class="scroll-mt-20">
        <h1 class="text-2xl tracking-tight">dither-ui for Svelte</h1>
        <p class="mt-4 max-w-xl text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
          A dithered UI toolkit — charts, buttons, avatars, gradients and generative
          backgrounds rendered pixel by pixel on canvas. Every component is Svelte 5
          runes, no legacy API, reduced-motion aware.
        </p>
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <DitherButton color="blue" variant="gradient" onclick={() => go("area")}>Explore charts</DitherButton>
          <DitherButton color="green" variant="solid" onclick={() => go("backgrounds")}>Backgrounds</DitherButton>
        </div>
      </section>

      <section id="install" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Install</h2>
        <p class="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Copy the <code class="text-foreground/80">dither-kit-svelte</code> folder into your project
          and alias it, then import from its <code class="text-foreground/80">index.ts</code>.
        </p>
        <DemoCard code={`import { AreaChart, Area, DitherButton } from "@dither-kit-svelte"`}>
          <p class="text-center text-[12px] text-muted-foreground">Portable — copy the folder, alias it, import from <code>index.ts</code>.</p>
        </DemoCard>
      </section>

      <!-- Charts -->
      <section id="area" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Area chart</h2>
        <p class="mt-3 text-[13px] text-muted-foreground">Composed from parts; the fill is dithered per cell.</p>
        <DemoCard code={areaCode}>
          <div class="h-64">
            <AreaChart data={rows} {config} seed={7}>
              <Grid /><XAxis dataKey="month" /><YAxis />
              <Area dataKey="revenue" />
              <Area dataKey="expenses" />
              <Legend /><Tooltip />
            </AreaChart>
          </div>
        </DemoCard>
        <PropsTable rows={chartRows} />
      </section>

      <section id="line" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Line chart</h2>
        <DemoCard code={lineCode}>
          <div class="h-64">
            <LineChart data={rows} {config} seed={3}>
              <Grid /><XAxis dataKey="month" /><YAxis />
              <Line dataKey="revenue" />
              <Line dataKey="expenses" />
              <Legend /><Tooltip />
            </LineChart>
          </div>
        </DemoCard>
      </section>

      <section id="bar" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Bar chart</h2>
        <DemoCard code={barCode}>
          <div class="h-64">
            <BarChart data={rows} {config} seed={4}>
              <Grid /><XAxis dataKey="month" /><YAxis />
              <Bar dataKey="revenue" />
              <Bar dataKey="expenses" />
              <Legend />
            </BarChart>
          </div>
        </DemoCard>
      </section>

      <section id="pie" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Pie chart</h2>
        <DemoCard code={pieCode}>
          <div class="h-64">
            <PieChart data={pieRows} config={pieConfig} dataKey="value" nameKey="name" seed={9}>
              <Pie />
              <Legend />
            </PieChart>
          </div>
        </DemoCard>
      </section>

      <section id="sparkline" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Sparkline</h2>
        <p class="mt-3 text-[13px] text-muted-foreground">A plain number series — the common inline case.</p>
        <DemoCard code={sparkCode}>
          <div class="mx-auto h-16 w-64">
            <Sparkline data={spark} color="green" seed={2} />
          </div>
        </DemoCard>
      </section>

      <!-- Primitives -->
      <section id="button" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Button</h2>
        <p class="mt-3 text-[13px] text-muted-foreground">Every fill is drawn on canvas; hover raises the dither intensity.</p>
        <DemoCard code={buttonCode}>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <DitherButton color="blue" variant="gradient">Save</DitherButton>
            <DitherButton color="green" variant="solid">Run</DitherButton>
            <DitherButton seed={42}>Seeded</DitherButton>
            <DitherButton loading>Saving</DitherButton>
            <DitherButton disabled>Disabled</DitherButton>
          </div>
        </DemoCard>
        <PropsTable rows={buttonRows} />
      </section>

      <section id="avatar" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Avatar</h2>
        <DemoCard code={avatarCode}>
          <div class="flex flex-wrap items-center justify-center gap-4">
            {#each ["ada", "grace", "linus", "margaret", "alan"] as n (n)}
              <DitherAvatar name={n} size={40} />
            {/each}
          </div>
        </DemoCard>
      </section>

      <section id="gradient" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Gradient</h2>
        <DemoCard code={gradientCode}>
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {#each [7, 42, 1984, 90210] as s (s)}
              <div class="relative h-28 overflow-hidden rounded-md">
                <DitherGradient seed={s} class="absolute inset-0" />
              </div>
            {/each}
          </div>
        </DemoCard>
      </section>

      <section id="image" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Image</h2>
        <p class="mt-3 text-[13px] text-muted-foreground">Any image, re-rendered through the ordered-dither engine.</p>
        <DemoCard code={imageCode}>
          <div class="flex justify-center">
            <div class="h-40 w-40 overflow-hidden rounded-md">
              <DitherImage src="/faces.webp" class="h-full w-full" />
            </div>
          </div>
        </DemoCard>
      </section>

      <!-- Controls -->
      <section id="input" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Input</h2>
        <DemoCard code={inputCode}>
          <div class="mx-auto max-w-xs">
            <DitherInput bind:value={email} type="email" placeholder="you@site.dev" />
            <p class="mt-2 text-[11px] text-muted-foreground">value: {email || "—"}</p>
          </div>
        </DemoCard>
      </section>

      <section id="checkbox" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Checkbox</h2>
        <DemoCard code={checkboxCode}>
          <div class="flex items-center justify-center gap-2 text-[13px]">
            <DitherCheckbox bind:value={subscribed} />
            <span class="text-muted-foreground">Subscribed: {subscribed}</span>
          </div>
        </DemoCard>
      </section>

      <section id="switch" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Switch</h2>
        <DemoCard code={switchCode}>
          <div class="flex items-center justify-center gap-2 text-[13px]">
            <DitherSwitch bind:value={dark} />
            <span class="text-muted-foreground">Dark mode: {dark}</span>
          </div>
        </DemoCard>
      </section>

      <!-- Backgrounds -->
      <section id="backgrounds" class="mt-20 scroll-mt-20">
        <h2 class="text-lg tracking-tight">Backgrounds</h2>
        <p class="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          53 generative surfaces — WebGL-free canvas + Bayer dithering, self-sizing,
          pointer-reactive where it helps. Pass a <code class="text-foreground/80">seed</code> for a deterministic look.
        </p>
        <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {#each backgrounds as b (b.id)}
            <div class="relative h-32 overflow-hidden rounded-md border border-border/60">
              <b.C seed={7} class="absolute inset-0" />
              <span class="absolute bottom-1.5 left-2 text-[10px] text-white/80 mix-blend-difference">{b.id}</span>
            </div>
          {/each}
        </div>
      </section>

      <!-- Palette -->
      <section id="palette" class="mt-20 scroll-mt-20 pb-24">
        <h2 class="text-lg tracking-tight">Palette</h2>
        <p class="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          Seven seeds; fill, line and sparkle hues resolve from the same source via
          <code class="text-foreground/80">cssColor(name)</code>.
        </p>
        <DemoCard code={`import { cssColor } from "@dither-kit-svelte"\ncssColor("blue") // "rgb(53, 143, 243)"`}>
          <div class="flex flex-wrap items-center justify-center gap-3">
            {#each swatches as c (c)}
              <div class="flex flex-col items-center gap-1.5">
                <span class="size-8 rounded-[4px]" style:background-color={cssColor(c)}></span>
                <span class="text-[10px] text-muted-foreground">{c}</span>
              </div>
            {/each}
          </div>
        </DemoCard>
      </section>
    </main>
  </div>
</div>
