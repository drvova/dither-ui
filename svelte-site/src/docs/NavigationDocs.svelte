<script lang="ts">
  import {
    DitherBreadcrumb,
    DitherPagination,
    DitherRating,
    DitherStepper,
    DitherTimeline,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  let page = $state(3)
  let rating = $state(3)
  let ratingSeeds = $state([0, 12, 88, 404])
  const rerollRatings = () => {
    ratingSeeds = ratingSeeds.map(() => Math.floor(Math.random() * 100000))
  }
  const SEED_COLORS = ["orange", "pink", "purple", "green"] as const

  const SNIPPET_BREADCRUMB = `<DitherBreadcrumb
  items={[
    { label: "Home", href: "#/" },
    { label: "Components", href: "#/docs" },
    { label: "Breadcrumb" },
  ]}
/>`

  const SNIPPET_PAGINATION = `<script lang="ts">
  let page = $state(3)
<\/script>

<DitherPagination bind:page={page} total={12} />`

  const SNIPPET_RATING = `<script lang="ts">
  let rating = $state(3)
<\/script>

<!-- interactive: click or arrow-key to set -->
<DitherRating bind:value={rating} />

<!-- read-only supports fractions -->
<DitherRating value={4.5} readonly />

<!-- seed varies the star tilt + dither scatter -->
<DitherRating value={4} seed={88} color="pink" />`

  const SNIPPET_STEPPER = `<DitherStepper
  current={1}
  steps={[
    { label: "Cart" },
    { label: "Shipping" },
    { label: "Payment" },
    { label: "Done" },
  ]}
/>`

  const SNIPPET_TIMELINE = `<DitherTimeline
  items={[
    { title: "Deployed v0.3.0", time: "2h ago", color: "green",
      body: "Rolled out to production." },
    { title: "Merged #482", time: "Yesterday", color: "blue",
      body: "Seeded spinner form space." },
    { title: "Opened milestone", time: "Mon", color: "purple" },
  ]}
/>`

  const API: Record<string, PropRow[]> = {
    breadcrumb: [
      { prop: "items", type: "{ label; href? }[]", default: "—" },
      { prop: "separator", type: "string", default: '"/"' },
    ],
    pagination: [
      { prop: "page", type: "number (bind:page)", default: "—" },
      { prop: "total", type: "number — page count", default: "—" },
      { prop: "siblings", type: "number — pages either side", default: "1" },
    ],
    rating: [
      { prop: "value", type: "number (bind:value)", default: "0" },
      { prop: "max", type: "number", default: "5" },
      { prop: "color", type: "PixelColor", default: '"orange"' },
      { prop: "size", type: "number (px per star)", default: "22" },
      { prop: "readonly", type: "boolean — fractions allowed", default: "false" },
      { prop: "label", type: "string — accessible name", default: '"Rating"' },
      { prop: "seed", type: "number — star tilt + scatter", default: "clean" },
    ],
    stepper: [
      { prop: "steps", type: "{ label; hint? }[]", default: "—" },
      { prop: "current", type: "number — active index", default: "—" },
    ],
    timeline: [
      { prop: "items", type: "{ title; time?; body?; color? }[]", default: "—" },
      { prop: "dotSize", type: "number (px)", default: "12" },
    ],
  }
</script>

<section id="breadcrumb" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Breadcrumb</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A path back up the hierarchy. Links up to the current page, which is marked
    <code class="text-foreground/80">aria-current="page"</code>, inside a labelled
    <code class="text-foreground/80">nav</code>.
  </p>
  <DemoCard code={SNIPPET_BREADCRUMB}>
    <div class="flex justify-center">
      <DitherBreadcrumb
        items={[
          { label: "Home", href: "#/" },
          { label: "Components", href: "#/docs" },
          { label: "Breadcrumb" },
        ]}
      />
    </div>
  </DemoCard>
  <PropsTable rows={API.breadcrumb} />
</section>

<section id="pagination" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Pagination</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Page navigation that always shows the first, last and current page, collapsing
    the rest to ellipses. Two-way bound with <code class="text-foreground/80">bind:page</code>.
  </p>
  <DemoCard code={SNIPPET_PAGINATION}>
    <div class="grid gap-4">
      <div class="flex justify-center">
        <DitherPagination bind:page={page} total={12} />
      </div>
      <p class="text-center text-[12px] text-muted-foreground">on page {page} of 12</p>
    </div>
  </DemoCard>
  <PropsTable rows={API.pagination} />
</section>

<section id="rating" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Rating</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Dithered stars, rasterised from a 5-point polygon and scattered through the Bayer
    matrix. Interactive as a <code class="text-foreground/80">slider</code> (click or arrow
    keys); read-only mode fills fractionally. A seed tilts the star and reshuffles the
    scatter, so no two ratings look stamped from the same die.
  </p>
  <DemoCard code={SNIPPET_RATING}>
    <div class="grid gap-6">
      <div class="flex flex-col items-center gap-2">
        <DitherRating bind:value={rating} size={28} />
        <p class="text-[12px] tabular-nums text-muted-foreground">{rating} / 5 — click or arrow-key</p>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <DitherRating value={4.5} readonly />
        <DitherRating value={3} readonly color="green" />
        <DitherRating value={5} readonly color="pink" max={5} />
        <DitherRating value={7} readonly color="blue" max={10} size={16} />
      </div>
      <div class="flex flex-col items-center gap-3">
        <div class="flex flex-wrap items-center justify-center gap-6">
          {#each ratingSeeds as sd, i (i)}
            <DitherRating
              value={4}
              readonly
              seed={sd}
              color={SEED_COLORS[i]}
              size={24}
            />
          {/each}
        </div>
        <button
          type="button"
          class="rounded-md border border-border px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          onclick={rerollRatings}
        >
          Reroll star seeds
        </button>
      </div>
    </div>
  </DemoCard>
  <PropsTable rows={API.rating} />
</section>

<section id="stepper" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Stepper</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Progress through a multi-step flow. Completed steps carry a check, the current step
    an outlined node, and the connectors are the kit's dithered rule — dissolving toward
    steps not yet reached.
  </p>
  <DemoCard code={SNIPPET_STEPPER}>
    <div class="mx-auto max-w-md">
      <DitherStepper
        current={1}
        steps={[
          { label: "Cart" },
          { label: "Shipping" },
          { label: "Payment" },
          { label: "Done" },
        ]}
      />
    </div>
  </DemoCard>
  <PropsTable rows={API.stepper} />
</section>

<section id="timeline" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Timeline</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A vertical run of events, each pinned by a dithered dot whose density fades at the
    rim. Give a title, an optional timestamp, body and palette colour per node.
  </p>
  <DemoCard code={SNIPPET_TIMELINE}>
    <div class="mx-auto max-w-sm">
      <DitherTimeline
        items={[
          { title: "Deployed v0.3.0", time: "2h ago", color: "green", body: "Rolled out to production behind a flag." },
          { title: "Merged #482", time: "Yesterday", color: "blue", body: "Seeded the spinner form space." },
          { title: "Opened milestone", time: "Mon", color: "purple", body: "Navigation & data components." },
          { title: "Kicked off", time: "Last week", color: "orange" },
        ]}
      />
    </div>
  </DemoCard>
  <PropsTable rows={API.timeline} />
</section>
