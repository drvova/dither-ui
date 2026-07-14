<script setup lang="ts">
import { computed } from "vue"
import { resolveTexture, type TextureConfig, type VariantInput } from "@dither-kit"
import { VARIANTS } from "@/shared/config"
import Segmented from "./Segmented.vue"
import Toggle from "./Toggle.vue"

const props = defineProps<{ modelValue: VariantInput }>()
const emit = defineEmits<{ "update:modelValue": [VariantInput] }>()

const CHOICES = [...VARIANTS, "custom"] as const
const choice = computed(() =>
  typeof props.modelValue === "string" ? props.modelValue : "custom"
)
const tex = computed<Required<TextureConfig>>(() => ({
  ...resolveTexture(props.modelValue),
}))

function setChoice(v: string | number) {
  if (v === "custom") {
    // Seed from the current preset so the switch is seamless (clamp solid's
    // internal always-lit bias back into the visible 0–1 range).
    const seed = { ...resolveTexture(props.modelValue) }
    seed.density = Math.min(1, seed.density)
    emit("update:modelValue", seed)
  } else {
    emit("update:modelValue", v as VariantInput)
  }
}
function set<K extends keyof TextureConfig>(key: K, value: TextureConfig[K]) {
  emit("update:modelValue", { ...tex.value, density: Math.min(1, tex.value.density), [key]: value })
}
const num = (e: Event) => Number((e.target as HTMLInputElement).value)

const SLIDERS = [
  { key: "ramp", label: "fade", min: 0, max: 1, step: 0.05 },
  { key: "density", label: "density", min: 0, max: 1, step: 0.05 },
  { key: "offTier", label: "off tier", min: 0, max: 1, step: 0.05 },
  { key: "edge", label: "edge", min: 0, max: 1, step: 0.05 },
] as const
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <Segmented :model-value="choice" :options="CHOICES" label="variant" @update:model-value="setChoice" />
    <template v-if="choice === 'custom'">
      <label
        v-for="s in SLIDERS"
        :key="s.key"
        class="flex items-center gap-2 text-[11px] text-muted-foreground"
      >
        <span class="w-14 shrink-0">{{ s.label }}</span>
        <input
          type="range"
          :name="`tex-${s.key}`"
          :min="s.min"
          :max="s.max"
          :step="s.step"
          :value="tex[s.key]"
          class="flex-1 accent-foreground"
          @input="set(s.key, num($event))"
        />
        <span class="w-8 shrink-0 text-right tabular-nums text-foreground">{{ tex[s.key].toFixed(2) }}</span>
      </label>
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">hatch</span>
        <input
          type="range"
          name="tex-hatch"
          min="0"
          max="8"
          step="1"
          :value="tex.hatch"
          class="flex-1 accent-foreground"
          @input="set('hatch', num($event))"
        />
        <span class="w-8 shrink-0 text-right tabular-nums text-foreground">{{ tex.hatch || "off" }}</span>
      </label>
      <Toggle :model-value="tex.gaps" label="real gaps (dotted look)" @update:model-value="set('gaps', $event)" />
    </template>
  </div>
</template>
