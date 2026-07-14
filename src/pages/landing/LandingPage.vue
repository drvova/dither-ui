<script setup lang="ts">
import {
  DitherAvatar,
  DitherButton,
  DitherGradient,
  Sparkline,
  type DitherColor,
} from "@dither-kit"

// One deterministic wave per palette color — the kit demos itself.
const wave = (seed: number): number[] =>
  Array.from({ length: 24 }, (_, i) => 4 + Math.sin(i * 0.55 + seed) * 2 + Math.sin(i * 1.3 + seed * 2) * 1.2)

const series: { color: DitherColor; data: number[] }[] = [
  { color: "green", data: wave(1) },
  { color: "blue", data: wave(2) },
  { color: "purple", data: wave(3) },
  { color: "orange", data: wave(4) },
]
</script>

<template>
  <div class="min-h-screen bg-background font-mono text-foreground antialiased">
    <div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6">
      <!-- Header -->
      <header class="flex h-14 items-center justify-between text-xs">
        <span class="tracking-tight">dither-kit</span>
        <a
          href="#/studio"
          class="text-muted-foreground transition-colors hover:text-foreground"
        >studio →</a>
      </header>

      <!-- Hero -->
      <main class="flex flex-1 flex-col justify-center py-16">
        <section class="relative isolate overflow-hidden rounded-lg border border-border/60 px-8 py-16">
          <DitherGradient from="blue" direction="up" :opacity="0.35" class="-z-10" />
          <h1 class="max-w-md text-2xl leading-snug tracking-tight text-balance">
            Dithered charts, buttons and avatars for Vue.
          </h1>
          <p class="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Canvas-rendered, ordered-dither components. No SVG soup, no chart
            framework — just pixels.
          </p>
          <div class="mt-8 flex items-center gap-4">
            <a href="#/studio">
              <DitherButton color="blue" variant="gradient" class="px-5 py-2.5">
                Open studio
              </DitherButton>
            </a>
            <a
              href="https://github.com"
              class="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >source</a>
          </div>
        </section>

        <!-- Live proof: the kit rendering itself -->
        <section class="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            v-for="s in series"
            :key="s.color"
            class="rounded-md border border-border/60 p-3"
          >
            <Sparkline :data="s.data" :color="s.color" animate class="h-12 w-full" />
            <div class="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              {{ s.color }}
            </div>
          </div>
        </section>

        <section class="mt-4 flex flex-wrap items-center gap-4 rounded-md border border-border/60 p-4">
          <DitherButton color="green" variant="solid">solid</DitherButton>
          <DitherButton color="purple" variant="dotted">dotted</DitherButton>
          <DitherButton color="orange" variant="hatched">hatched</DitherButton>
          <div class="ml-auto flex items-center gap-2">
            <DitherAvatar v-for="n in ['ada', 'linus', 'grace']" :key="n" :name="n" :size="32" />
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="flex h-14 items-center justify-between text-[10px] text-muted-foreground">
        <span>dither-kit — vue port</span>
        <span>MIT</span>
      </footer>
    </div>
  </div>
</template>
