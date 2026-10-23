<script setup lang="ts">
import { routePath } from "@/shared/lib"
import { DitherWorld, Grid, Legend, Line, LineChart, XAxis, YAxis, sampleWorld, type DitherColor } from "@dither-kit"
import ClayzoFilm from "./ClayzoFilm.vue"
import PixelPlate from "./PixelPlate.vue"
import { FAMILIES, SECTION_COUNT } from "./hub"
import { catalogLayout, catalogPlate, dawnPlate } from "./plates"

// Inside the kit: one centred column of previews, each the kit as itself —
// a Clayzo film rendered through the kit's dither rule (films/), the kit's
// 3D raster or a chart live, or the page's portraits (a slot: their shake
// lives on the page) — in a framed screen, captioned with a name and one
// line. Films keep their own aspect; the dawn and catalog films carry their
// plates as stand-ins, cell for cell.
const WORLD = sampleWorld(7)
const RAMP = ["#0c1730", "#1e429f", "#2f6fd0", "#7ba3ee", "#c9dbff"]
const DAWN = dawnPlate()
const CATALOG = catalogPlate(FAMILIES.map((f) => f.count))
const CATALOG_LAYOUT = catalogLayout(FAMILIES.map((f) => f.count))

const ROWS = [
  { month: "Jan", renders: 46, seeds: 28 },
  { month: "Feb", renders: 52, seeds: 31 },
  { month: "Mar", renders: 49, seeds: 36 },
  { month: "Apr", renders: 58, seeds: 34 },
  { month: "May", renders: 64, seeds: 41 },
  { month: "Jun", renders: 61, seeds: 47 },
  { month: "Jul", renders: 72, seeds: 44 },
  { month: "Aug", renders: 78, seeds: 52 },
  { month: "Sep", renders: 74, seeds: 58 },
  { month: "Oct", renders: 86, seeds: 55 },
  { month: "Nov", renders: 92, seeds: 63 },
  { month: "Dec", renders: 88, seeds: 70 },
]
const CONFIG = {
  renders: { label: "renders", color: "blue" as DitherColor },
  seeds: { label: "seeds", color: "purple" as DitherColor },
}
</script>

