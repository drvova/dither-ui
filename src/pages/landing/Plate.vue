<script setup lang="ts">
// One plate of the series (`plate.ts`): a sheet of its own proportion on the
// page's width, square cornered and flat like the hero's print, on the
// raised ground as its stock. The heat (`heat.ts`, the close's material)
// prints above and below its clear band through the plate's own printer's
// screen, still; the brand
// (`BrandGather.vue`) stands in the clear band, pulled in from the right
// edge where the plate is narrow, and gathers there once as the plate comes
// into view, while the tone prints in through the kit's reveal (the lights
// coming on). Decorative.
import { DitherReveal, DitherScreen } from "@dither-kit"
import { LOCKUP_SIZE } from "./brand"
import BrandGather from "./BrandGather.vue"
import HeatPrint from "./HeatPrint.vue"
import { plateField, sceneOf, STOCK, type Plate } from "./plate"

const { plate } = defineProps<{ plate: Plate }>()
const pct = (f: number) => `${f * 100}%`
const field = plateField(plate)

const CELL = 4
const WIDTH = LOCKUP_SIZE.width * CELL
const HALF = 3.5 * CELL
</script>

<template>
  <div class="plate" :style="{ background: STOCK, aspectRatio: plate.aspect }" aria-hidden="true">
    <DitherScreen :screen="plate.screen">
      <DitherReveal class="plate-print" :duration="0.72" easing="glide">
        <HeatPrint paused :field="field" />
      </DitherReveal>
    </DitherScreen>
    <BrandGather
      class="plate-lockup"
      :scene="(height) => sceneOf(plate, height)"
      :style="{
        left: `clamp(16px, calc(${pct(plate.mark[0])} - ${HALF}px), calc(100% - ${WIDTH + 16}px))`,
        top: `calc(${pct(plate.mark[1])} - ${HALF}px)`,
      }"
    />
  </div>
</template>

<style scoped>
.plate {
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: 100%;
  min-height: 112px;
  overflow: hidden;
}

.plate-print {
  position: absolute;
  inset: 0;
}

.plate-lockup {
  position: absolute;
}
</style>
