<script setup lang="ts">
import { ref } from "vue"
import {
  DitherBadge,
  DitherButton,
  DitherSeparator,
  DitherSkeleton,
  DitherSpinner,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const VARIANTS = ["gradient", "solid", "dotted", "hatched"] as const

const SNIPPET_BADGE = `<DitherBadge color="green">stable</DitherBadge>
<DitherBadge color="blue">new</DitherBadge>
<DitherBadge color="orange">beta</DitherBadge>
<DitherBadge color="red">deprecated</DitherBadge>

<!-- variants -->
<DitherBadge variant="gradient">gradient</DitherBadge>
<DitherBadge variant="solid">solid</DitherBadge>
<DitherBadge variant="dotted">dotted</DitherBadge>
<DitherBadge variant="hatched">hatched</DitherBadge>`

const SNIPPET_SKELETON = `<div class="rounded-lg border p-5">
  <div class="flex items-center gap-3">
    <DitherSkeleton class="size-10 rounded-full" />
    <div class="grid flex-1 gap-2">
      <DitherSkeleton class="h-3 w-2/3 rounded" />
      <DitherSkeleton class="h-3 w-1/3 rounded" />
    </div>
  </div>
  <DitherSkeleton class="mt-4 h-24 w-full rounded" />
</div>`

// Each seed is a different spinner FORM — arc, dots, petals, thin comet.
const spinnerSeeds = ref([3, 17, 42, 128, 777, 2024])
const rerollSpinners = () => {
  spinnerSeeds.value = spinnerSeeds.value.map(() => Math.floor(Math.random() * 100000))
}
const SNIPPET_SPINNER = `<!-- default: a clean rotating arc -->
<DitherSpinner :size="20" />

<!-- a seed picks the FORM — arc, ring of dots, rotating petals, thin comet -->
<DitherSpinner :seed="42" :size="28" />
<DitherSpinner :seed="777" color="green" />
<DitherSpinner render-mode="static" precompiled="/spinner.png" />`
const SNIPPET_SEPARATOR = `<p>Charts render on canvas.</p>
<DitherSeparator class="my-4" />
<p>Fills threshold the same Bayer matrix.</p>

<!-- vertical -->
<div class="flex h-5 items-center gap-4">
  <span>docs</span>
  <DitherSeparator orientation="vertical" />
  <span>studio</span>
</div>`

const API: Record<string, PropRow[]> = {
  badge: [
    { prop: "color", type: "PixelColor", default: '"blue"' },
    {
      prop: "variant",
      type: '"gradient" | "solid" | "dotted" | "hatched"',
      default: '"gradient"',
    },
    { prop: "class", type: "string", default: "—" },
  ],
  skeleton: [{ prop: "class", type: "string", default: "—" }],
  spinner: [
    { prop: "size", type: "number (px)", default: "20" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "seed", type: "number — samples a spinner form", default: "clean arc" },
    { prop: "render-mode", type: '"live" | "static"', default: '"live"' },
    { prop: "precompiled", type: "string | { src: string; width?: number; height?: number }", default: "undefined" },
  ],
  separator: [
    {
      prop: "orientation",
      type: '"horizontal" | "vertical"',
      default: '"horizontal"',
    },
    { prop: "class", type: "string", default: "—" },
  ],
}
</script>

<template>
  <!-- Badge -->
  <section id="badge" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Badge</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A small label chip — the button's dither fill at rest, no hover machinery,
      any palette color and texture variant.
    </p>
    <DemoCard :code="SNIPPET_BADGE">
      <div class="grid gap-5">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <DitherBadge color="green">stable</DitherBadge>
          <DitherBadge color="blue">new</DitherBadge>
          <DitherBadge color="orange">beta</DitherBadge>
          <DitherBadge color="red">deprecated</DitherBadge>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <DitherBadge v-for="v in VARIANTS" :key="v" color="blue" :variant="v">
            {{ v }}
          </DitherBadge>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.badge" />
  </section>

  <!-- Skeleton -->
  <section id="skeleton" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Skeleton</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A loading placeholder that shimmers pixel-by-pixel — the field's density
      breathes through the Bayer matrix instead of a gradient sweep. Size it
      with classes and compose it into any layout.
    </p>
    <DemoCard :code="SNIPPET_SKELETON">
      <div class="mx-auto max-w-xs rounded-lg border border-border/60 p-5">
        <div class="flex items-center gap-3">
          <DitherSkeleton class="size-10 rounded-full" />
          <div class="grid flex-1 gap-2">
            <DitherSkeleton class="h-3 w-2/3 rounded" />
            <DitherSkeleton class="h-3 w-1/3 rounded" />
          </div>
        </div>
        <DitherSkeleton class="mt-4 h-24 w-full rounded" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.skeleton" />
  </section>

  <!-- Spinner -->
  <section id="spinner" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Spinner</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A dithered loader, repainted at 30fps. It's not one shape — a seed samples
      three axes at once: the <em class="text-foreground/80 not-italic">silhouette</em>
      (circle ring, square box-ring, or bar), the
      <em class="text-foreground/80 not-italic">flow</em> (sweep like a comet, pulse
      breathing, or a travelling wave), and the detail (dashes, petals, thickness).
      So every seed is a genuinely different loader — a rotating ring, a breathing
      square, dashes racing a bar. Static under reduced motion.
    </p>
    <DemoCard :code="SNIPPET_SPINNER">
      <div class="grid gap-6">
        <div class="flex items-center justify-center gap-6">
          <DitherSpinner :size="16" />
          <DitherSpinner :size="20" />
          <DitherSpinner :size="28" />
          <span class="text-[11px] text-muted-foreground">default arc</span>
        </div>
        <div class="flex flex-wrap items-center justify-center gap-6">
          <DitherSpinner v-for="(sd, i) in spinnerSeeds" :key="i" :seed="sd" :size="32" :color="(['blue','green','purple','orange','pink','red'] as const)[i % 6]" />
        </div>
        <div class="flex justify-center">
          <DitherButton color="blue" variant="gradient" @click="rerollSpinners">Roll new spinners</DitherButton>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.spinner" />
  </section>

  <!-- Separator -->
  <section id="separator" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Separator</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A 2px rule whose pixels dissolve toward both ends through the Bayer
      matrix — the image component's edge fade, applied to a divider.
    </p>
    <DemoCard :code="SNIPPET_SEPARATOR">
      <div class="mx-auto max-w-sm">
        <p class="text-[12px] text-muted-foreground">Charts render on canvas.</p>
        <DitherSeparator class="my-4" />
        <p class="text-[12px] text-muted-foreground">
          Fills threshold the same Bayer matrix.
        </p>
        <div class="mt-6 flex h-5 items-center justify-center gap-4">
          <span class="text-[11px]">docs</span>
          <DitherSeparator orientation="vertical" />
          <span class="text-[11px]">studio</span>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.separator" />
  </section>
</template>
