<script setup lang="ts">
import { DitherBox, DitherDivider, DitherText, DitherVisuallyHidden } from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const SNIPPET_BOX = `<DitherBox as="section" class="rounded-lg border border-border/60 bg-card/40 p-5">
  <span class="text-[13px]">Content lands in a typed container.</span>
</DitherBox>`

const SNIPPET_TEXT = `<DitherText tone="muted" size="sm">Default paragraph tone.</DitherText>
<DitherText as="span" tone="faint" size="xs">Caption-weight aside.</DitherText>
<DitherText as="h3" size="lg">A heading in the native scale.</DitherText>`

const SNIPPET_DIVIDER = `<p>Charts render on canvas.</p>
<DitherDivider class="my-4" />
<p>Fills threshold the same Bayer matrix.</p>

<!-- vertical: stretches inside a flex row -->
<div class="flex h-10 items-center gap-4">
  <span class="text-[12px]">Left</span>
  <DitherDivider orientation="vertical" />
  <span class="text-[12px]">Right</span>
</div>`

const SNIPPET_HIDDEN = `<DitherVisuallyHidden>
  Extra context that only a screen reader should read.
</DitherVisuallyHidden>

<!-- focusable: the skip-link pattern — Tab reveals it -->
<DitherVisuallyHidden focusable>Skip to content</DitherVisuallyHidden>`

const API: Record<string, PropRow[]> = {
  box: [{ prop: "as", type: '"div" | "section" | "span" | "article" | …', default: '"div"' }],
  text: [
    { prop: "as", type: '"p" | "span" | "h3" | "li" | …', default: '"p"' },
    { prop: "tone", type: '"default" | "muted" | "faint"', default: '"default"' },
    { prop: "size", type: '"xs" | "sm" | "md" | "lg" (11–15px)', default: "—" },
  ],
  divider: [{ prop: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"' }],
  visuallyHidden: [{ prop: "focusable", type: "boolean", default: "false" }],
}
</script>

<template>
  <!-- Box -->
  <section id="box" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Box</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      One element, one job: a typed container whose whole style arrives as
      <code class="text-foreground/80">class</code>. Swap the tag with
      <code class="text-foreground/80">as</code> — landmarks for structure,
      spans for inline flow — and the slot never notices.
    </p>
    <DemoCard :code="SNIPPET_BOX">
      <DitherBox as="section" class="rounded-lg border border-border/60 bg-card/40 p-5 text-center">
        <span class="text-[13px] text-foreground/90">Content lands in a typed container.</span>
      </DitherBox>
    </DemoCard>
    <PropsTable :rows="API.box" />
  </section>

  <!-- Text -->
  <section id="text" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Text</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The type scale the whole site speaks: three token tones, four sizes from
      11 to 15px, and <code class="text-foreground/80">as</code> for the
      element. Leading, tracking and weight stay yours in
      <code class="text-foreground/80">class</code>.
    </p>
    <DemoCard :code="SNIPPET_TEXT">
      <div class="grid gap-3 text-left">
        <DitherText tone="muted" size="sm">Default paragraph tone.</DitherText>
        <DitherText as="span" tone="faint" size="xs">Caption-weight aside.</DitherText>
        <DitherText as="h3" size="lg">A heading in the native scale.</DitherText>
      </div>
    </DemoCard>
    <PropsTable :rows="API.text" />
  </section>

  <!-- Divider -->
  <section id="divider" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Divider</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A hairline rule with real separator semantics. Horizontal renders an
      <code class="text-foreground/80">hr</code>; vertical lives in flex rows
      and stretches to their height. Both announce their orientation.
    </p>
    <DemoCard :code="SNIPPET_DIVIDER">
      <div class="mx-auto w-full max-w-sm">
        <DitherText size="sm" tone="muted" class="text-center">Charts render on canvas.</DitherText>
        <DitherDivider class="my-4" />
        <DitherText size="sm" tone="muted" class="text-center">Fills threshold the same Bayer matrix.</DitherText>
        <div class="mt-6 flex h-10 items-center justify-center gap-4">
          <span class="text-[12px] text-foreground/90">Left</span>
          <DitherDivider orientation="vertical" />
          <span class="text-[12px] text-foreground/90">Right</span>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.divider" />
  </section>

  <!-- VisuallyHidden -->
  <section id="visually-hidden" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">VisuallyHidden</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Content for screen readers only — labels that must exist in the reading
      order without painting anything. Flip on
      <code class="text-foreground/80">focusable</code> for the skip-link
      pattern: Tab reveals it, styled as a chip over the page.
    </p>
    <DemoCard :code="SNIPPET_HIDDEN">
      <div class="grid justify-items-center gap-3">
        <p class="text-[12px] text-muted-foreground">
          Extra context that only a screen reader should read
          <DitherVisuallyHidden> — this sentence is announced, not painted.</DitherVisuallyHidden>
        </p>
        <a href="#box" class="rounded border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          Tab to reveal the skip link
        </a>
        <DitherVisuallyHidden focusable>Skip to content</DitherVisuallyHidden>
      </div>
    </DemoCard>
    <PropsTable :rows="API.visuallyHidden" />
  </section>
</template>
