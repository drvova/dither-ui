<script lang="ts">
  import {
    DitherCheckbox,
    DitherProgress,
    DitherSlider,
    DitherSwitch,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  let bloom = $state(true)

  let opts = $state({ grid: true, snap: false, rulers: true })

  let level = $state(40)
  let priceRange = $state<[number, number]>([25, 75])
  let quality = $state(60)
  const SLIDER_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const
  let variantLevels = $state<Record<string, number>>({ gradient: 65, dotted: 65, hatched: 65, solid: 65 })

  const SNIPPET_SWITCH = `<script lang="ts">
  import { DitherSwitch } from "@dither-kit-svelte"

  let bloom = $state(true)
<\/script>

<label class="flex items-center justify-between gap-4">
  <span class="text-[13px]">Bloom on hover</span>
  <DitherSwitch bind:value={bloom} label="Bloom on hover" color="blue" />
</label>`

  const SNIPPET_CHECKBOX = `<script lang="ts">
  import { DitherCheckbox } from "@dither-kit-svelte"

  let opts = $state({ grid: true, snap: false, rulers: true })
<\/script>

<div class="grid gap-3">
  <DitherCheckbox bind:value={opts.grid}>Show grid</DitherCheckbox>
  <DitherCheckbox bind:value={opts.snap}>Snap to pixels</DitherCheckbox>
  <DitherCheckbox bind:value={opts.rulers}>Show rulers</DitherCheckbox>
</div>`

  const SNIPPET_SLIDER = `let level = $state(40)
let range = $state<[number, number]>([25, 75])

<!-- single -->
<DitherSlider bind:value={level} label="Level" />

<!-- range: an array value grows a second thumb -->
<DitherSlider bind:value={range} label="Price" showValue />

<!-- ticks mark the steps; variant picks the fill texture -->
<DitherSlider bind:value={quality} label="Quality" step={10} ticks
  variant="dotted" showValue />`

  const SNIPPET_PROGRESS = `<script lang="ts">
  import { DitherProgress } from "@dither-kit-svelte"

  let level = $state(40)
<\/script>

<div class="grid gap-6">
  <DitherProgress value={level} color="blue" />
  <DitherProgress indeterminate color="purple" />
</div>`

  const API: Record<string, PropRow[]> = {
    switch: [
      { prop: "value", type: "boolean", default: "false" },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "disabled", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    checkbox: [
      { prop: "value", type: "boolean", default: "false" },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "disabled", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    slider: [
      { prop: "value", type: "number | [number, number] — array = range", default: "0" },
      { prop: "min / max / step", type: "number", default: "0 / 100 / 1" },
      { prop: "variant", type: '"gradient" | "dotted" | "hatched" | "solid"', default: '"gradient"' },
      { prop: "ticks", type: "boolean — tick columns at steps (≤25) or tenths", default: "false" },
      { prop: "showValue", type: "boolean — bubble while dragging or focused", default: "false" },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "disabled", type: "boolean", default: "false" },
    ],
    progress: [
      { prop: "value", type: "number", default: "0" },
      { prop: "color", type: "PixelColor", default: '"blue"' },
      { prop: "indeterminate", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
  }
</script>

<section id="switch" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Switch</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A toggle whose track is a dithered canvas — the accent gradient fills in
    when on, fades to a muted wash when off.
  </p>
  <DemoCard code={SNIPPET_SWITCH}>
    <div class="mx-auto max-w-sm">
      <label class="flex items-center justify-between gap-4">
        <span class="text-[13px]">Bloom on hover</span>
        <DitherSwitch bind:value={bloom} label="Bloom on hover" color="blue" />
      </label>
    </div>
  </DemoCard>
  <PropsTable rows={API.switch} />
</section>

<section id="checkbox" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Checkbox</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A pixel-border box that fills with the Bayer texture and draws a chunky
    near-white checkmark when checked. Label goes in the default slot.
  </p>
  <DemoCard code={SNIPPET_CHECKBOX}>
    <div class="mx-auto grid max-w-sm gap-3">
      <DitherCheckbox bind:value={opts.grid}>Show grid</DitherCheckbox>
      <DitherCheckbox bind:value={opts.snap}>Snap to pixels</DitherCheckbox>
      <DitherCheckbox bind:value={opts.rulers}>Show rulers</DitherCheckbox>
    </div>
  </DemoCard>
  <PropsTable rows={API.checkbox} />
</section>

<section id="slider" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Slider</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Drag or arrow-key the square thumb — the filled side of the track dithers
    denser toward the value, the rest stays a muted rail.
  </p>
  <DemoCard code={SNIPPET_SLIDER}>
    <div class="mx-auto grid max-w-sm gap-7">
      <div class="flex items-center gap-4">
        <DitherSlider bind:value={level} label="Level" min={0} max={100} step={1} color="blue" />
        <span class="w-8 text-right text-[13px] tabular-nums">{level}</span>
      </div>
      <div class="grid gap-2">
        <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Price range</span>
          <span class="tabular-nums">{priceRange[0]} – {priceRange[1]}</span>
        </div>
        <DitherSlider bind:value={priceRange} label="Price" color="green" showValue />
      </div>
      <div class="grid gap-2">
        <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Quality · step 10 · ticks</span>
          <span class="tabular-nums">{quality}</span>
        </div>
        <DitherSlider bind:value={quality} label="Quality" step={10} ticks showValue color="purple" />
      </div>
    </div>
  </DemoCard>
  <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
  <div class="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
    {#each SLIDER_VARIANTS as v (v)}
      <div>
        <DitherSlider bind:value={variantLevels[v]} label={`${v} slider`} variant={v} />
        <div class="mt-2 text-center text-[10px] text-muted-foreground">{v}</div>
      </div>
    {/each}
  </div>
  <PropsTable rows={API.slider} />
</section>

<section id="progress" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Progress</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A dithered fill that grows with <code class="text-foreground/80">value</code>;
    set <code class="text-foreground/80">indeterminate</code> to scroll a
    texture band instead (static under reduced motion). The bar below is bound
    to the slider above.
  </p>
  <DemoCard code={SNIPPET_PROGRESS}>
    <div class="mx-auto grid max-w-sm gap-6">
      <div class="grid gap-2">
        <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
          <span>Rendering</span>
          <span class="tabular-nums">{level}%</span>
        </div>
        <DitherProgress value={level} color="blue" />
      </div>
      <div class="grid gap-2">
        <span class="text-[11px] text-muted-foreground">Indexing</span>
        <DitherProgress indeterminate color="purple" />
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={API.progress} />
</section>
