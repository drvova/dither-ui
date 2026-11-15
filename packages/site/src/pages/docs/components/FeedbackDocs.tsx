import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import badgeProps from "virtual:dither-props/DitherBadge"
import skeletonProps from "virtual:dither-props/DitherSkeleton"
import spinnerProps from "virtual:dither-props/DitherSpinner"
import separatorProps from "virtual:dither-props/DitherSeparator"
import DocSection from "../DocSection"
import BadgeExample from "./examples/badge"
import badgeCode from "./examples/badge.tsx?raw"
import SkeletonExample from "./examples/skeleton"
import skeletonCode from "./examples/skeleton.tsx?raw"
import SpinnerExample from "./examples/spinner"
import spinnerCode from "./examples/spinner.tsx?raw"
import SeparatorExample from "./examples/separator"
import separatorCode from "./examples/separator.tsx?raw"

export const API: Record<string, PropRow[]> = {
  badge: kitTable(badgeProps),
  skeleton: kitTable(skeletonProps),
  spinner: kitTable(spinnerProps),
  separator: kitTable(separatorProps),
}

export default function FeedbackDocs() {
  return (
    <>
      {/* Badge */}
      <DocSection id="badge">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A small label chip: the button's dither fill at rest, no hover machinery, any palette color and texture
          variant.
        </p>
        <DemoCard code={badgeCode}>
          <BadgeExample />
        </DemoCard>
        <PropsTable rows={API.badge} />
      </DocSection>

      {/* Skeleton */}
      <DocSection id="skeleton">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A loading placeholder that shimmers pixel-by-pixel: the field's density breathes through the Bayer matrix
          instead of a gradient sweep. Size it with classes and compose it into any layout.
        </p>
        <DemoCard code={skeletonCode}>
          <SkeletonExample />
        </DemoCard>
        <PropsTable rows={API.skeleton} />
      </DocSection>

      {/* Spinner */}
      <DocSection id="spinner">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A dithered loader, repainted at 30fps. It's not one shape. A seed samples three axes at once: the{" "}
          <em class="text-foreground/80 not-italic">silhouette</em> (circle ring, square box-ring, or bar), the{" "}
          <em class="text-foreground/80 not-italic">flow</em> (sweep like a comet, pulse breathing, or a travelling
          wave), and the detail (dashes, petals, thickness). So every seed is a genuinely different loader: a rotating
          ring, a breathing square, dashes racing a bar. Static under reduced motion.
        </p>
        <DemoCard code={spinnerCode}>
          <SpinnerExample />
        </DemoCard>
        <PropsTable rows={API.spinner} />
      </DocSection>

      {/* Separator */}
      <DocSection id="separator">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A 2px rule whose pixels dissolve toward both ends through the Bayer matrix: the image component's edge fade,
          applied to a divider.
        </p>
        <DemoCard code={separatorCode}>
          <SeparatorExample />
        </DemoCard>
        <PropsTable rows={API.separator} />
      </DocSection>
    </>
  )
}
