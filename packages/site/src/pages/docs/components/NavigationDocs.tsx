import { createSignal, Index } from "solid-js"
import { DitherBreadcrumb, DitherPagination, DitherRating, DitherStepper, DitherTimeline } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import breadcrumbProps from "virtual:dither-props/DitherBreadcrumb"
import paginationProps from "virtual:dither-props/DitherPagination"
import ratingProps from "virtual:dither-props/DitherRating"
import stepperProps from "virtual:dither-props/DitherStepper"
import timelineProps from "virtual:dither-props/DitherTimeline"
import DocSection from "../DocSection"

const SNIPPET_BREADCRUMB = `<DitherBreadcrumb
  items={[
    { label: 'Home', href: '#/' },
    { label: 'Components', href: '#/docs' },
    { label: 'Breadcrumb' },
  ]}
/>`

const SNIPPET_PAGINATION = `const [page, setPage] = createSignal(3)

<DitherPagination page={page()} onUpdatePage={setPage} total={12} />`

const SNIPPET_RATING = `const [rating, setRating] = createSignal(3)

{/* interactive: click or arrow-key to set */}
<DitherRating modelValue={rating()} onUpdateModelValue={setRating} />

{/* read-only supports fractions */}
<DitherRating modelValue={4.5} readonly />

{/* seed varies the star tilt + dither scatter */}
<DitherRating modelValue={4} seed={88} color="pink" />`

const SNIPPET_STEPPER = `<DitherStepper
  current={1}
  steps={[
    { label: 'Cart' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Done' },
  ]}
/>`

const SNIPPET_TIMELINE = `<DitherTimeline
  items={[
    { title: 'Deployed v0.3.0', time: '2h ago', color: 'green',
      body: 'Rolled out to production.' },
    { title: 'Merged #482', time: 'Yesterday', color: 'blue',
      body: 'Seeded spinner form space.' },
    { title: 'Opened milestone', time: 'Mon', color: 'purple' },
  ]}
/>`

export const API: Record<string, PropRow[]> = {
  breadcrumb: kitTable(breadcrumbProps),
  pagination: kitTable(paginationProps),
  rating: kitTable(ratingProps),
  stepper: kitTable(stepperProps),
  timeline: kitTable(timelineProps),
}

const RATING_COLORS = ["orange", "pink", "purple", "green"] as const

export default function NavigationDocs() {
  const [page, setPage] = createSignal(3)
  const [rating, setRating] = createSignal(3)
  const [ratingSeeds, setRatingSeeds] = createSignal([0, 12, 88, 404])
  const rerollRatings = () => {
    setRatingSeeds(ratingSeeds().map(() => Math.floor(Math.random() * 100000)))
  }

  return (
    <>
      {/* Breadcrumb */}
      <DocSection id="breadcrumb">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A path back up the hierarchy. Links up to the current page, which is marked{" "}
          <code class="text-foreground/80">aria-current="page"</code>, inside a labelled{" "}
          <code class="text-foreground/80">nav</code>.
        </p>
        <DemoCard code={SNIPPET_BREADCRUMB}>
          <div class="flex justify-center">
            <DitherBreadcrumb
              items={[{ label: "Home", href: "#/" }, { label: "Components", href: "#/docs" }, { label: "Breadcrumb" }]}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.breadcrumb} />
      </DocSection>

      {/* Pagination */}
      <DocSection id="pagination">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Page navigation that always shows the first, last and current page, collapsing the rest to ellipses. Two-way
          bound with <code class="text-foreground/80">page</code> and{" "}
          <code class="text-foreground/80">onUpdatePage</code>.
        </p>
        <DemoCard code={SNIPPET_PAGINATION}>
          <div class="grid gap-4">
            {/* Centred while it fits; on the narrowest phones it scrolls. */}
            <div class="overflow-x-auto">
              <div class="mx-auto w-max">
                <DitherPagination page={page()} onUpdatePage={setPage} total={12} />
              </div>
            </div>
            <p class="text-center text-[12px] text-muted-foreground">on page {page()} of 12</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.pagination} />
      </DocSection>

      {/* Rating */}
      <DocSection id="rating">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Dithered stars, rasterised from a 5-point polygon and scattered through the Bayer matrix. Interactive as a{" "}
          <code class="text-foreground/80">slider</code> (click or arrow keys); read-only mode fills fractionally. A
          seed tilts the star and reshuffles the scatter, so no two ratings look stamped from the same die.
        </p>
        <DemoCard code={SNIPPET_RATING}>
          <div class="grid gap-6">
            <div class="flex flex-col items-center gap-2">
              <DitherRating modelValue={rating()} onUpdateModelValue={setRating} size={28} />
              <p class="text-[12px] tabular-nums text-muted-foreground">{rating()} / 5 (click or arrow-key)</p>
            </div>
            <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <DitherRating modelValue={4.5} readonly />
              <DitherRating modelValue={3} readonly color="green" />
              <DitherRating modelValue={5} readonly color="pink" max={5} />
              <DitherRating modelValue={7} readonly color="blue" max={10} size={16} />
            </div>
            <div class="flex flex-col items-center gap-3">
              <div class="flex flex-wrap items-center justify-center gap-6">
                <Index each={ratingSeeds()}>
                  {(sd, i) => <DitherRating modelValue={4} readonly seed={sd()} color={RATING_COLORS[i]} size={24} />}
                </Index>
              </div>
              <button
                type="button"
                class="rounded-md border border-border px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                onClick={rerollRatings}
              >
                Reroll star seeds
              </button>
            </div>
          </div>
        </DemoCard>
        <PropsTable rows={API.rating} />
      </DocSection>

      {/* Stepper */}
      <DocSection id="stepper">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Progress through a multi-step flow. Completed steps carry a check, the current step an outlined node, and the
          connectors are the kit's dithered rule, dissolving toward steps not yet reached.
        </p>
        <DemoCard code={SNIPPET_STEPPER}>
          <div class="mx-auto max-w-md">
            <DitherStepper
              current={1}
              steps={[{ label: "Cart" }, { label: "Shipping" }, { label: "Payment" }, { label: "Done" }]}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.stepper} />
      </DocSection>

      {/* Timeline */}
      <DocSection id="timeline">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A vertical run of events, each pinned by a dithered dot whose density fades at the rim. Give a title, an
          optional timestamp, body and palette colour per node.
        </p>
        <DemoCard code={SNIPPET_TIMELINE}>
          <div class="mx-auto max-w-sm">
            <DitherTimeline
              items={[
                {
                  title: "Deployed v0.3.0",
                  time: "2h ago",
                  color: "green",
                  body: "Rolled out to production behind a flag.",
                },
                { title: "Merged #482", time: "Yesterday", color: "blue", body: "Seeded the spinner form space." },
                { title: "Opened milestone", time: "Mon", color: "purple", body: "Navigation & data components." },
                { title: "Kicked off", time: "Last week", color: "orange" },
              ]}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.timeline} />
      </DocSection>
    </>
  )
}
