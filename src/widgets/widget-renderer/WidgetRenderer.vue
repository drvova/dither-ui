<script setup lang="ts">
import { computed } from "vue"
import { editor } from "@/entities/editor"
import type { WidgetModel } from "@/entities/widget"
import { DitherAvatar, DitherButton, DitherGradient } from "@dither-kit"

const props = defineProps<{ widget: WidgetModel }>()
const rt = computed(() => editor.replayToken)
const w = computed(() => props.widget)
</script>

<template>
  <!-- AVATAR — sized to fill the frame's shorter side -->
  <div v-if="w.kind === 'avatar'" class="flex h-full w-full items-center justify-center">
    <DitherAvatar
      :name="w.name"
      :color="w.autoColor ? undefined : w.color"
      :mirror="w.mirror"
      :grid="w.grid"
      :cell-px="w.cellPx"
      :density="w.density"
      :off-tier="w.offTier"
      :bloom="w.bloom"
      :animate="w.animate"
      :animation-duration="w.animationDuration"
      :replay-token="rt"
      class="h-full max-h-full w-auto rounded-lg"
      style="aspect-ratio: 1"
    />
  </div>

  <!-- BUTTON — centred at natural size -->
  <div v-else-if="w.kind === 'button'" class="flex h-full w-full items-center justify-center">
    <DitherButton
      :key="`${w.color}-${w.variant}-${w.cell}-${JSON.stringify(w.bloom)}`"
      :color="w.color"
      :variant="w.variant"
      :cell="w.cell"
      :bloom="w.bloom"
      class="px-6 py-3 text-sm"
      >{{ w.label }}</DitherButton
    >
  </div>

  <!-- GRADIENT — fills the frame -->
  <div v-else class="relative h-full w-full overflow-hidden rounded-md">
    <DitherGradient
      :key="`${w.from}-${w.twoTone}-${w.to}-${w.direction}-${w.cell}-${w.opacity}-${JSON.stringify(w.bloom)}`"
      :from="w.from"
      :to="w.twoTone ? w.to : 'transparent'"
      :direction="w.direction"
      :cell="w.cell"
      :opacity="w.opacity"
      :bloom="w.bloom"
    />
  </div>
</template>
