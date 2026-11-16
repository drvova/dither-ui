// The Examples' pages: whole screens composed from the kit (a dashboard, an
// app shell, an ops board, a team panel, usage and billing, a sign-in),
// each with the snippet that builds it from the same rows.
import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import SigninExample from "./examples/signin"
import signinCode from "./examples/signin.tsx?raw"
import DashboardExample from "./examples/dashboard"
import dashboardCode from "./examples/dashboard.tsx?raw"
import ShellExample from "./examples/shell"
import shellCode from "./examples/shell.tsx?raw"
import MonitoringExample from "./examples/monitoring"
import monitoringCode from "./examples/monitoring.tsx?raw"
import TeamExample from "./examples/team"
import teamCode from "./examples/team.tsx?raw"
import UsageExample from "./examples/usage"
import usageCode from "./examples/usage.tsx?raw"

export default function PageExamples() {
  // App shell example.

  return (
    <>
      {/* Dashboard */}
      <DocSection defer id="dashboard">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Everything composed: stat cards, a stacked area and a donut. One palette, one texture, zero SVG.
        </p>
        <DemoCard code={dashboardCode}>
          <DashboardExample />
        </DemoCard>
      </DocSection>

      {/* App shell */}
      <DocSection defer id="shell">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sidebar, topbar and content: a whole product frame from tokens and kit primitives. The nav works; click
          around.
        </p>
        <DemoCard code={shellCode}>
          <ShellExample />
        </DemoCard>
      </DocSection>

      {/* Monitoring */}
      <DocSection defer id="monitoring">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An ops board: system pulse, sprint health and per-service status rows. The grey seed marks what is quiet, red
          what is not.
        </p>
        <DemoCard code={monitoringCode}>
          <MonitoringExample />
        </DemoCard>
      </DocSection>

      {/* Team */}
      <DocSection defer id="team">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A contributors panel: deterministic avatars, a commit pulse per person, one palette seed each.
        </p>
        <DemoCard code={teamCode}>
          <TeamExample />
        </DemoCard>
      </DocSection>

      {/* Usage & billing */}
      <DocSection defer id="usage">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Renders per month, quota as a donut, and the one button every billing page needs.
        </p>
        <DemoCard code={usageCode}>
          <UsageExample />
        </DemoCard>
      </DocSection>

      {/* Sign in */}
      <DocSection defer id="signin">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An auth card washed by a DitherGradient: the pixels do the decoration, the form stays plain.
        </p>
        <DemoCard code={signinCode}>
          <SigninExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