<template>
  <section aria-labelledby="inside-h" class="inside mx-auto w-full px-6">
    <div class="inside-head reveal">
      <h2 id="inside-h" class="section-h">Inside the kit</h2>
      <p class="section-p">Every surface below is the kit itself, running.</p>
    </div>

    <figure class="item reveal">
      <div class="frame">
        <ClayzoFilm
          film="hero"
          chip
          label="A dithered dashboard tips into an isometric exploded view of its paint layers, re-seeds its data, flips its switch, presses its button and folds back flat."
          class="screen"
          style="aspect-ratio: 8 / 5"
        />
      </div>
      <figcaption class="caption">
        <a :href="routePath('/studio')" class="caption-name">Layers</a>
        <span class="caption-line">One board, four paint layers, one dither rule.</span>
      </figcaption>
    </figure>

    <figure class="item reveal">
      <div class="frame">
        <ClayzoFilm
          film="studio"
          chip
          label="A cursor places three artboards on the Studio's dotted canvas — a bar chart, a line chart, a button — selects them, and they drain away."
          class="screen"
          style="aspect-ratio: 8 / 5"
        />
      </div>
      <figcaption class="caption">
        <a :href="routePath('/studio')" class="caption-name">Studio</a>
        <span class="caption-line">An infinite canvas your agent can drive.</span>
      </figcaption>
    </figure>

    <figure class="item reveal">
      <div class="frame">
        <ClayzoFilm
          film="reel"
          chip
          label="A film strip runs past an ember playhead; each frame holds one moment of a bouncing ball."
          class="screen"
          style="aspect-ratio: 8 / 5"
        />
      </div>
      <figcaption class="caption">
        <a :href="routePath('/docs/motion')" class="caption-name">Reel</a>
        <span class="caption-line">Every frame exports as a deterministic MP4.</span>
      </figcaption>
    </figure>

    <figure class="item reveal">
      <div class="frame">
        <div class="screen" style="aspect-ratio: 8 / 5">
          <span class="live" aria-hidden="true"><i></i>live · 12 fps</span>
          <DitherWorld
            :source="WORLD"
            :colors="RAMP"
            :auto-rotate="14"
            :grain="0.4"
            :frame-rate="12"
            label="A seeded 3D probe turning slowly, rendered through the kit's Bayer cells"
            class="h-full"
          />
        </div>
      </div>
      <figcaption class="caption">
        <a :href="routePath('/docs/world')" class="caption-name">World</a>
        <span class="caption-line">glTF, OBJ, STL and VRML through the same Bayer cells.</span>
      </figcaption>
    </figure>

    <figure class="item reveal">
      <div class="frame">
        <div class="screen chart">
          <LineChart :data="ROWS" :config="CONFIG" :interactive="false" :sparkles="false">
            <Grid horizontal />
            <XAxis data-key="month" :max-ticks="6" />
            <YAxis :tick-count="4" />
            <Line data-key="renders" />
            <Line data-key="seeds" />
            <Legend align="right" />
          </LineChart>
        </div>
      </div>
      <figcaption class="caption">
        <a :href="routePath('/docs/area')" class="caption-name">Charts</a>
        <span class="caption-line">Seeded and deterministic: a seed replays a fill forever.</span>
      </figcaption>
    </figure>

    <figure class="item reveal">
      <div class="frame">
        <ClayzoFilm
          film="catalog"
          chip
          :label="`The docs catalog as a night skyline: ${SECTION_COUNT} lit windows, one per section, in a tower per family; windows switch on and off and a new section falls onto the tallest roof.`"
          class="screen"
          :style="{ aspectRatio: `${CATALOG_LAYOUT.w} / ${CATALOG_LAYOUT.h}` }"
        >
          <template #fallback><PixelPlate :plate="CATALOG" motion="rise" fit="xMidYMax meet" class="block size-full" /></template>
        </ClayzoFilm>
      </div>
      <figcaption class="caption">
        <a href="#directory" class="caption-name">Catalog</a>
        <span class="caption-line">{{ SECTION_COUNT }} sections, one lit window each.</span>
      </figcaption>
    </figure>

    <figure class="item reveal">
      <div class="frame">
        <ClayzoFilm
          film="dawn"
          chip
          label="Dawn over a dithered planet: the sun breathes on the limb, an aurora sways over the far side, seed moons cross the sky and stars flicker."
          class="screen"
          style="aspect-ratio: 168 / 46"
        >
          <template #fallback><PixelPlate :plate="DAWN" fit="xMidYMax meet" class="block size-full" /></template>
        </ClayzoFilm>
      </div>
      <figcaption class="caption">
        <a :href="routePath('/docs/motion')" class="caption-name">Films</a>
        <span class="caption-line">Any animation, rendered through the kit's dither rule.</span>
      </figcaption>
    </figure>

    <figure class="item reveal">
      <div class="frame">
        <div class="screen faces"><slot name="faces" /></div>
      </div>
      <figcaption class="caption">
        <a :href="routePath('/docs/image')" class="caption-name">Faces</a>
        <span class="caption-line">Pixel art that answers the cursor.</span>
      </figcaption>
    </figure>
  </section>
</template>

<style scoped>
/* One centred column: a heading, then the previews on the page's one
   rhythm. */
.inside {
  display: flex;
  flex-direction: column;
  gap: clamp(2.5rem, 6vw, 4rem);
  max-width: calc(var(--column) + 3rem);
  padding-block: var(--section);
}

.item {
  margin: 0;
}

.chart {
  padding: 18px 18px 10px;
  height: clamp(15rem, 34vw, 19rem);
}

.faces {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.25rem, 4vw, 2.5rem) 12px;
}
</style>
