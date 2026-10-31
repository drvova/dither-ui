<script setup lang="ts">
// One plate of the series (`plate.ts`): a sheet of its own proportion on the
// page's width, square cornered and flat like the hero's print, on the
// raised ground as its stock. Each half shows only the thin end of its ramp
// (the ramp runs 1/tone times the half's depth), through the plate's own
// printer's screen; the brand
// (`BrandGather.vue`) stands in the clear band, pulled in from the right
// edge where the plate is narrow, and gathers there once as the plate comes
// into view, while the tone prints in through the kit's reveal (the lights
// coming on). Decorative.
import { DitherGradient, DitherReveal, DitherScreen } from "@dither-kit"
import { LOCKUP_SIZE } from "./brand"
import BrandGather from "./BrandGather.vue"
import { sceneOf, STOCK, type Plate } from "./plate"

const { plate } = defineProps<{ plate: Plate }>()
const pct = (f: number) => `${f * 100}%`

const CELL = 4
const WIDTH = LOCKUP_SIZE.width * CELL
const HALF = 3.5 * CELL
</script>

<template>
  <div class="plate" :style="{ background: STOCK, aspectRatio: plate.aspect }" aria-hidden="true">
    <DitherScreen :screen="plate.screen">
      <DitherReveal class="plate-print" :duration="0.72" easing="linear">
        <div class="plate-tone" :style="{ top: 0, height: pct(plate.band[0]) }">
          <DitherGradient
            from="#e4e1d8"
            :to="STOCK"
            direction="down"
            :cell="CELL"
            :style="{ inset: 'auto 0 0', height: pct(1 / plate.sky) }"
          />
        </div>
        <div class="plate-tone" :style="{ top: pct(plate.band[1]), bottom: 0 }">
          <DitherGradient
            from="#e4e1d8"
            :to="STOCK"
            direction="up"
            :cell="CELL"
            :style="{ inset: '0 0 auto', height: pct(1 / plate.ground) }"
          />
        </div>
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
  width: 100%;
  max-width: 100%;
  min-height: 112px;
  overflow: hidden;
}

.plate-print {
  position: absolute;
  inset: 0;
}

.plate-tone {
  position: absolute;
  inset-inline: 0;
  overflow: hidden;
}

.plate-lockup {
  position: absolute;
}
</style>
