<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { DitherButton, DitherGradient } from "@dither-kit"

const openStudio = () => (window.location.hash = "#/studio")

// WALK cycle from the sprite sheet — frame boxes measured from the source png.
const FRAMES = [
  { x: 651, y: 85, w: 114, h: 242 },
  { x: 782, y: 85, w: 115, h: 242 },
  { x: 914, y: 85, w: 115, h: 242 },
  { x: 1045, y: 85, w: 115, h: 242 },
  { x: 1177, y: 85, w: 116, h: 242 },
  { x: 1309, y: 85, w: 115, h: 242 },
]
const FRAME_MS = 140
const spriteRef = ref<HTMLCanvasElement | null>(null)
let raf = 0

onMounted(() => {
  const img = new Image()
  img.src = "/sprites.png"
  img.onload = () => {
    const c = spriteRef.value
    const g = c?.getContext("2d")
    if (!c || !g) return

    // Chroma-key the sheet's near-black background so only the sprite shows.
    const cells = FRAMES.map((f) => {
      const off = document.createElement("canvas")
      off.width = f.w
      off.height = f.h
      const og = off.getContext("2d")!
      og.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h)
      const px = og.getImageData(0, 0, f.w, f.h)
      const d = px.data
      for (let i = 0; i < d.length; i += 4) {
        if (Math.abs(d[i] - 15) + Math.abs(d[i + 1] - 16) + Math.abs(d[i + 2] - 17) < 48)
          d[i + 3] = 0
      }
      og.putImageData(px, 0, 0)
      return off
    })

    c.width = 120
    c.height = 242
    let k = 0
    let last = 0
    const draw = () => {
      const f = cells[k]
      g.clearRect(0, 0, c.width, c.height)
      g.drawImage(f, Math.round((c.width - f.width) / 2), 0)
    }
    draw()
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const tick = (t: number) => {
      if (t - last > FRAME_MS) {
        last = t
        k = (k + 1) % cells.length
        draw()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
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
          Charts, buttons, avatars and gradients — rendered pixel by pixel on canvas.
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

      <!-- Full-bleed runner: she jogs the whole width, along the footer line -->
      <div aria-hidden="true" class="reveal relative h-40 w-full overflow-hidden" style="--reveal-delay: 300ms">
        <canvas
          ref="spriteRef"
          class="runner absolute bottom-0 h-36 w-auto"
          style="image-rendering: pixelated"
        />
      </div>
    </main>

    <!-- Footer: one quiet line, then the wordmark sinking below the fold -->
    <footer class="overflow-hidden border-t border-border/60">
      <div class="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6 text-[11px] text-muted-foreground">
        <span>© {{ new Date().getFullYear() }} dither-ui.com</span>
        <span>MIT</span>
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
  .runner {
    animation: none;
    left: 10%;
  }
}

/* She strolls across the hero — transform only, linear, endless. */
.runner {
  animation: run-across 40s linear infinite;
}

@keyframes run-across {
  from {
    transform: translateX(-160px);
  }
  to {
    transform: translateX(calc(100vw + 40px));
  }
}
</style>
