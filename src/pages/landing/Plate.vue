<script setup lang="ts">
// One plate of the series (`plate.ts`): a 2.35:1 sheet on the page's width,
// square cornered and flat like the hero's print, on the raised ground as
// its stock. Each half shows only the thin end of its ramp (the ramp runs
// 1/tone times the half's depth), through the kit's Bayer screen; the mark,
// 28px (seven 4px cells), stands in the clear band. Decorative; nothing
// moves.
import { DitherGradient } from "@dither-kit"
import { MARK, STOCK, type Plate } from "./plate"

const { plate } = defineProps<{ plate: Plate }>()
const pct = (f: number) => `${f * 100}%`
</script>

<template>
  <div class="plate" :style="{ background: STOCK }" aria-hidden="true">
    <div class="plate-tone" :style="{ top: 0, height: pct(plate.band[0]) }">
      <DitherGradient
        from="#e4e1d8"
        :to="STOCK"
        direction="down"
        :cell="4"
        :style="{ inset: 'auto 0 0', height: pct(1 / plate.sky) }"
      />
    </div>
    <div class="plate-tone" :style="{ top: pct(plate.band[1]), bottom: 0 }">
      <DitherGradient
        from="#e4e1d8"
        :to="STOCK"
        direction="up"
        :cell="4"
        :style="{ inset: '0 0 auto', height: pct(1 / plate.ground) }"
      />
    </div>
    <svg
      viewBox="0 0 7 7"
      class="plate-mark"
      :style="{ left: pct(plate.mark[0]), top: pct(plate.mark[1]) }"
      focusable="false"
      shape-rendering="crispEdges"
    >
      <path :d="MARK" fill="currentColor" />
      <rect x="3" y="3" width="1" height="1" fill="var(--signal)" />
    </svg>
  </div>
</template>

<style scoped>
.plate {
  position: relative;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 2.35;
  overflow: hidden;
  color: var(--ink);
}

.plate-tone {
  position: absolute;
  inset-inline: 0;
  overflow: hidden;
}

.plate-mark {
  position: absolute;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
}
</style>
