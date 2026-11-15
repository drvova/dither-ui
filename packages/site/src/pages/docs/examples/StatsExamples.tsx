import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import StatsCardsExample from "./examples/stats-cards"
import statsCardsCode from "./examples/stats-cards.tsx?raw"
import StatsChartsExample from "./examples/stats-charts"
import statsChartsCode from "./examples/stats-charts.tsx?raw"

export default function StatsExamples() {
  return (
    <>
      {/* Stat cards */}
      <DocSection id="stats-cards">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The classic KPI grid: label, corner glyph, a big tabular number, and a signed delta that knows churn falling
          is good news. The period picker swaps the whole dataset live.
        </p>
        <DemoCard code={statsCardsCode}>
          <StatsCardsExample />
        </DemoCard>
      </DocSection>
      {/* Stats with charts */}
      <DocSection id="stats-charts">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Numbers with their shape: sparkline cards for trends, a meter card for progress toward a goal. Twelve points
          is plenty; the dither does the rest.
        </p>
        <DemoCard code={statsChartsCode}>
          <StatsChartsExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
