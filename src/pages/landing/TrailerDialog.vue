<script setup lang="ts">
// The film: the site in use in under a minute, captioned, over the kit's own
// score. Nothing of it loads until the dialog opens (the
// <video> exists only while it is open); opening it was the visitor's ask,
// so it plays at once, except under reduced motion, where it waits on its
// poster for play. H.264 first (Safari, Chrome, Edge, Firefox), VP9 for a
// browser built without it. The kit's dialog traps focus, closes on Escape
// and the backdrop, and hands focus back to the key that opened it.
import { DitherDialog } from "@dither-kit"
import { assetPath } from "@/shared/lib"

const open = defineModel<boolean>({ required: true })
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
// Played in the open's own tick, inside the visitor's tap: iOS WebKit lets
// a film with sound start only from a gesture, and refuses `autoplay` on
// one. Refused anyway, it waits on its poster with its controls.
const start = (el: unknown) => {
  if (el instanceof HTMLVideoElement && !still()) el.play().catch(() => {})
}
</script>

<template>
  <DitherDialog
    :open="open"
    title="The dither-ui film"
    description="Under a minute, at night, cut hard on the beat: rain through every shot, the brand's diamond up close in a haze with light through a blind across it, the claim that the dither is the raster everything renders through, the diamond taken apart with its parts named, the mechanism, the kit's figures read off instrument dials, each needle swinging to its figure, the mascot standing by in the rain, 3D models in the house raster, a docs section in use, the landing resized from desktop to phone and back, the Studio, and the mascot flying in on its rotor to sign off beside the address. Synth pads and rain, no speech."
    class="max-w-5xl"
    @close="open = false"
  >
    <video
      v-if="open"
      class="trailer"
      :ref="start"
      :poster="assetPath('/trailer/poster.webp')"
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
