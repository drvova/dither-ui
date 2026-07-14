<script setup lang="ts">
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  cssColor,
  DitherAvatar,
  DitherButton,
  DitherGradient,
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
  type DitherColor,
} from "@dither-kit"
import { CodeBlock } from "@/shared/ui"
import DemoCard from "./DemoCard.vue"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
const rows = MONTHS.map((month, i) => ({
  month,
  desktop: 12 + Math.sin(i * 0.9) * 5 + i,
  mobile: 8 + Math.cos(i * 0.7) * 4 + i * 0.6,
}))
const config = {
  desktop: { label: "Desktop", color: "blue" as DitherColor },
  mobile: { label: "Mobile", color: "purple" as DitherColor },
}

const pieRows = [
  { name: "green", value: 32 },
  { name: "blue", value: 26 },
  { name: "purple", value: 22 },
  { name: "orange", value: 20 },
]
const pieConfig = {
  green: { color: "green" as DitherColor },
  blue: { color: "blue" as DitherColor },
  purple: { color: "purple" as DitherColor },
  orange: { color: "orange" as DitherColor },
}

const radarConfig = {
  a: { label: "dither-ui", color: "blue" as DitherColor },
  b: { label: "the other guys", color: "grey" as DitherColor },
}
const radarRows = [
  { axis: "speed", a: 8, b: 5 },
  { axis: "craft", a: 9, b: 7 },
  { axis: "size", a: 6, b: 8 },
  { axis: "charm", a: 9, b: 6 },
  { axis: "docs", a: 7, b: 7 },
]

const spark = Array.from({ length: 24 }, (_, i) => 4 + Math.sin(i * 0.55) * 2 + Math.sin(i * 1.3) * 1.2)

const COLORS: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]

