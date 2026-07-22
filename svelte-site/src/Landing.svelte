<script lang="ts">
  import { onMount } from "svelte"
  import {
    Area,
    AreaChart,
    cssColor,
    Aurora,
    DarkVeil,
    DitherAvatar,
    DitherButton,
    DitherConsole,
    DitherGradient,
    DitherIsland,
    ShinyText,
    type DitherColor,
  } from "@dither-kit-svelte"

  const version = "0.1.0"
  const DOCS = "#/docs"
  const STUDIO = "https://dither-ui.com/studio"
  const GITHUB = "https://github.com/drvova/dither-ui"

  const teaser = Array.from({ length: 18 }, (_, i) => ({
    v: 5 + Math.sin(i * 0.7) * 2 + Math.sin(i * 1.6) * 1,
  }))
  const teaserConfig = { v: { color: "blue" as DitherColor } }
  const swatches: DitherColor[] = ["green", "blue", "purple", "pink", "orange", "red", "grey"]

  const openStudio = () => location.assign(STUDIO)

  // Portraits + their reaction emotes, cropped from faces.webp — a thin band
  // sliced out of the source sheet so the landing loads ~70KB instead of the
  // full sheet. Y boxes are relative to the band.
  const FACE_Y = 0
  const FACE_H = 126
  const FACES = [
    { x: 29, w: 97, emote: { x: 1503, y: 25, w: 51, h: 49 } },
    { x: 147, w: 97, emote: { x: 1273, y: 27, w: 42, h: 38 } },
    { x: 262, w: 95, emote: { x: 1270, y: 92, w: 36, h: 41 } },
    { x: 378, w: 98, emote: { x: 1529, y: 98, w: 25, h: 27 } },
    { x: 497, w: 96, emote: { x: 1458, y: 24, w: 20, h: 47 } },
    { x: 832, w: 94, emote: { x: 1334, y: 23, w: 40, h: 40 } },
  ]

  let faceEls: HTMLCanvasElement[] = []
  let emoteEls: HTMLCanvasElement[] = []

  function blit(
    c: HTMLCanvasElement,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    c.getContext("2d")?.drawImage(img, x, y, w, h, 0, 0, c.width, c.height)
  }

  onMount(() => {
    const img = new Image()
    img.src = "/faces.webp"
    img.onload = () => {
      FACES.forEach((f, i) => {
        const face = faceEls[i]
        const emote = emoteEls[i]
        if (face) blit(face, img, f.x, FACE_Y, f.w, FACE_H)
        if (emote) blit(emote, img, f.emote.x, f.emote.y, f.emote.w, f.emote.h)
      })
    }
  })
</script>

