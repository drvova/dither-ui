import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import PricingExample from "./examples/pricing"
import pricingCode from "./examples/pricing.tsx?raw"
import ActivityExample from "./examples/activity"
import activityCode from "./examples/activity.tsx?raw"
import ChangelogExample from "./examples/changelog"
import changelogCode from "./examples/changelog.tsx?raw"

export default function ProductExamples() {
  return (
    <>
      {/* Pricing */}
      <DocSection id="pricing">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Three tiers from tokens and kit primitives. The popular plan gets a dither wash, and nothing else shouts.
        </p>
        <DemoCard code={pricingCode}>
          <PricingExample />
        </DemoCard>
      </DocSection>
      {/* Activity feed */}
      <DocSection id="activity">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A team feed: deterministic avatars, one accent dot per unread row, times right-aligned.
        </p>
        <DemoCard code={activityCode}>
          <ActivityExample />
        </DemoCard>
      </DocSection>
      {/* Changelog */}
      <DocSection id="changelog">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A release timeline: square markers on a thin rail, the newest release seeded green.
        </p>
        <DemoCard code={changelogCode}>
          <ChangelogExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
