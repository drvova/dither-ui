<script setup lang="ts">
import { computed } from "vue"
import { editor } from "@/entities/editor"
import { componentEntry, type WidgetModel } from "@/entities/widget"
import * as kit from "@dither-kit"
import { DitherAvatar, DitherButton, DitherGradient, DitherImage } from "@dither-kit"
import ScreenRenderer from "./ScreenRenderer.vue"

const props = defineProps<{ widget: WidgetModel; artboardId: string }>()
const rt = computed(() => editor.replayToken)
const w = computed(() => props.widget)

// Registry-driven kit component: resolve by export name, map list props.
const comp = computed(() =>
  w.value.kind === "component"
    ? (kit as Record<string, unknown>)[w.value.is]
    : null
)
const compProps = computed(() => {
  if (w.value.kind !== "component") return {}
  const entry = componentEntry(w.value.is)
  return entry?.mapProps ? entry.mapProps(w.value.props) : w.value.props
})
const hasModel = computed(
  () => w.value.kind === "component" && !!componentEntry(w.value.is)?.vmodel
)
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

  <!-- REGISTRY COMPONENT — centred, interactive -->
  <div v-else-if="w.kind === 'component'" class="flex h-full w-full items-center justify-center overflow-hidden p-2">
    <component
      :is="comp as never"
      v-if="comp"
      v-bind="compProps"
      :model-value="hasModel ? w.model : undefined"
      class="max-w-full"
      @update:model-value="hasModel ? (w.model = $event) : undefined"
    >
      <template v-if="w.slotText != null" #default>{{ w.slotText }}</template>
    </component>
  </div>

  <!-- IMAGE — fills the frame -->
  <div v-else-if="w.kind === 'image'" class="relative h-full w-full overflow-hidden rounded-md">
    <DitherImage
      :key="`${w.src}-${w.cell}-${w.focusY}-${w.fade}`"
      :src="w.src"
      :alt="w.alt"
      :cell="w.cell"
      :focus-y="w.focusY"
      :fade="w.fade"
      class="h-full w-full"
    />
  </div>

  <!-- SCREEN — composed rows of registry components -->
  <ScreenRenderer v-else-if="w.kind === 'screen'" :screen="w" :artboard-id="artboardId" />

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
