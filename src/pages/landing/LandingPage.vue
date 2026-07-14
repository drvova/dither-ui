<script setup lang="ts">
import { DitherButton, DitherGradient, DitherImage } from "@dither-kit"

const openStudio = () => (window.location.hash = "#/studio")
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

        <div class="reveal mt-20 sm:mt-24" style="--reveal-delay: 300ms">
          <DitherImage
            src="/hero.png"
            alt="Dithered artwork rendered by dither-ui"
            :cell="4"
            :focus-y="0.22"
            :fade="128"
            class="h-72 w-full sm:h-96"
          />
        </div>
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
}
</style>