<div class="flex min-h-screen flex-col bg-background font-mono text-foreground antialiased">
  <!-- Header -->
  <header class="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6 text-xs">
    <span class="tracking-tight">dither-ui <span class="text-muted-foreground">/ svelte</span></span>
    <nav class="flex items-center gap-5 text-muted-foreground">
      <a href={DOCS} class="-m-3 p-3 transition-colors hover:text-foreground">docs</a>
      <a href={GITHUB} target="_blank" rel="noreferrer" class="-m-3 p-3 transition-colors hover:text-foreground">github</a>
      <a href={STUDIO} class="-m-3 p-3 transition-colors hover:text-foreground">studio →</a>
    </nav>
  </header>

  <!-- Hero: one statement, one action, one visual. -->
  <main class="relative isolate flex flex-1 flex-col overflow-hidden">
    <DarkVeil
      colors={["#05060a", "#0c1730", "#2f6fd0"]}
      scale={2.6}
      speed={0.15}
      intensity={1.5}
      vignette={0.9}
      class="pointer-events-none absolute inset-0 -z-10"
    />
    <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 pt-24 pb-14 sm:pt-32">
      <h1 class="reveal max-w-xl text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.15] tracking-tight text-balance">
        A dithered UI toolkit for Svelte.
      </h1>
      <p class="reveal mt-5 max-w-md text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]" style="--reveal-delay: 90ms">
        Charts, buttons, avatars and gradients — rendered
        <em class="text-foreground/80">pixel by pixel</em> on canvas, in Svelte 5
        runes with no legacy API. The full Vue kit, re-expressed.
      </p>
      <div class="reveal mt-10" style="--reveal-delay: 180ms">
        <DitherButton color="blue" variant="gradient" class="px-6 py-3 text-[13px] transition-transform active:scale-[0.96]" onclick={openStudio}>
          Open studio
        </DitherButton>
      </div>
    </div>

    <!-- Six moods, one row — hover a face and her emote answers -->
    <p class="reveal pb-6 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70" style="--reveal-delay: 260ms">
      expressions
    </p>
    <div role="img" aria-label="Pixel-art character portraits in six expressions" class="reveal flex flex-wrap justify-center gap-7 pb-16" style="--reveal-delay: 300ms">
      {#each FACES as f, i (i)}
        <div class="group relative pt-10">
          <canvas bind:this={faceEls[i]} style:width="{f.w}px" style:height="{FACE_H}px"></canvas>
          <canvas bind:this={emoteEls[i]} class="emote absolute top-0 left-1/2" style:width="{f.emote.w}px" style:height="{f.emote.h}px"></canvas>
        </div>
      {/each}
    </div>
  </main>

  <!-- Inside the kit: six quiet tiles -->
  <section class="border-t border-border/60">
    <div class="mx-auto w-full max-w-4xl px-6 py-20">
      <div class="flex items-baseline justify-between">
        <p class="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">inside the kit</p>
        <a href={DOCS} class="-m-3 p-3 text-[11px] text-muted-foreground transition-colors hover:text-foreground">read the docs →</a>
      </div>
      <div class="mt-12 grid gap-x-12 gap-y-14 sm:grid-cols-3">
        <a href={DOCS} class="group block">
          <div inert class="h-24 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-80">
            <AreaChart data={teaser} config={teaserConfig} seed={1984} interactive={false} margins={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <Area dataKey="v" variant="gradient" />
            </AreaChart>
          </div>
          <h3 class="mt-5 text-[13px] text-foreground/90 transition-colors group-hover:text-foreground">Charts</h3>
          <p class="mt-1.5 text-[11px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Area, line, bar, pie and radar — composed from parts, dithered per cell.
          </p>
        </a>
        <a href={DOCS} class="group block">
          <div inert class="flex h-24 flex-wrap content-center gap-2 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-80">
            <DitherButton color="blue" variant="gradient" bloom={1984}>Save</DitherButton>
            <DitherButton color="green" variant="solid" bloom={7}>Run</DitherButton>
            {#each ["ada", "grace"] as n (n)}
              <DitherAvatar name={n} size={32} />
            {/each}
          </div>
          <h3 class="mt-5 text-[13px] text-foreground/90 transition-colors group-hover:text-foreground">Primitives</h3>
          <p class="mt-1.5 text-[11px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Buttons, avatars, gradients and images — every fill drawn on canvas.
          </p>
        </a>
        <a href={DOCS} class="group block">
          <div inert class="flex h-24 content-center items-center gap-3 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-80">
            {#each swatches as c (c)}
              <span
                class="size-5 rounded-[3px]"
                style:background-image={`radial-gradient(${cssColor(c)} 1.1px, transparent 1.1px), radial-gradient(${cssColor(c)} 0.8px, transparent 0.8px)`}
                style:background-size="4px 4px, 4px 4px"
                style:background-position="0 0, 2px 2px"
              ></span>
            {/each}
          </div>
          <h3 class="mt-5 text-[13px] text-foreground/90 transition-colors group-hover:text-foreground">One palette</h3>
          <p class="mt-1.5 text-[11px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Seven seeds; fill, line and sparkle hues resolve from the same source.
          </p>
        </a>
        <a href={`${DOCS}/dither-shell`} class="group block">
          <div inert class="h-24 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-80">
            <DitherConsole
              lines={[{ text: "$ vite build" }, { text: "built in 4.2s", level: "success" }]}
              title="console"
              caret
              follow={false}
              class="h-full"
            />
          </div>
          <h3 class="mt-5 text-[13px] text-foreground/90 transition-colors group-hover:text-foreground">Layout</h3>
          <p class="mt-1.5 text-[11px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Shell, rail, console, canvas, grid — dashboards composed from slots.
          </p>
        </a>
        <a href={`${DOCS}/island`} class="group block">
          <div inert class="flex h-24 items-center transition-opacity duration-200 group-hover:opacity-100 sm:opacity-80">
            <DitherIsland label="Deploy running" color="green" live class="w-full max-w-56">
              Build 214 · 3 of 5 steps done.
            </DitherIsland>
          </div>
          <h3 class="mt-5 text-[13px] text-foreground/90 transition-colors group-hover:text-foreground">Motion</h3>
          <p class="mt-1.5 text-[11px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Islands, decks, docks, palettes — gestures on the kit's own math.
          </p>
        </a>
        <a href={`${DOCS}/aurora`} class="group block">
          <div inert class="h-24 overflow-hidden rounded-md border border-border/60 transition-opacity duration-200 group-hover:opacity-100 sm:opacity-80">
            <Aurora class="h-full w-full" />
          </div>
          <h3 class="mt-5 text-[13px] text-foreground/90 transition-colors group-hover:text-foreground">Backgrounds</h3>
          <p class="mt-1.5 text-[11px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
            Fifty generative surfaces — aurora to terminal, one Bayer engine.
          </p>
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="relative isolate overflow-hidden border-t border-border/60">
    <DitherGradient from="blue" to="transparent" direction="up" opacity={0.2} cell={4} renderMode="static" class="-z-10" />
    <div class="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6 text-[11px] text-muted-foreground">
      <span>© {new Date().getFullYear()} dither-ui.com</span>
      <div class="flex items-center gap-4">
        <a href={GITHUB} target="_blank" rel="noreferrer" class="transition-colors hover:text-foreground">GitHub</a>
        <span class="tabular-nums">v{version} · MIT</span>
      </div>
    </div>
    <div aria-hidden="true" class="pointer-events-none -mb-[0.34em] select-none text-center text-[clamp(5rem,19vw,15rem)] leading-none font-medium tracking-tighter whitespace-nowrap">
      <ShinyText speed={0.12} class="opacity-[0.07]">dither-ui</ShinyText>
    </div>
  </footer>
</div>

<style>
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
  @media (prefers-reduced-motion: reduce) {
    .reveal {
      animation: none;
    }
    .emote {
      transition: none;
    }
  }
</style>
