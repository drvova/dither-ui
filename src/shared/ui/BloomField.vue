<script setup lang="ts">
import { computed } from "vue"
import type { BloomConfig, BloomInput, BloomLevel } from "@dither-kit"
import { bloomFromSeed } from "@dither-kit"
import { BLOOMS } from "@/shared/config"
import Segmented from "./Segmented.vue"

const props = defineProps<{ modelValue: BloomInput }>()
const emit = defineEmits<{ "update:modelValue": [BloomInput] }>()

// Mirrors the engine's bloom presets so "custom" seeds from the current look.
const SEED: Record<string, Required<Omit<BloomConfig, "blend">>> = {
  off: { blur: 3, brightness: 1.35, opacity: 0.7, saturate: 1.4 },
  low: { blur: 3, brightness: 1.35, opacity: 0.7, saturate: 1.4 },
  high: { blur: 5, brightness: 1.5, opacity: 0.78, saturate: 1.5 },
  aura: { blur: 15, brightness: 2.9, opacity: 0.1, saturate: 3 },
}

const CHOICES = [...BLOOMS, "custom"] as const
const choice = computed(() =>
  typeof props.modelValue === "string" ? props.modelValue : "custom"
)
const cfg = computed<Required<Omit<BloomConfig, "blend">>>(() =>
  typeof props.modelValue === "string"
    ? SEED[props.modelValue]
    : typeof props.modelValue === "number"
      ? { ...SEED.low, ...bloomFromSeed(props.modelValue) }
      : { ...SEED.low, ...props.modelValue }
)

function setChoice(v: string | number) {
  if (v === "custom") emit("update:modelValue", { ...cfg.value })
  else emit("update:modelValue", v as BloomLevel)
}
function set(key: keyof BloomConfig, value: number) {
  emit("update:modelValue", { ...cfg.value, [key]: value })
}
const num = (e: Event) => Number((e.target as HTMLInputElement).value)

const SLIDERS = [
  { key: "blur", label: "blur", min: 0, max: 30, step: 1, fmt: (v: number) => `${v}px` },
  { key: "brightness", label: "bright", min: 1, max: 4, step: 0.05, fmt: (v: number) => v.toFixed(2) },
  { key: "opacity", label: "opacity", min: 0, max: 1, step: 0.02, fmt: (v: number) => v.toFixed(2) },
  { key: "saturate", label: "saturate", min: 1, max: 4, step: 0.05, fmt: (v: number) => v.toFixed(2) },
] as const
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <Segmented :model-value="choice" :options="CHOICES" label="bloom" @update:model-value="setChoice" />
    <template v-if="choice === 'custom'">
      <label
        v-for="s in SLIDERS"
        :key="s.key"
        class="flex items-center gap-2 text-[11px] text-muted-foreground"
      >
        <span class="w-14 shrink-0">{{ s.label }}</span>
        <input
          type="range"
          :name="`bloom-${s.key}`"
          :min="s.min"
          :max="s.max"
          :step="s.step"
          :value="cfg[s.key]"
          class="flex-1 accent-foreground"
          @input="set(s.key, num($event))"
        />
        <span class="w-9 shrink-0 text-right tabular-nums text-foreground">{{ s.fmt(cfg[s.key]) }}</span>
      </label>
    </template>
  </div>
</template>
