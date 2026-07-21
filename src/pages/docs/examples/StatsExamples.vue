<script setup lang="ts">
import { computed, ref } from "vue"
import { DitherMeter, Sparkline } from "@dither-kit"
import DemoCard from "../DemoCard.vue"

type Kpi = { label: string; icon: string; value: string; delta: number; note: string }
const PERIODS = ["30d", "90d"] as const
const period = ref<(typeof PERIODS)[number]>("30d")
const KPIS: Record<(typeof PERIODS)[number], Kpi[]> = {
  "30d": [
    { label: "Revenue", icon: "$", value: "$54,239", delta: 12.5, note: "vs prior 30 days" },
    { label: "Active users", icon: "◩", value: "8,947", delta: 8.2, note: "vs prior 30 days" },
    { label: "Orders", icon: "▤", value: "1,254", delta: 24.1, note: "vs prior 30 days" },
    { label: "Churn", icon: "▽", value: "0.84%", delta: -0.3, note: "vs prior 30 days" },
  ],
  "90d": [
    { label: "Revenue", icon: "$", value: "$148,102", delta: 6.1, note: "vs prior 90 days" },
    { label: "Active users", icon: "◩", value: "9,410", delta: 3.4, note: "vs prior 90 days" },
    { label: "Orders", icon: "▤", value: "3,876", delta: -2.2, note: "vs prior 90 days" },
    { label: "Churn", icon: "▽", value: "1.02%", delta: 0.1, note: "vs prior 90 days" },
  ],
}
const kpis = computed(() => KPIS[period.value])
/** Churn is inverted — a falling rate is the good direction. */
const good = (k: Kpi) => (k.label === "Churn" ? k.delta < 0 : k.delta > 0)

const TRENDS = {
  revenue: [12, 14, 13, 17, 16, 19, 22, 21, 24, 27, 26, 31],
  sessions: [420, 380, 460, 510, 470, 560, 540, 620, 590, 680, 710, 690],
  latency: [92, 88, 95, 84, 81, 86, 78, 74, 79, 71, 68, 66],
}

const SNIPPET_CARDS = `<div role="group" aria-label="Period">   <!-- period picker -->
  <button v-for="p in periods" :aria-pressed="period === p"
    @click="period = p">{{ p }}</button>
</div>

<div class="grid grid-cols-4 gap-3">
  <div v-for="k in kpis" class="rounded-lg border p-4">
    <div class="flex items-center justify-between">
      <span class="text-muted-foreground">{{ k.label }}</span>
      <span class="grid size-7 place-items-center rounded-md border">{{ k.icon }}</span>
    </div>
    <div class="mt-2 text-xl tabular-nums">{{ k.value }}</div>
    <span :class="k.good ? 'text-green' : 'text-red'">   <!-- delta chip -->
      {{ k.delta > 0 ? "▲" : "▼" }} {{ Math.abs(k.delta) }}%
    </span>
    <span>{{ k.note }}</span>
  </div>
</div>`

const SNIPPET_CHARTS = `<div class="grid grid-cols-3 gap-3">
  <div class="rounded-lg border p-4">          <!-- sparkline card -->
    <span>MRR</span> <b>$31,204</b>
    <Sparkline :data="revenue" color="green" class="h-10" />
  </div>
  <div class="rounded-lg border p-4">
    <span>Sessions</span> <b>690k</b>
    <Sparkline :data="sessions" color="blue" variant="dotted" class="h-10" />
  </div>
  <div class="rounded-lg border p-4">          <!-- goal card -->
    <span>Q3 target</span> <b>68%</b>
    <DitherMeter :value="68" class="h-2 w-full" />
    <span>$34k of $50k booked</span>
  </div>
</div>`
</script>

<template>
  <!-- Stat cards -->
  <section id="stats-cards" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Stat cards</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The classic KPI grid — label, corner glyph, a big tabular number, and a
      signed delta that knows churn falling is good news. The period picker
      swaps the whole dataset live.
    </p>
    <DemoCard :code="SNIPPET_CARDS">
      <div class="mx-auto max-w-2xl">
        <div class="flex items-center justify-between">
          <span class="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">Overview</span>
          <div class="flex gap-1 rounded-md border border-border/60 p-0.5" role="group" aria-label="Period">
            <button
              v-for="p in PERIODS"
              :key="p"
              type="button"
              :aria-pressed="period === p"
              class="rounded px-2 py-0.5 text-[11px] transition-colors"
              :class="period === p ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'"
              @click="period = p"
            >
              {{ p }}
            </button>
          </div>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="k in kpis" :key="k.label" class="rounded-lg border border-border/60 bg-background/40 p-3.5">
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-muted-foreground">{{ k.label }}</span>
              <span class="grid size-6 place-items-center rounded-md border border-border/60 text-[11px] text-muted-foreground" aria-hidden="true">{{ k.icon }}</span>
            </div>
            <div class="mt-2 text-[19px] leading-none tracking-tight tabular-nums text-foreground">{{ k.value }}</div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span
                class="rounded border px-1 py-px text-[10px] tabular-nums"
                :class="good(k) ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'"
              >
                <span aria-hidden="true">{{ k.delta > 0 ? "▲" : "▼" }}</span>
                <span class="sr-only">{{ k.delta > 0 ? "up" : "down" }}</span>
                {{ Math.abs(k.delta) }}%
              </span>
              <span class="text-[10px] text-muted-foreground/70">{{ k.note }}</span>
            </div>
          </div>
        </div>
      </div>
    </DemoCard>
  </section>

  <!-- Stats with charts -->
  <section id="stats-charts" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Stats with charts</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Numbers with their shape — sparkline cards for trends, a meter card for
      progress toward a goal. Twelve points is plenty; the dither does the
      rest.
    </p>
    <DemoCard :code="SNIPPET_CHARTS">
      <div class="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-lg border border-border/60 bg-background/40 p-3.5">
          <div class="flex items-baseline justify-between">
            <span class="text-[11px] text-muted-foreground">MRR</span>
            <span class="rounded border border-green-500/30 px-1 py-px text-[10px] tabular-nums text-green-400">▲ 18.9%</span>
          </div>
          <div class="mt-1.5 text-[19px] leading-none tracking-tight tabular-nums text-foreground">$31,204</div>
          <Sparkline :data="TRENDS.revenue" color="green" class="mt-3 h-10" />
        </div>
        <div class="rounded-lg border border-border/60 bg-background/40 p-3.5">
          <div class="flex items-baseline justify-between">
            <span class="text-[11px] text-muted-foreground">Sessions</span>
            <span class="rounded border border-blue-500/30 px-1 py-px text-[10px] tabular-nums text-blue-400">▲ 9.6%</span>
          </div>
          <div class="mt-1.5 text-[19px] leading-none tracking-tight tabular-nums text-foreground">690k</div>
          <Sparkline :data="TRENDS.sessions" color="blue" variant="dotted" class="mt-3 h-10" />
        </div>
        <div class="rounded-lg border border-border/60 bg-background/40 p-3.5">
          <div class="flex items-baseline justify-between">
            <span class="text-[11px] text-muted-foreground">Q3 target</span>
            <span class="text-[10px] tabular-nums text-muted-foreground">68%</span>
          </div>
          <div class="mt-1.5 text-[19px] leading-none tracking-tight tabular-nums text-foreground">$34,000</div>
          <DitherMeter :value="68" class="mt-4 h-2 w-full" />
          <div class="mt-2 text-[10px] text-muted-foreground/70">of $50,000 booked</div>
        </div>
      </div>
    </DemoCard>
  </section>
</template>
