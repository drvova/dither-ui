<script setup lang="ts">
import { onMounted, ref } from "vue"
import { DitherButton, DitherGradient } from "@dither-kit"
import { version } from "../../../package.json"

const openStudio = () => (window.location.hash = "#/studio")

// Portraits + their reaction emotes, both cropped from the sprite sheet —
// boxes measured from the source png. Hover a face, her mood answers.
const FACE_Y = 766
const FACE_H = 126
const FACES = [
  { x: 29, w: 97, emote: { x: 1503, y: 791, w: 51, h: 49 } }, // neutral → …
  { x: 147, w: 97, emote: { x: 1273, y: 793, w: 42, h: 38 } }, // smile → heart
  { x: 262, w: 95, emote: { x: 1270, y: 858, w: 36, h: 41 } }, // blush → sparkles
  { x: 378, w: 98, emote: { x: 1529, y: 864, w: 25, h: 27 } }, // wink → note
  { x: 497, w: 96, emote: { x: 1458, y: 790, w: 20, h: 47 } }, // surprised → !
  { x: 832, w: 94, emote: { x: 1334, y: 789, w: 40, h: 40 } }, // excited → star
]

const faceEls = ref<HTMLCanvasElement[]>([])
const emoteEls = ref<HTMLCanvasElement[]>([])

/** Blit a sheet crop into a canvas at native size with the background keyed. */
function blit(c: HTMLCanvasElement, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const g = c.getContext("2d")
  if (!g) return
  c.width = w
  c.height = h
  g.drawImage(img, x, y, w, h, 0, 0, w, h)
  const px = g.getImageData(0, 0, w, h)
  const d = px.data
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i] - 5) + Math.abs(d[i + 1] - 5) + Math.abs(d[i + 2] - 7) < 48)
      d[i + 3] = 0
  }
  g.putImageData(px, 0, 0)
}

onMounted(() => {
  const img = new Image()
  img.src = "/sprites.png"
  img.onload = () => {
    FACES.forEach((f, i) => {
      const face = faceEls.value[i]
      const emote = emoteEls.value[i]
      if (face) blit(face, img, f.x, FACE_Y, f.w, FACE_H)
      if (emote) blit(emote, img, f.emote.x, f.emote.y, f.emote.w, f.emote.h)
    })
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background font-mono text-foreground antialiased">
    <!-- Header -->
    <header class="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6 text-xs">
      <span class="tracking-tight">dither-ui</span>
      <a
        href="#/studio"
        class="-m-3 p-3 text-muted-foreground transition-colors hover:text-foreground"
      >studio →</a>
    </header>

    <!-- Hero: one statement, one action, one visual. -->
    <main class="relative isolate flex flex-1 flex-col overflow-hidden">
      <DitherGradient from="blue" direction="up" :opacity="0.14" :cell="4" class="-z-10" />
      <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pt-24 sm:pt-32">
        <h1
          class="reveal max-w-xl text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.15] tracking-tight text-balance"
        >
          A dithered UI toolkit for Vue.
        </h1>
        <p
          class="reveal mt-5 max-w-md text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]"
          style="--reveal-delay: 90ms"
        >
          Charts, buttons, avatars and gradients — rendered
          <em class="text-foreground/80">pixel by pixel</em> on canvas. Built in
          the
          <a href="#/studio" class="text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60">studio</a>,
          shipped under
          <a href="https://dither-ui.com" class="text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground/60">MIT</a>.
        </p>
        <div class="reveal mt-10" style="--reveal-delay: 180ms">
          <DitherButton
            color="blue"
            variant="gradient"
            class="px-6 py-3 text-[13px] transition-transform active:scale-[0.96]"
            @click="openStudio"
          >
            Open studio
          </DitherButton>
        </div>

      </div>

      <!-- Six moods, one row — hover a face and her emote answers -->
      <p
        class="reveal pb-6 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70"
        style="--reveal-delay: 260ms"
      >
        expressions
      </p>
      <div
        role="img"
        aria-label="Pixel-art character portraits in six expressions"
        class="reveal flex flex-wrap justify-center gap-7 pb-16"
        style="--reveal-delay: 300ms"
      >
        <div v-for="(_, i) in FACES" :key="i" class="group relative pt-10">
          <canvas
            :ref="(el) => { if (el) faceEls[i] = el as HTMLCanvasElement }"
            class="h-[126px]"
            style="image-rendering: pixelated"
          />
          <canvas
            :ref="(el) => { if (el) emoteEls[i] = el as HTMLCanvasElement }"
            class="emote absolute top-0 left-1/2"
            style="image-rendering: pixelated"
          />
        </div>
      </div>
    </main>

    <!-- Footer: one quiet line, then the wordmark sinking below the fold -->
    <footer class="overflow-hidden border-t border-border/60">
      <div class="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6 text-[11px] text-muted-foreground">
        <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
        <span class="tabular-nums">v{{ version }} · MIT</span>
      </div>
      <div
        aria-hidden="true"
        class="pointer-events-none -mb-[0.34em] select-none text-center text-[clamp(5rem,19vw,15rem)] leading-none font-medium tracking-tighter whitespace-nowrap text-foreground/[0.045]"
      >
        dither-ui
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* One orchestrated load: soft rise, staggered per chunk, once. */
.reveal {
  animation: reveal 700ms cubic-bezier(0.2, 0, 0, 1) both;
  animation-delay: var(--reveal-delay, 0ms);
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none;
  }
  .emote {
    transition: none;
  }
}

/* Reaction emote: rises out of her head on hover, same easing as the page. */
.emote {
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.8);
  transition:
    opacity 180ms cubic-bezier(0.2, 0, 0, 1),
    transform 180ms cubic-bezier(0.2, 0, 0, 1);
}

.group:hover .emote {
  opacity: 1;
  transform: translate(-50%, 0) scale(1);
}
</style>
