<script setup lang="ts">
import {
  BLOOMS,
  COLORS,
  controls,
  DIRECTIONS,
  STACKS,
  VARIANTS,
} from "./controls"
import type { Knob } from "./registry"
import Segmented from "./Segmented.vue"

defineProps<{ knobs: Knob[] }>()
const has = (knobs: Knob[], k: Knob) => knobs.includes(k)
</script>

<template>
  <div class="flex flex-col gap-4">
    <Segmented v-if="has(knobs, 'variant')" v-model="controls.variant" :options="VARIANTS" label="variant" />
    <Segmented v-if="has(knobs, 'bloom')" v-model="controls.bloom" :options="BLOOMS" label="bloom" />
    <Segmented v-if="has(knobs, 'stackType')" v-model="controls.stackType" :options="STACKS" label="stack" />
    <Segmented v-if="has(knobs, 'direction')" v-model="controls.direction" :options="DIRECTIONS" label="direction" />

    <div v-if="has(knobs, 'color')" class="flex items-center gap-2">
      <span class="w-16 shrink-0 text-[11px] text-muted-foreground">color</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="c in COLORS"
          :key="c"
          type="button"
          class="size-5 rounded-[4px] border transition-transform hover:scale-110"
          :class="controls.color === c ? 'border-foreground' : 'border-border'"
          :style="{ backgroundColor: `var(--swatch-${c})` }"
          :title="c"
          :aria-label="c"
          @click="controls.color = c"
        />
      </div>
    </div>

    <label
      v-if="has(knobs, 'innerRadius')"
      class="flex items-center gap-2 text-[11px] text-muted-foreground"
    >
      <span class="w-16 shrink-0">radius</span>
      <input
        v-model.number="controls.innerRadius"
        type="range"
        min="0"
        max="0.85"
        step="0.05"
        class="flex-1 accent-foreground"
      />
      <span class="w-8 tabular-nums text-foreground">{{ controls.innerRadius.toFixed(2) }}</span>
    </label>

    <label
      v-if="has(knobs, 'avatarName')"
      class="flex items-center gap-2 text-[11px] text-muted-foreground"
    >
      <span class="w-16 shrink-0">name</span>
      <input
        v-model="controls.avatarName"
        type="text"
        class="flex-1 rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-foreground/40"
        placeholder="Any name…"
      />
    </label>

    <div
      v-if="has(knobs, 'animate') || has(knobs, 'interactive') || has(knobs, 'twoTone')"
      class="flex flex-wrap items-center gap-4 pt-1"
    >
      <label v-if="has(knobs, 'animate')" class="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input v-model="controls.animate" type="checkbox" class="accent-foreground" /> animate
      </label>
      <label v-if="has(knobs, 'interactive')" class="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input v-model="controls.interactive" type="checkbox" class="accent-foreground" /> interactive
      </label>
      <label v-if="has(knobs, 'twoTone')" class="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
        <input v-model="controls.twoTone" type="checkbox" class="accent-foreground" /> two-tone
      </label>
    </div>
  </div>
</template>
