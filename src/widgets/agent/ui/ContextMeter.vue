<script setup lang="ts">
import { computed } from "vue"
import type { ContextUse } from "@/features/agent/tools"

// How full the harness's context is, as it reports it: a ring by the send
// key (its share of the window) with the percentage beside it (a ring alone
// reads as a spinner), the figures in words for the title and a screen
// reader. Past `FULL` the ring takes the destructive ink: the harness
// will soon compact or forget the start.
const props = defineProps<{ use: ContextUse }>()
const FULL = 0.9
const R = 6
const C = 2 * Math.PI * R
const share = computed(() => Math.min(1, props.use.used / props.use.size))
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))
const pct = computed(() => Math.round(share.value * 100))
const words = computed(() => {
  const pct = Math.round(share.value * 100)
  const cost = props.use.cost
  const spent = cost
    ? `, ${new Intl.NumberFormat("en", { style: "currency", currency: cost.currency, maximumFractionDigits: cost.amount < 0.01 ? 4 : 2 }).format(cost.amount)}`
    : ""
  return `Context ${pct}% used: ${k(props.use.used)} of ${k(props.use.size)} tokens${spent}`
})
</script>

<template>
  <span class="meter" role="img" :aria-label="words" :title="words" :data-full="share >= FULL || undefined">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" :r="R" class="track" />
      <circle cx="8" cy="8" :r="R" class="used" :stroke-dasharray="`${C * share} ${C}`" transform="rotate(-90 8 8)" />
    </svg>
    <span class="pct" aria-hidden="true">{{ pct }}%</span>
  </span>
</template>

<style scoped>
.meter {
  display: inline-flex;
  min-height: 1.5rem;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted-foreground);
}
.meter[data-full] .pct {
  color: var(--color-destructive);
}
circle {
  fill: none;
  stroke-width: 2;
}
.track {
  stroke: color-mix(in oklab, var(--color-foreground) 14%, transparent);
}
.used {
  stroke: var(--color-muted-foreground);
  stroke-linecap: round;
  transition: stroke-dasharray 350ms var(--ease-settle);
}
.meter[data-full] .used {
  stroke: var(--color-destructive);
}
@media (prefers-reduced-motion: reduce) {
  .used {
    transition: none;
  }
}
</style>
