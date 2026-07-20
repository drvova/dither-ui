<script setup lang="ts">
import {
  DitherAnimatedContent,
  DitherClickSpark,
  DitherElectricBorder,
  DitherFadeContent,
  DitherGlareHover,
  DitherGradualBlur,
  DitherMagnet,
  DitherStarBorder,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const API: Record<string, PropRow[]> = {
  animatedContent: [
    { prop: "distance", type: "number (px)", default: "40" },
    { prop: "direction", type: '"vertical" | "horizontal"', default: '"vertical"' },
    { prop: "reverse", type: "boolean", default: "false" },
    { prop: "duration", type: "number (ms)", default: "800" },
    { prop: "delay", type: "number (ms)", default: "0" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  fadeContent: [
    { prop: "duration", type: "number (ms)", default: "1000" },
    { prop: "delay", type: "number (ms)", default: "0" },
    { prop: "blur", type: "boolean", default: "false" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  gradualBlur: [
    { prop: "position", type: '"bottom" | "top"', default: '"bottom"' },
    { prop: "height", type: "number (px)", default: "96" },
    { prop: "strength", type: "number (px)", default: "4" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  starBorder: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "speed", type: "number (s)", default: "6" },
    { prop: "thickness", type: "number (px)", default: "1" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  electricBorder: [
    { prop: "color", type: "string (hex)", default: '"#5227FF"' },
    { prop: "speed", type: "number", default: "1" },
    { prop: "thickness", type: "number (px)", default: "2" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  glareHover: [{ prop: "default slot", type: "content", default: "—" }],
  magnet: [
    { prop: "strength", type: "number (0-1)", default: "0.4" },
    { prop: "radius", type: "number (px)", default: "200" },
    { prop: "default slot", type: "content", default: "—" },
  ],
  clickSpark: [
    { prop: "color", type: "string (hex)", default: '"#7CFF67"' },
    { prop: "count", type: "number", default: "8" },
    { prop: "size", type: "number (px)", default: "16" },
    { prop: "duration", type: "number (ms)", default: "420" },
    { prop: "default slot", type: "content", default: "—" },
  ],
}

const SNIPPETS = {
  animatedContent: `<DitherAnimatedContent :distance="40" direction="vertical">
  <YourCard />
</DitherAnimatedContent>`,
  fadeContent: `<DitherFadeContent :blur="true">
  <YourCard />
</DitherFadeContent>`,
  gradualBlur: `<DitherGradualBlur position="bottom" :height="96">
  <ScrollingList />
</DitherGradualBlur>`,
  starBorder: `<DitherStarBorder color="#7CFF67">Star border</DitherStarBorder>`,
  electricBorder: `<DitherElectricBorder color="#5227FF">Electric border</DitherElectricBorder>`,
  glareHover: `<DitherGlareHover><YourCard /></DitherGlareHover>`,
  magnet: `<DitherMagnet :strength="0.4"><button>Magnet</button></DitherMagnet>`,
  clickSpark: `<DitherClickSpark color="#7CFF67"><YourArea /></DitherClickSpark>`,
}

const cardBox = "grid h-28 w-52 place-items-center rounded-lg border border-border/60 bg-card text-sm text-muted-foreground"
</script>

<template>
  <!-- Animated content -->
  <section id="animated-content" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Animated content</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Wrap anything to have it slide and fade into place the first time it enters
      the viewport. Direction, distance and timing are configurable.
    </p>
    <DemoCard :code="SNIPPETS.animatedContent">
      <DitherAnimatedContent :distance="40"><div :class="cardBox">Slides up on view</div></DitherAnimatedContent>
    </DemoCard>
    <PropsTable :rows="API.animatedContent" />
  </section>

  <!-- Fade content -->
  <section id="fade-content" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Fade content</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A pure fade-in on view, optionally de-blurring as it appears. The lighter
      cousin of Animated content when you only want opacity.
    </p>
    <DemoCard :code="SNIPPETS.fadeContent">
      <DitherFadeContent :blur="true"><div :class="cardBox">Fades in on view</div></DitherFadeContent>
    </DemoCard>
    <PropsTable :rows="API.fadeContent" />
  </section>

  <!-- Gradual blur -->
  <section id="gradual-blur" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Gradual blur</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A masked <code class="text-foreground/80">backdrop-filter</code> strip that
      progressively blurs toward an edge — the iOS-style soft fade over a scroll
      region.
    </p>
    <DemoCard :code="SNIPPETS.gradualBlur">
      <DitherGradualBlur position="bottom" :height="72" :strength="5" class="w-64">
        <div class="space-y-1 text-[13px] leading-relaxed text-muted-foreground">
          <p v-for="n in 6" :key="n">Row {{ n }} — content scrolls under the blur band.</p>
        </div>
      </DitherGradualBlur>
    </DemoCard>
    <PropsTable :rows="API.gradualBlur" />
  </section>

  <!-- Star border -->
  <section id="star-border" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Star border</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A rounded frame with two bright glints traveling its top and bottom edges —
      a subtle animated outline for a CTA or badge.
    </p>
    <DemoCard :code="SNIPPETS.starBorder">
      <DitherStarBorder color="#7CFF67">Star border</DitherStarBorder>
    </DemoCard>
    <PropsTable :rows="API.starBorder" />
  </section>

  <!-- Electric border -->
  <section id="electric-border" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Electric border</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An SVG turbulence filter jitters the frame edge into a crackling electric
      outline. Reduced motion drops the displacement.
    </p>
    <DemoCard :code="SNIPPETS.electricBorder">
      <DitherElectricBorder color="#5227FF">Electric border</DitherElectricBorder>
    </DemoCard>
    <PropsTable :rows="API.electricBorder" />
  </section>

  <!-- Glare hover -->
  <section id="glare-hover" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Glare hover</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A diagonal sheen sweeps across the surface on hover — the glossy-card
      reflection, done with a single masked gradient. Hover the card.
    </p>
    <DemoCard :code="SNIPPETS.glareHover">
      <DitherGlareHover><div :class="cardBox">Hover me</div></DitherGlareHover>
    </DemoCard>
    <PropsTable :rows="API.glareHover" />
  </section>

  <!-- Magnet -->
  <section id="magnet" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Magnet</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The wrapped element is pulled toward the pointer while it is within range,
      easing back when the cursor leaves. Move your cursor near the button.
    </p>
    <DemoCard :code="SNIPPETS.magnet">
      <DitherMagnet :strength="0.4">
        <button type="button" class="rounded-md border border-border/60 bg-card px-4 py-2 text-sm">Magnet</button>
      </DitherMagnet>
    </DemoCard>
    <PropsTable :rows="API.magnet" />
  </section>

  <!-- Click spark -->
  <section id="click-spark" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Click spark</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A burst of spark lines radiates from every click inside the area, drawn on a
      lightweight canvas overlay. Click anywhere in the preview.
    </p>
    <DemoCard :code="SNIPPETS.clickSpark">
      <DitherClickSpark color="#7CFF67" class="grid h-40 w-full place-items-center rounded-lg border border-border/60">
        <span class="text-sm text-muted-foreground">Click anywhere here</span>
      </DitherClickSpark>
    </DemoCard>
    <PropsTable :rows="API.clickSpark" />
  </section>
</template>
