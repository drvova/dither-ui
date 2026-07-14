<script setup lang="ts">
import { computed } from "vue"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Grid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from "./components/dither-kit"
import CodeBlock from "./studio/CodeBlock.vue"
import { studioCode } from "./studio/codegen"
import Segmented from "./studio/Segmented.vue"
import SeriesEditor from "./studio/SeriesEditor.vue"
import {
  activeRows,
  BLOOMS,
  chartData,
  config,
  familyOf,
  replay,
  STACKS,
  studio,
  TYPES,
  VARIANTS,
} from "./studio/store"
import { useTheme } from "./studio/useTheme"

const { dark, toggle } = useTheme()
const family = computed(() => familyOf(studio.type))
const code = computed(() => studioCode())

function pick(t: (typeof TYPES)[number]) {
  studio.type = t
  replay()
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background font-mono text-foreground antialiased">
    <!-- Header -->
    <header class="border-b border-border/60">
      <div class="flex h-14 items-center justify-between px-5">
        <div class="flex items-center gap-2">
          <span class="inline-block size-3 rounded-[2px] bg-foreground" />
          <span class="text-sm tracking-tight">dither-kit</span>
          <span class="ml-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">studio</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            @click="replay()"
          >
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
            </svg>
            replay
          </button>
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
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
        </div>
      </div>
    </header>

    <div class="grid flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
      <!-- Controls -->
      <aside class="border-b border-border/60 lg:border-b-0 lg:border-r">
        <div class="flex flex-col gap-6 p-5">
          <!-- Type -->
          <section>
            <p class="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">chart</p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="t in TYPES"
                :key="t"
                type="button"
                class="rounded-md px-3 py-1.5 text-xs capitalize transition-colors"
                :class="studio.type === t ? 'bg-foreground text-background' : 'border border-border text-muted-foreground hover:text-foreground'"
                @click="pick(t)"
              >
                {{ t }}
              </button>
            </div>
          </section>

          <!-- Series -->
          <section>
            <p class="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              {{ studio.type === "pie" ? "slices" : "series" }}
            </p>
            <SeriesEditor />
          </section>

          <!-- Parts -->
          <section>
            <p class="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">parts</p>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <template v-if="family === 'cartesian'">
                <label class="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input v-model="studio.parts.grid" type="checkbox" class="accent-foreground" /> grid
                </label>
                <label class="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input v-model="studio.parts.xAxis" type="checkbox" class="accent-foreground" /> x-axis
                </label>
                <label class="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input v-model="studio.parts.yAxis" type="checkbox" class="accent-foreground" /> y-axis
                </label>
              </template>
              <label class="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input v-model="studio.parts.legend" type="checkbox" class="accent-foreground" /> legend
              </label>
              <label class="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input v-model="studio.parts.tooltip" type="checkbox" class="accent-foreground" /> tooltip
              </label>
            </div>
          </section>

          <!-- Style -->
          <section class="flex flex-col gap-4">
            <p class="text-[10px] uppercase tracking-widest text-muted-foreground">style</p>
            <Segmented v-model="studio.variant" :options="VARIANTS" label="variant" />
            <Segmented v-model="studio.bloom" :options="BLOOMS" label="bloom" />
            <Segmented v-if="family === 'cartesian'" v-model="studio.stackType" :options="STACKS" label="stack" />
            <label v-if="studio.type === 'pie'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span class="w-16 shrink-0">radius</span>
              <input v-model.number="studio.innerRadius" type="range" min="0" max="0.85" step="0.05" class="flex-1 accent-foreground" />
              <span class="w-8 tabular-nums text-foreground">{{ studio.innerRadius.toFixed(2) }}</span>
            </label>
            <div class="flex items-center gap-4 pt-0.5">
              <label class="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                <input v-model="studio.animate" type="checkbox" class="accent-foreground" /> animate
              </label>
              <label v-if="family === 'cartesian'" class="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                <input v-model="studio.interactive" type="checkbox" class="accent-foreground" /> interactive
              </label>
            </div>
          </section>
        </div>
      </aside>

      <!-- Stage -->
      <main class="min-w-0 p-5">
        <div class="rounded-xl border border-transparent bg-card/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
          <div class="relative h-[440px] w-full">
            <AreaChart v-if="studio.type === 'area'" :data="chartData" :config="config" :bloom="studio.bloom" :stack-type="studio.stackType" :animate="studio.animate" :interactive="studio.interactive" :replay-token="studio.replayToken">
              <Grid v-if="studio.parts.grid" />
              <XAxis v-if="studio.parts.xAxis" dataKey="month" />
              <YAxis v-if="studio.parts.yAxis" />
              <Area v-for="r in activeRows" :key="r.key" :dataKey="r.key" :variant="studio.variant" is-clickable />
              <Legend v-if="studio.parts.legend" is-clickable />
              <Tooltip v-if="studio.parts.tooltip" labelKey="month" />
            </AreaChart>

            <LineChart v-else-if="studio.type === 'line'" :data="chartData" :config="config" :bloom="studio.bloom" :animate="studio.animate" :interactive="studio.interactive" :replay-token="studio.replayToken">
              <Grid v-if="studio.parts.grid" />
              <XAxis v-if="studio.parts.xAxis" dataKey="month" />
              <YAxis v-if="studio.parts.yAxis" />
              <Line v-for="r in activeRows" :key="r.key" :dataKey="r.key" is-clickable />
              <Legend v-if="studio.parts.legend" is-clickable />
              <Tooltip v-if="studio.parts.tooltip" labelKey="month" />
            </LineChart>

            <BarChart v-else-if="studio.type === 'bar'" :data="chartData" :config="config" :bloom="studio.bloom" :stack-type="studio.stackType" :animate="studio.animate" :interactive="studio.interactive" :replay-token="studio.replayToken">
              <Grid v-if="studio.parts.grid" />
              <XAxis v-if="studio.parts.xAxis" dataKey="month" />
              <YAxis v-if="studio.parts.yAxis" />
              <Bar v-for="r in activeRows" :key="r.key" :dataKey="r.key" :variant="studio.variant" is-clickable />
              <Legend v-if="studio.parts.legend" is-clickable />
              <Tooltip v-if="studio.parts.tooltip" labelKey="month" />
            </BarChart>

            <PieChart v-else-if="studio.type === 'pie'" :data="chartData" :config="config" data-key="value" name-key="name" :inner-radius="studio.innerRadius" :bloom="studio.bloom" :animate="studio.animate" :replay-token="studio.replayToken">
              <Pie :variant="studio.variant" />
              <Legend v-if="studio.parts.legend" align="center" is-clickable />
              <Tooltip v-if="studio.parts.tooltip" />
            </PieChart>

            <RadarChart v-else :data="chartData" :config="config" name-key="axis" :bloom="studio.bloom" :animate="studio.animate" :replay-token="studio.replayToken">
              <Radar v-for="r in activeRows" :key="r.key" :dataKey="r.key" :variant="studio.variant" is-clickable />
              <Legend v-if="studio.parts.legend" align="center" is-clickable />
              <Tooltip v-if="studio.parts.tooltip" />
            </RadarChart>
          </div>
        </div>

        <div class="mt-4">
          <p class="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">code</p>
          <CodeBlock :code="code" />
        </div>
      </main>
    </div>
  </div>
</template>
