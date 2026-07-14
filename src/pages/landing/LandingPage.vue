<script setup lang="ts">
import {
  Area,
  AreaChart,
  DitherAvatar,
  DitherButton,
  DitherGradient,
  Sparkline,
  Tooltip,
  XAxis,
  type DitherColor,
} from "@dither-kit"

// Deterministic demo series — the product renders its own hero visual.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const curve = (seed: number, lift: number) =>
  4 + lift + Math.sin(seed * 0.9) * 2.4 + Math.sin(seed * 2.1 + lift) * 1.3 + seed * 0.35

const heroData = MONTHS.map((month, i) => ({
  month,
  signal: curve(i, 3),
  noise: curve(i + 4, 0),
}))

const heroConfig = {
  signal: { label: "signal", color: "blue" as DitherColor },
  noise: { label: "noise", color: "purple" as DitherColor },
}

const wave = (seed: number): number[] =>
  Array.from({ length: 24 }, (_, i) => 4 + Math.sin(i * 0.55 + seed) * 2 + Math.sin(i * 1.3 + seed * 2) * 1.2)

const series: { color: DitherColor; data: number[] }[] = [
  { color: "green", data: wave(1) },
  { color: "blue", data: wave(2) },
  { color: "purple", data: wave(3) },
  { color: "orange", data: wave(4) },
]

const footerCols = [
  {
    title: "Toolkit",
    links: [
      { label: "Studio", href: "#/studio" },
      { label: "Charts", href: "#/studio" },
      { label: "Components", href: "#/studio" },
    ],
  },
  {
    title: "Site",
    links: [
      { label: "dither-ui.com", href: "https://dither-ui.com" },
      { label: "License — MIT", href: "https://dither-ui.com" },
    ],
  },
]
</script>

<template>
  <div class="min-h-screen bg-background font-mono text-foreground antialiased">
    <!-- Header -->
    <header class="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6 text-xs">
      <span class="tracking-tight">dither-ui</span>
      <a
        href="#/studio"
        class="text-muted-foreground transition-colors hover:text-foreground"
      >studio →</a>
    </header>

    <!-- Hero: full-bleed dither wash, headline left, the kit rendering itself below -->
    <section class="relative isolate overflow-hidden border-b border-border/60">
      <DitherGradient from="blue" direction="up" :opacity="0.22" :cell="4" class="-z-10" />
      <div class="mx-auto w-full max-w-5xl px-6 pt-20 pb-0 sm:pt-28">
        <p class="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          vue · canvas · ordered dither
        </p>
        <h1 class="mt-4 max-w-2xl text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.05] tracking-tight text-balance">
          A dithered UI toolkit for Vue.
        </h1>
        <p class="mt-5 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          Charts, buttons, avatars and gradients rendered pixel by pixel on
          canvas. No SVG soup, no chart framework — just pixels.
        </p>
        <div class="mt-9 flex items-center gap-5">
          <a href="#/studio">
            <DitherButton color="blue" variant="gradient" bloom="low" class="px-6 py-3 text-[13px]">
              Open studio
            </DitherButton>
          </a>
          <a
            href="https://dither-ui.com"
            class="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >dither-ui.com</a>
        </div>

        <!-- Live hero chart: interactive, hover it -->
        <div class="mt-16 h-56 sm:h-72">
          <AreaChart
            :data="heroData"
            :config="heroConfig"
            bloom="low"
            :margins="{ top: 8, right: 0, bottom: 24, left: 0 }"
          >
            <XAxis data-key="month" :max-ticks="6" />
            <Area data-key="noise" variant="dotted" />
            <Area data-key="signal" variant="gradient" />
            <Tooltip label-key="month" />
          </AreaChart>
        </div>
      </div>
    </section>

    <!-- Proof strip: palette + primitives, no cards-in-cards -->
    <main class="mx-auto w-full max-w-5xl px-6">
      <section class="grid grid-cols-2 gap-x-8 gap-y-10 py-16 sm:grid-cols-4">
        <div v-for="s in series" :key="s.color">
          <Sparkline :data="s.data" :color="s.color" animate class="h-12 w-full" />
          <div class="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {{ s.color }}
          </div>
        </div>
      </section>

      <section class="flex flex-wrap items-center gap-4 border-t border-border/60 py-10">
        <DitherButton color="green" variant="solid">solid</DitherButton>
        <DitherButton color="purple" variant="dotted">dotted</DitherButton>
        <DitherButton color="orange" variant="hatched">hatched</DitherButton>
        <div class="ml-auto flex items-center gap-2">
          <DitherAvatar v-for="n in ['ada', 'linus', 'grace']" :key="n" :name="n" :size="32" />
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="relative isolate overflow-hidden border-t border-border/60">
      <DitherGradient from="purple" direction="down" :opacity="0.1" :cell="4" class="-z-10" />
      <div class="mx-auto w-full max-w-5xl px-6 py-14">
        <div class="grid gap-10 sm:grid-cols-[1fr_auto_auto] sm:gap-20">
          <div>
            <span class="text-xs tracking-tight">dither-ui</span>
            <p class="mt-3 max-w-[26ch] text-[11px] leading-relaxed text-muted-foreground">
              Pixel-rendered components for interfaces that refuse to look
              like everyone else's.
            </p>
          </div>
          <nav v-for="col in footerCols" :key="col.title" class="text-[11px]">
            <div class="uppercase tracking-[0.2em] text-muted-foreground">{{ col.title }}</div>
            <ul class="mt-3 space-y-2">
              <li v-for="link in col.links" :key="link.label">
                <a
                  :href="link.href"
                  class="text-foreground/80 transition-colors hover:text-foreground"
                >{{ link.label }}</a>
              </li>
            </ul>
          </nav>
        </div>
        <div class="mt-12 flex items-center justify-between border-t border-border/40 pt-5 text-[10px] text-muted-foreground">
          <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
          <span>rendered pixel by pixel</span>
        </div>
      </div>
    </footer>
  </div>
</template>
