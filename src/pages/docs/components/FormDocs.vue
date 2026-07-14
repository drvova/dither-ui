<script setup lang="ts">
import { reactive, ref } from "vue"
import {
  DitherCheckbox,
  DitherProgress,
  DitherSlider,
  DitherSwitch,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const bloom = ref(true)

const opts = reactive({ grid: true, snap: false, rulers: true })

const level = ref(40)

const SNIPPET_SWITCH = `<script setup lang="ts">
import { ref } from "vue"
import { DitherSwitch } from "@dither-kit"

const bloom = ref(true)
<\/script>

<template>
  <label class="flex items-center justify-between gap-4">
    <span class="text-[13px]">Bloom on hover</span>
    <DitherSwitch v-model="bloom" label="Bloom on hover" color="blue" />
  </label>
</template>`

const SNIPPET_CHECKBOX = `<script setup lang="ts">
import { reactive } from "vue"
import { DitherCheckbox } from "@dither-kit"

const opts = reactive({ grid: true, snap: false, rulers: true })
<\/script>

<template>
  <div class="grid gap-3">
    <DitherCheckbox v-model="opts.grid">Show grid</DitherCheckbox>
    <DitherCheckbox v-model="opts.snap">Snap to pixels</DitherCheckbox>
    <DitherCheckbox v-model="opts.rulers">Show rulers</DitherCheckbox>
  </div>
</template>`

const SNIPPET_SLIDER = `<script setup lang="ts">
import { ref } from "vue"
import { DitherSlider } from "@dither-kit"

const level = ref(40)
<\/script>

<template>
  <div class="flex items-center gap-4">
    <DitherSlider v-model="level" label="Level" :min="0" :max="100" :step="1" />
    <span class="text-[13px] tabular-nums">{{ level }}</span>
  </div>
</template>`

const SNIPPET_PROGRESS = `<script setup lang="ts">
import { ref } from "vue"
import { DitherProgress } from "@dither-kit"

const level = ref(40)
<\/script>

<template>
  <div class="grid gap-6">
    <DitherProgress :value="level" color="blue" />
    <DitherProgress indeterminate color="purple" />
  </div>
</template>`

const API: Record<string, PropRow[]> = {
  switch: [
    { prop: "modelValue", type: "boolean", default: "—" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  checkbox: [
    { prop: "modelValue", type: "boolean", default: "—" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  slider: [
    { prop: "modelValue", type: "number", default: "—" },
    { prop: "min", type: "number", default: "0" },
    { prop: "max", type: "number", default: "100" },
    { prop: "step", type: "number", default: "1" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "disabled", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  progress: [
    { prop: "value", type: "number", default: "0" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "indeterminate", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
}
</script>

<template>
  <section id="switch" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Switch</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A toggle whose track is a dithered canvas — the accent gradient fills in
      when on, fades to a muted wash when off.
    </p>
    <DemoCard :code="SNIPPET_SWITCH">
      <div class="mx-auto max-w-sm">
        <label class="flex items-center justify-between gap-4">
          <span class="text-[13px]">Bloom on hover</span>
          <DitherSwitch v-model="bloom" label="Bloom on hover" color="blue" />
        </label>
      </div>
    </DemoCard>
    <PropsTable :rows="API.switch" />
  </section>

  <section id="checkbox" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Checkbox</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A pixel-border box that fills with the Bayer texture and draws a chunky
      near-white checkmark when checked. Label goes in the default slot.
    </p>
    <DemoCard :code="SNIPPET_CHECKBOX">
      <div class="mx-auto grid max-w-sm gap-3">
        <DitherCheckbox v-model="opts.grid">Show grid</DitherCheckbox>
        <DitherCheckbox v-model="opts.snap">Snap to pixels</DitherCheckbox>
        <DitherCheckbox v-model="opts.rulers">Show rulers</DitherCheckbox>
      </div>
    </DemoCard>
    <PropsTable :rows="API.checkbox" />
  </section>

  <section id="slider" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Slider</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Drag or arrow-key the square thumb — the filled side of the track dithers
      denser toward the value, the rest stays a muted rail.
    </p>
    <DemoCard :code="SNIPPET_SLIDER">
      <div class="mx-auto flex max-w-sm items-center gap-4">
        <DitherSlider v-model="level" label="Level" :min="0" :max="100" :step="1" color="blue" />
        <span class="w-8 text-right text-[13px] tabular-nums">{{ level }}</span>
      </div>
    </DemoCard>
    <PropsTable :rows="API.slider" />
  </section>

  <section id="progress" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Progress</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A dithered fill that grows with <code class="text-foreground/80">value</code>;
      set <code class="text-foreground/80">indeterminate</code> to scroll a
      texture band instead (static under reduced motion). The bar below is bound
      to the slider above.
    </p>
    <DemoCard :code="SNIPPET_PROGRESS">
      <div class="mx-auto grid max-w-sm gap-6">
        <div class="grid gap-2">
          <div class="flex items-baseline justify-between text-[11px] text-muted-foreground">
            <span>Rendering</span>
            <span class="tabular-nums">{{ level }}%</span>
          </div>
          <DitherProgress :value="level" color="blue" />
        </div>
        <div class="grid gap-2">
          <span class="text-[11px] text-muted-foreground">Indexing</span>
          <DitherProgress indeterminate color="purple" />
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.progress" />
  </section>
</template>
