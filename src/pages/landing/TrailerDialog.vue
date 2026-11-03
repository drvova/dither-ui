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
    description="The site in use in under a minute, captioned: the kit's diamond printing in and becoming the hero's print, the brand forming, seven of the bento's cards handled in turn, an agent laying out a screen, a docs section's 3D model dragged and its code opened, a phone's menu printing in, a chart evolved in the Studio, the quick start copied, and the footer. Music and interface sounds, no speech."
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
