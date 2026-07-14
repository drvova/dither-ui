<script setup lang="ts">
import { computed, onMounted } from "vue"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  type ChartConfig,
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
import CodeBlock from "./marketing/CodeBlock.vue"
import { controls, replay } from "./marketing/controls"
import ControlsPanel from "./marketing/ControlsPanel.vue"
import {
  marketConfig,
  marketData,
  revenueData,
  skillConfig,
  skillData,
  sparkSeries,
  trafficData,
} from "./marketing/demo-data"
import { COMPONENTS, defOf, snippetFor } from "./marketing/registry"
import { useTheme } from "./marketing/useTheme"

const { dark, toggle } = useTheme()

const def = computed(() => defOf(controls.selected))
const code = computed(() => snippetFor(controls.selected))
const installCmd = computed(() => `npx @dither-kit/cli add ${def.value.registry}`)

const groups = computed(() => ({
  Charts: COMPONENTS.filter((c) => c.group === "Charts"),
  Primitives: COMPONENTS.filter((c) => c.group === "Primitives"),
}))

const lineAreaConfig = computed<ChartConfig>(() => ({
  desktop: { label: "Desktop", color: controls.color },
  mobile: { label: "Mobile", color: "purple" },
}))
const barConfig = computed<ChartConfig>(() => ({
  product: { label: "Product", color: controls.color },
  services: { label: "Services", color: "orange" },
}))

function select(id: string) {
  controls.selected = id
  history.replaceState(null, "", `#${id}`)
  replay()
}

onMounted(() => {
  const id = location.hash.slice(1)
  if (id && COMPONENTS.some((c) => c.id === id)) controls.selected = id
})
</script>

