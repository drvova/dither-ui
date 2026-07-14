<script setup lang="ts">
import { ref } from "vue"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  DitherAvatar,
  DitherButton,
  DitherGradient,
  Grid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Sparkline,
  Tooltip,
  XAxis,
  YAxis,
} from "./components/dither-kit"
import ChartCard from "./marketing/ChartCard.vue"
import {
  avatarNames,
  marketConfig,
  marketData,
  revenueConfig,
  revenueData,
  skillConfig,
  skillData,
  sparkSeries,
  trafficConfig,
  trafficData,
} from "./marketing/demo-data"

const INSTALL = "npx @dither-kit/cli add area-chart"
const copied = ref(false)
async function copyInstall() {
  try {
    await navigator.clipboard.writeText(INSTALL)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1400)
  } catch {
    copied.value = false
  }
}

const buttonVariants = ["gradient", "dotted", "hatched", "solid"] as const
</script>

<template>
  <div class="min-h-screen bg-background font-mono text-foreground antialiased">
    <!-- Nav -->
    <header
      class="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur"
    >
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div class="flex items-center gap-2">
          <span class="inline-block size-3 rounded-[2px] bg-foreground" />
          <span class="text-sm tracking-tight">Dither Kit</span>
          <span
            class="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
            >Vue</span
          >
        </div>
        <nav class="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="#charts" class="hidden transition-colors hover:text-foreground sm:inline">Charts</a>
          <a href="#primitives" class="hidden transition-colors hover:text-foreground sm:inline">Primitives</a>
          <a
            href="https://github.com/Boring-Software-Inc/dither-kit"
            class="transition-colors hover:text-foreground"
            >GitHub</a
          >
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-border">
      <DitherGradient from="blue" direction="up" :opacity="0.5" bloom="low" />
      <div class="relative mx-auto max-w-6xl px-5 pb-16 pt-20">
        <p class="mb-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Ordered-dither charts · Inspired by Evil Charts
        </p>
        <h1
          class="max-w-3xl text-balance text-4xl leading-[1.05] tracking-tight sm:text-6xl"
        >
          Dithered charts &amp; primitives for Vue.
        </h1>
        <p class="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A faithful Vue 3 port of Dither Kit — composable area, line, bar, pie
          and radar charts on one tiny canvas engine, plus generative avatars,
          buttons and gradient washes. Copy in the components you need.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="group flex items-center gap-3 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-colors hover:border-foreground/30"
            @click="copyInstall"
          >
            <span class="text-muted-foreground">$</span>
            <span>{{ INSTALL }}</span>
            <span class="text-muted-foreground">{{ copied ? "copied" : "copy" }}</span>
          </button>
          <DitherButton color="blue" variant="gradient" bloom="low"
            >Get started</DitherButton
          >
          <DitherButton color="purple" variant="hatched">Components</DitherButton>
        </div>

        <!-- Hero chart -->
        <div
          class="relative mt-14 h-[340px] w-full rounded-xl border border-border bg-card/40 p-5"
        >
          <AreaChart
            :data="trafficData"
            :config="trafficConfig"
            bloom="low"
            bloom-on-hover
            default-selected-data-key="desktop"
          >
            <Grid />
            <XAxis dataKey="month" />
            <YAxis />
            <Area dataKey="desktop" is-clickable />
            <Area dataKey="mobile" variant="hatched" is-clickable />
            <Legend is-clickable />
            <Tooltip labelKey="month" />
          </AreaChart>
        </div>
      </div>
    </section>

    <!-- Charts gallery -->
    <section id="charts" class="mx-auto max-w-6xl px-5 py-16">
      <div class="mb-8 flex items-end justify-between">
        <div>
          <h2 class="text-2xl tracking-tight">Charts</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Composable, children-as-config. Hover to scrub, click a series to
            focus.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="AreaChart" subtitle="Stacked dithered fill" tag="area">
          <AreaChart
            :data="trafficData"
            :config="trafficConfig"
            stack-type="stacked"
            bloom="low"
          >
            <Grid />
            <XAxis dataKey="month" />
            <YAxis />
            <Area dataKey="mobile" is-clickable />
            <Area dataKey="desktop" is-clickable />
            <Legend is-clickable />
            <Tooltip labelKey="month" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="LineChart" subtitle="Bright line with dither glow" tag="line">
          <LineChart :data="trafficData" :config="trafficConfig">
            <Grid />
            <XAxis dataKey="month" />
            <YAxis />
            <Line dataKey="desktop" is-clickable />
            <Line dataKey="mobile" is-clickable />
            <Legend is-clickable />
            <Tooltip labelKey="month" />
          </LineChart>
        </ChartCard>

        <ChartCard title="BarChart" subtitle="Grouped, staggered grow-in" tag="bar">
          <BarChart :data="revenueData" :config="revenueConfig" bloom="low">
            <Grid />
            <XAxis dataKey="quarter" />
            <YAxis />
            <Bar dataKey="product" is-clickable />
            <Bar dataKey="services" is-clickable />
            <Legend is-clickable />
            <Tooltip labelKey="quarter" />
          </BarChart>
        </ChartCard>

        <ChartCard title="BarChart" subtitle="Stacked variant" tag="stacked">
          <BarChart
            :data="revenueData"
            :config="revenueConfig"
            stack-type="stacked"
          >
            <Grid />
            <XAxis dataKey="quarter" />
            <YAxis />
            <Bar dataKey="product" variant="hatched" is-clickable />
            <Bar dataKey="services" is-clickable />
            <Legend is-clickable />
            <Tooltip labelKey="quarter" />
          </BarChart>
        </ChartCard>

        <ChartCard title="PieChart" subtitle="Donut, clockwise sweep-in" tag="pie">
          <PieChart
            :data="marketData"
            :config="marketConfig"
            data-key="value"
            name-key="name"
            :inner-radius="0.55"
            bloom="low"
          >
            <Pie />
            <Legend align="center" is-clickable />
            <Tooltip />
          </PieChart>
        </ChartCard>

        <ChartCard title="RadarChart" subtitle="Polygon-membership dither" tag="radar">
          <RadarChart :data="skillData" :config="skillConfig" name-key="axis">
            <Radar dataKey="alpha" is-clickable />
            <Radar dataKey="beta" variant="hatched" is-clickable />
            <Legend align="center" is-clickable />
            <Tooltip />
          </RadarChart>
        </ChartCard>
      </div>

      <!-- Sparklines -->
      <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="(c, i) in (['blue', 'green', 'purple', 'orange'] as const)"
          :key="c"
          class="rounded-xl border border-border bg-card/40 p-4"
        >
          <div class="mb-1 flex items-baseline justify-between">
            <span class="text-[11px] text-muted-foreground">metric {{ i + 1 }}</span>
            <span class="text-sm">{{ sparkSeries[sparkSeries.length - 1] }}k</span>
          </div>
          <div class="h-12 w-full">
            <Sparkline :data="sparkSeries" :color="c" animate bloom-on-hover bloom="low" />
          </div>
        </div>
      </div>
    </section>

    <!-- Primitives -->
    <section id="primitives" class="border-t border-border">
      <div class="mx-auto max-w-6xl px-5 py-16">
        <h2 class="text-2xl tracking-tight">Primitives</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Standalone — install without the chart engine.
        </p>

        <div class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <!-- Buttons -->
          <div class="rounded-xl border border-border bg-card/40 p-5">
            <h3 class="text-sm">DitherButton</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Native button, dither fill, hover &amp; press lift.
            </p>
            <div class="mt-5 flex flex-wrap gap-3">
              <DitherButton
                v-for="v in buttonVariants"
                :key="v"
                :variant="v"
                color="blue"
                bloom="low"
                >{{ v }}</DitherButton
              >
            </div>
          </div>

          <!-- Avatars -->
          <div class="rounded-xl border border-border bg-card/40 p-5">
            <h3 class="text-sm">DitherAvatar</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Generative, deterministic from a name.
            </p>
            <div class="mt-5 flex flex-wrap gap-3">
              <div
                v-for="name in avatarNames"
                :key="name"
                class="flex flex-col items-center gap-1"
                :title="name"
              >
                <DitherAvatar :name="name" :size="44" class="rounded-md" />
              </div>
            </div>
          </div>

          <!-- Gradients -->
          <div class="rounded-xl border border-border bg-card/40 p-5">
            <h3 class="text-sm">DitherGradient</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Background washes — fades &amp; two-tone blends.
            </p>
            <div class="mt-5 grid grid-cols-3 gap-3">
              <div class="relative h-24 overflow-hidden rounded-md border border-border">
                <DitherGradient from="blue" direction="up" />
              </div>
              <div class="relative h-24 overflow-hidden rounded-md border border-border">
                <DitherGradient from="purple" to="pink" direction="down" />
              </div>
              <div class="relative h-24 overflow-hidden rounded-md border border-border">
                <DitherGradient from="green" direction="right" bloom="low" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="relative overflow-hidden border-t border-border">
      <DitherGradient from="purple" direction="up" :opacity="0.35" />
      <div
        class="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-12 sm:flex-row sm:items-center"
      >
        <div class="flex items-center gap-2">
          <span class="inline-block size-3 rounded-[2px] bg-foreground" />
          <span class="text-sm">Dither Kit — Vue</span>
        </div>
        <p class="text-xs text-muted-foreground">
          Vue port of Dither Kit. Charts inspired by Evil Charts (evilcharts.com).
        </p>
      </div>
    </footer>
  </div>
</template>
