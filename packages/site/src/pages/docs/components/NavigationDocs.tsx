import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import breadcrumbProps from "virtual:dither-props/DitherBreadcrumb"
import paginationProps from "virtual:dither-props/DitherPagination"
import ratingProps from "virtual:dither-props/DitherRating"
import stepperProps from "virtual:dither-props/DitherStepper"
import timelineProps from "virtual:dither-props/DitherTimeline"
import DocSection from "../DocSection"
import BreadcrumbExample from "./examples/breadcrumb"
import breadcrumbCode from "./examples/breadcrumb.tsx?raw"
import StepperExample from "./examples/stepper"
import stepperCode from "./examples/stepper.tsx?raw"
import PaginationExample from "./examples/pagination"
import paginationCode from "./examples/pagination.tsx?raw"
import RatingExample from "./examples/rating"
import ratingCode from "./examples/rating.tsx?raw"
import TimelineExample from "./examples/timeline"
import timelineCode from "./examples/timeline.tsx?raw"

export const API: Record<string, PropRow[]> = {
  breadcrumb: kitTable(breadcrumbProps),
  pagination: kitTable(paginationProps),
  rating: kitTable(ratingProps),
  stepper: kitTable(stepperProps),
  timeline: kitTable(timelineProps),
}

export default function NavigationDocs() {
  return (
    <>
      {/* Breadcrumb */}
      <DocSection id="breadcrumb">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A path back up the hierarchy. Links up to the current page, which is marked{" "}
          <code class="text-foreground/80">aria-current="page"</code>, inside a labelled{" "}
          <code class="text-foreground/80">nav</code>.
        </p>
        <DemoCard code={breadcrumbCode}>
          <div class="flex justify-center">
            <BreadcrumbExample />
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
        <DemoCard code={paginationCode}>
          <PaginationExample />
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
        <DemoCard code={ratingCode}>
          <RatingExample />
        </DemoCard>
        <PropsTable rows={API.rating} />
      </DocSection>

      {/* Stepper */}
      <DocSection id="stepper">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Progress through a multi-step flow. Completed steps carry a check, the current step an outlined node, and the
          connectors are the kit's dithered rule, dissolving toward steps not yet reached.
        </p>
        <DemoCard code={stepperCode}>
          <div class="mx-auto max-w-md">
            <StepperExample />
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
        <DemoCard code={timelineCode}>
          <TimelineExample />
        </DemoCard>
        <PropsTable rows={API.timeline} />
      </DocSection>
    </>
  )
}