<template>
  <div class="min-h-screen bg-background font-mono text-foreground antialiased">
    <!-- Header -->
    <header class="border-b border-border/60">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div class="flex items-center gap-2">
          <span class="inline-block size-3 rounded-[2px] bg-foreground" />
          <span class="text-sm tracking-tight">dither-kit</span>
          <span class="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">playground</span>
        </div>
        <nav class="flex items-center gap-4 text-xs text-muted-foreground">
          <a
            href="https://github.com/Boring-Software-Inc/dither-kit"
            class="transition-colors hover:text-foreground"
            >github</a
          >
          <button
            type="button"
            class="flex size-7 items-center justify-center rounded-md border border-border transition-colors hover:text-foreground"
            :aria-label="dark ? 'Switch to light' : 'Switch to dark'"
            @click="toggle"
          >
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <template v-if="dark">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </template>
              <path v-else d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
            </svg>
          </button>
        </nav>
      </div>
    </header>

    <div class="mx-auto max-w-6xl gap-6 px-5 py-6 lg:grid lg:grid-cols-[190px_minmax(0,1fr)_260px]">
      <!-- Component picker -->
      <aside class="lg:sticky lg:top-6 lg:self-start">
        <div class="flex gap-4 overflow-x-auto pb-2 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
          <div v-for="(items, name) in groups" :key="name" class="shrink-0">
            <p class="mb-2 hidden text-[10px] uppercase tracking-widest text-muted-foreground lg:block">{{ name }}</p>
            <div class="flex gap-1.5 lg:flex-col">
              <button
                v-for="c in items"
                :key="c.id"
                type="button"
                class="whitespace-nowrap rounded-md px-3 py-1.5 text-left text-xs transition-colors"
                :class="
                  controls.selected === c.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                "
                @click="select(c.id)"
              >
                {{ c.label }}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Stage -->
      <main class="mt-6 min-w-0 lg:mt-0">
        <div
          class="rounded-xl border border-transparent bg-card/40 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
        >
          <div class="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
            <div class="flex items-baseline gap-2">
              <span class="text-sm text-foreground">{{ def.label }}</span>
              <span class="text-[11px] text-muted-foreground">{{ def.registry }}</span>
            </div>
            <button
              type="button"
              class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Replay"
              @click="replay()"
            >
              <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>
          </div>

          <!-- Live preview -->
          <div class="relative flex min-h-[420px] items-center justify-center p-5">
            <!-- Charts -->
            <div v-if="controls.selected === 'area'" class="h-[380px] w-full">
              <AreaChart :data="trafficData" :config="lineAreaConfig" :bloom="controls.bloom" :stack-type="controls.stackType" :animate="controls.animate" :interactive="controls.interactive" :replay-token="controls.replayToken">
                <Grid /><XAxis dataKey="month" /><YAxis />
                <Area dataKey="mobile" :variant="controls.variant" is-clickable />
                <Area dataKey="desktop" :variant="controls.variant" is-clickable />
                <Legend is-clickable /><Tooltip labelKey="month" />
              </AreaChart>
            </div>

            <div v-else-if="controls.selected === 'line'" class="h-[380px] w-full">
              <LineChart :data="trafficData" :config="lineAreaConfig" :bloom="controls.bloom" :animate="controls.animate" :interactive="controls.interactive" :replay-token="controls.replayToken">
                <Grid /><XAxis dataKey="month" /><YAxis />
                <Line dataKey="desktop" is-clickable />
                <Line dataKey="mobile" is-clickable />
                <Legend is-clickable /><Tooltip labelKey="month" />
              </LineChart>
            </div>

            <div v-else-if="controls.selected === 'bar'" class="h-[380px] w-full">
              <BarChart :data="revenueData" :config="barConfig" :bloom="controls.bloom" :stack-type="controls.stackType" :animate="controls.animate" :interactive="controls.interactive" :replay-token="controls.replayToken">
                <Grid /><XAxis dataKey="quarter" /><YAxis />
                <Bar dataKey="product" :variant="controls.variant" is-clickable />
                <Bar dataKey="services" :variant="controls.variant" is-clickable />
                <Legend is-clickable /><Tooltip labelKey="quarter" />
              </BarChart>
            </div>

            <div v-else-if="controls.selected === 'pie'" class="h-[380px] w-full">
              <PieChart :data="marketData" :config="marketConfig" data-key="value" name-key="name" :inner-radius="controls.innerRadius" :bloom="controls.bloom" :animate="controls.animate" :replay-token="controls.replayToken">
                <Pie :variant="controls.variant" />
                <Legend align="center" is-clickable /><Tooltip />
              </PieChart>
            </div>

            <div v-else-if="controls.selected === 'radar'" class="h-[380px] w-full">
              <RadarChart :data="skillData" :config="skillConfig" name-key="axis" :bloom="controls.bloom" :animate="controls.animate" :replay-token="controls.replayToken">
                <Radar dataKey="alpha" :variant="controls.variant" is-clickable />
                <Radar dataKey="beta" :variant="controls.variant" is-clickable />
                <Legend align="center" is-clickable /><Tooltip />
              </RadarChart>
            </div>

            <div v-else-if="controls.selected === 'sparkline'" class="h-24 w-full max-w-md">
              <Sparkline :data="sparkSeries" :color="controls.color" :variant="controls.variant" :animate="controls.animate" :bloom="controls.bloom" bloom-on-hover :replay-token="controls.replayToken" />
            </div>

            <!-- Primitives -->
            <DitherButton
              v-else-if="controls.selected === 'button'"
              :key="`${controls.color}-${controls.variant}-${controls.bloom}`"
              :color="controls.color"
              :variant="controls.variant"
              :bloom="controls.bloom"
              class="px-6 py-3 text-sm"
              >Click me</DitherButton
            >

            <DitherAvatar
              v-else-if="controls.selected === 'avatar'"
              :key="controls.avatarName"
              :name="controls.avatarName"
              :size="128"
              :bloom="controls.bloom"
              :animate="controls.animate"
              :replay-token="controls.replayToken"
              class="rounded-lg"
            />

            <div v-else-if="controls.selected === 'gradient'" class="relative h-64 w-full max-w-lg overflow-hidden rounded-lg border border-border">
              <DitherGradient
                :key="`${controls.color}-${controls.direction}-${controls.twoTone}-${controls.bloom}`"
                :from="controls.color"
                :to="controls.twoTone ? 'pink' : 'transparent'"
                :direction="controls.direction"
                :bloom="controls.bloom"
              />
            </div>
          </div>
        </div>

        <!-- Install + code -->
        <div class="mt-4 space-y-3">
          <div class="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2.5 text-xs">
            <span><span class="text-muted-foreground">$ </span>{{ installCmd }}</span>
            <span class="text-[11px] text-muted-foreground">install</span>
          </div>
          <CodeBlock :code="code" />
        </div>
      </main>

      <!-- Controls -->
      <aside class="mt-6 lg:sticky lg:top-6 lg:mt-0 lg:self-start">
        <div class="rounded-xl border border-transparent bg-card/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
          <p class="mb-4 text-[10px] uppercase tracking-widest text-muted-foreground">props</p>
          <ControlsPanel :knobs="def.knobs" />
        </div>
      </aside>
    </div>
  </div>
</template>