const GROUPS = [
  { title: "Getting started", items: [{ id: "getting-started", label: "Installation" }] },
  {
    title: "Charts",
    items: [
      { id: "area", label: "Area Chart" },
      { id: "line", label: "Line Chart" },
      { id: "bar", label: "Bar Chart" },
      { id: "pie", label: "Pie Chart" },
      { id: "radar", label: "Radar Chart" },
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
  { title: "Tokens", items: [{ id: "palette", label: "Palette" }] },
]

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

const SNIPPETS = {
  install: `// Copy the dither-kit/ folder into your project, then alias it:
// vite.config.ts  →  "@dither-kit": "./dither-kit"
import { AreaChart, Area, DitherButton } from "@dither-kit"`,
  area: `<AreaChart :data="rows" :config="config">
  <Grid horizontal />
  <XAxis data-key="month" />
  <Area data-key="desktop" variant="gradient" />
  <Area data-key="mobile" variant="dotted" />
  <Tooltip label-key="month" />
</AreaChart>`,
  line: `<LineChart :data="rows" :config="config">
  <XAxis data-key="month" />
  <Line data-key="desktop" />
  <Line data-key="mobile" />
</LineChart>`,
  bar: `<BarChart :data="rows" :config="config" stack-type="stacked">
  <XAxis data-key="month" />
  <Bar data-key="desktop" />
  <Bar data-key="mobile" />
</BarChart>`,
  pie: `<PieChart :data="pieRows" :config="pieConfig"
  data-key="value" name-key="name" :inner-radius="0.55">
  <Pie variant="gradient" />
</PieChart>`,
  radar: `<RadarChart :data="radarRows" :config="config" name-key="axis">
  <Radar data-key="a" />
  <Radar data-key="b" />
</RadarChart>`,
  sparkline: `<Sparkline :data="values" color="green" class="h-10 w-40" />`,
  button: `<DitherButton color="blue" variant="gradient">Save</DitherButton>
<DitherButton color="green" variant="solid">Run</DitherButton>
<DitherButton color="purple" variant="dotted">Mix</DitherButton>
<DitherButton color="orange" variant="hatched">Stop</DitherButton>`,
  avatar: `<DitherAvatar name="ada" :size="40" />
<DitherAvatar name="grace" :size="40" bloom="low" />`,
  gradient: `<div class="relative h-40">
  <DitherGradient from="blue" to="transparent" direction="up" />
</div>`,
  image: `<DitherImage src="/art.png" :cell="4" :fade="96" class="h-72" />
<!-- cell: px per dither cell · fade: dithered edge dissolve
     focus-y: cover-crop focus (0 top … 1 bottom) -->`,
  palette: `import { cssColor, type DitherColor } from "@dither-kit"
cssColor("blue") // rgb(53,143,243)`,
}
</script>

<template>
  <div class="min-h-screen bg-background font-mono text-foreground antialiased">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 text-xs">
        <div class="flex items-center gap-6">
          <a href="#" class="tracking-tight transition-colors hover:text-foreground">dither-ui</a>
          <span class="hidden text-muted-foreground sm:inline">docs</span>
        </div>
        <nav class="flex items-center gap-5 text-muted-foreground">
          <a href="#/studio" class="-m-3 p-3 transition-colors hover:text-foreground">studio →</a>
        </nav>
      </div>
    </header>

    <div class="mx-auto flex w-full max-w-6xl px-6">
      <!-- Sidebar -->
      <aside class="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-52 shrink-0 overflow-y-auto py-10 pr-8 lg:block">
        <nav class="grid gap-7">
          <div v-for="grp in GROUPS" :key="grp.title">
            <div class="text-[11px] font-medium text-foreground">{{ grp.title }}</div>
            <ul class="mt-2.5 grid gap-1.5 border-l border-border/60">
              <li v-for="it in grp.items" :key="it.id">
                <a
                  :href="`#/docs`"
                  class="-ml-px block border-l border-transparent py-0.5 pl-3 text-[11px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  @click.prevent="scrollTo(it.id)"
                >{{ it.label }}</a>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <!-- Content -->
      <main class="min-w-0 flex-1 pb-24 lg:pl-10">
        <div class="max-w-2xl">
          <h1 class="mt-12 text-2xl tracking-tight">Components</h1>
          <p class="mt-3 text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Every component draws on canvas through the same ordered-dither engine.
            Compose charts from parts, or drop in a single primitive.
          </p>

          <!-- Mobile nav -->
          <nav class="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground lg:hidden">
            <a v-for="it in GROUPS.flatMap((g) => g.items)" :key="it.id" href="#/docs" class="transition-colors hover:text-foreground" @click.prevent="scrollTo(it.id)">
              {{ it.label }}
            </a>
          </nav>

          <!-- Installation -->
          <section id="getting-started" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Installation</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              The kit is a folder, not a package — copy
              <code class="text-foreground/80">dither-kit/</code> in and alias it.
              Vue 3, Tailwind, d3-scale and d3-shape are the only dependencies.
            </p>
            <div class="mt-5"><CodeBlock :code="SNIPPETS.install" /></div>
          </section>

          <!-- Area -->
          <section id="area" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Area Chart</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Stacked, dithered area series. <code class="text-foreground/80">variant</code>: gradient · dotted · hatched · solid,
              <code class="text-foreground/80">stack-type</code>: default · stacked · percent.
            </p>
            <DemoCard :code="SNIPPETS.area">
              <div class="h-56">
                <AreaChart :data="rows" :config="config">
                  <Grid horizontal />
                  <XAxis data-key="month" />
                  <Area data-key="desktop" variant="gradient" />
                  <Area data-key="mobile" variant="dotted" />
                  <Tooltip label-key="month" />
                </AreaChart>
              </div>
            </DemoCard>
          </section>

          <!-- Line -->
          <section id="line" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Line Chart</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Bright series lines with star sparkles on the live edge.
            </p>
            <DemoCard :code="SNIPPETS.line">
              <div class="h-56">
                <LineChart :data="rows" :config="config">
                  <XAxis data-key="month" />
                  <Line data-key="desktop" />
                  <Line data-key="mobile" />
                  <Tooltip label-key="month" />
                </LineChart>
              </div>
            </DemoCard>
          </section>

          <!-- Bar -->
          <section id="bar" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Bar Chart</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Grouped or stacked columns, dithered per cell.
            </p>
            <DemoCard :code="SNIPPETS.bar">
              <div class="h-56">
                <BarChart :data="rows" :config="config" stack-type="stacked">
                  <XAxis data-key="month" />
                  <Bar data-key="desktop" />
                  <Bar data-key="mobile" />
                  <Tooltip label-key="month" />
                </BarChart>
              </div>
            </DemoCard>
          </section>

          <!-- Pie -->
          <section id="pie" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Pie Chart</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Slices from the shared palette; <code class="text-foreground/80">inner-radius</code> turns it into a donut.
            </p>
            <DemoCard :code="SNIPPETS.pie">
              <div class="h-56">
                <PieChart :data="pieRows" :config="pieConfig" data-key="value" name-key="name" :inner-radius="0.55">
                  <Pie variant="gradient" />
                </PieChart>
              </div>
            </DemoCard>
          </section>

          <!-- Radar -->
          <section id="radar" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Radar Chart</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Polar comparison across axes, same dither texture.
            </p>
            <DemoCard :code="SNIPPETS.radar">
              <div class="h-64">
                <RadarChart :data="radarRows" :config="radarConfig" name-key="axis">
                  <Radar data-key="a" />
                  <Radar data-key="b" />
                </RadarChart>
              </div>
            </DemoCard>
          </section>

          <!-- Sparkline -->
          <section id="sparkline" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Sparkline</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              A plain numeric series, zero margins — for table cells and stat rows.
            </p>
            <DemoCard :code="SNIPPETS.sparkline">
              <div class="flex items-end justify-center gap-6">
                <Sparkline :data="spark" color="green" class="h-10 w-40" />
                <Sparkline :data="spark.map((v, i) => v + Math.cos(i))" color="pink" variant="dotted" class="h-10 w-40" />
              </div>
            </DemoCard>
          </section>

          <!-- Button -->
          <section id="button" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Button</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Canvas-filled button; density lifts on hover, blooms on press.
            </p>
            <DemoCard :code="SNIPPETS.button">
              <div class="flex flex-wrap justify-center gap-3">
                <DitherButton color="blue" variant="gradient">Save</DitherButton>
                <DitherButton color="green" variant="solid">Run</DitherButton>
                <DitherButton color="purple" variant="dotted">Mix</DitherButton>
                <DitherButton color="orange" variant="hatched">Stop</DitherButton>
              </div>
            </DemoCard>
          </section>

          <!-- Avatar -->
          <section id="avatar" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Avatar</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Deterministic identicon — the same name always draws the same face.
            </p>
            <DemoCard :code="SNIPPETS.avatar">
              <div class="flex items-center justify-center gap-3">
                <DitherAvatar v-for="n in ['ada', 'linus', 'grace', 'alan', 'edsger']" :key="n" :name="n" :size="40" />
              </div>
            </DemoCard>
          </section>

          <!-- Gradient -->
          <section id="gradient" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Gradient</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              A background wash that fades through the Bayer matrix instead of alpha.
            </p>
            <DemoCard :code="SNIPPETS.gradient">
              <div class="relative h-40 overflow-hidden rounded-md">
                <DitherGradient from="blue" to="transparent" direction="up" />
              </div>
            </DemoCard>
          </section>

          <!-- Image -->
          <section id="image" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Image</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Ordered-dithers any image into chunky cells; edges can dissolve into the page.
            </p>
            <div class="mt-5"><CodeBlock :code="SNIPPETS.image" /></div>
          </section>

          <!-- Palette -->
          <section id="palette" class="mt-16 scroll-mt-24">
            <h2 class="text-lg tracking-tight">Palette</h2>
            <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Seven seeded colors; every component resolves fill, line and sparkle hues from the same seed.
            </p>
            <DemoCard :code="SNIPPETS.palette">
              <div class="flex flex-wrap justify-center gap-4">
                <div v-for="c in COLORS" :key="c" class="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span class="size-4 rounded-[3px]" :style="{ backgroundColor: cssColor(c) }" />
                  {{ c }}
                </div>
              </div>
            </DemoCard>
          </section>
        </div>
      </main>
    </div>

    <!-- Footer -->
    <footer class="border-t border-border/60">
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 text-[11px] text-muted-foreground">
        <a href="#" class="transition-colors hover:text-foreground">← dither-ui.com</a>
        <span>MIT</span>
      </div>
    </footer>
  </div>
</template>
