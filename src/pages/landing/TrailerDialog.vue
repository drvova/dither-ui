<script setup lang="ts">
// The film: a minute of the kit by hand, then one screen built in the
// Studio, over its score. Nothing of it loads until the dialog opens (the
// <video> exists only while it is open); opening it was the visitor's ask,
// so it plays at once, except under reduced motion, where it waits on its
// poster for play. H.264 first (Safari, Chrome, Edge, Firefox), VP9 for a
// browser built without it. The kit's dialog traps focus, closes on Escape
// and the backdrop, and hands focus back to the key that opened it.
import { DitherDialog } from "@dither-kit"
import { assetPath } from "@/shared/lib"

const open = defineModel<boolean>({ required: true })
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
</script>

<template>
  <DitherDialog
    :open="open"
    title="The dither-ui film"
    description="A minute of the kit by hand: buttons, sliders, a hold, a slide, charts, a 3D model and a fluid. Then one screen built in the Studio by hand and by an agent, its code and its reel. Music and interface sounds, no speech."
    class="max-w-5xl"
    @close="open = false"
  >
    <video
      v-if="open"
      class="trailer"
      :poster="assetPath('/trailer/poster.webp')"
      :autoplay="!still()"
      controls
      playsinline
      preload="metadata"
      width="1920"
      height="1080"
    >
      <source :src="assetPath('/trailer/dither-ui.mp4')" type="video/mp4" />
      <source :src="assetPath('/trailer/dither-ui.webm')" type="video/webm" />
    </video>
  </DitherDialog>
</template>

<style scoped>
.trailer {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  background: #000;
}
</style>
