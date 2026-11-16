import DemoCard from "../DemoCard"
import DocSection from "../DocSection"
import SidebarDashboardExample from "./examples/sidebar-dashboard"
import sidebarDashboardCode from "./examples/sidebar-dashboard.tsx?raw"
import SidebarAdminExample from "./examples/sidebar-admin"
import sidebarAdminCode from "./examples/sidebar-admin.tsx?raw"
import SidebarFiltersExample from "./examples/sidebar-filters"
import sidebarFiltersCode from "./examples/sidebar-filters.tsx?raw"
import SidebarDocsExample from "./examples/sidebar-docs"
import sidebarDocsCode from "./examples/sidebar-docs.tsx?raw"
import SidebarDualExample from "./examples/sidebar-dual"
import sidebarDualCode from "./examples/sidebar-dual.tsx?raw"
import SidebarPersonalExample from "./examples/sidebar-personal"
import sidebarPersonalCode from "./examples/sidebar-personal.tsx?raw"
import SidebarFloatingExample from "./examples/sidebar-floating"
import sidebarFloatingCode from "./examples/sidebar-floating.tsx?raw"
import SidebarRightExample from "./examples/sidebar-right"
import sidebarRightCode from "./examples/sidebar-right.tsx?raw"
import SidebarTeamsExample from "./examples/sidebar-teams"
import sidebarTeamsCode from "./examples/sidebar-teams.tsx?raw"
import SidebarTreeExample from "./examples/sidebar-tree"
import sidebarTreeCode from "./examples/sidebar-tree.tsx?raw"
import SidebarDrawerExample from "./examples/sidebar-drawer"
import sidebarDrawerCode from "./examples/sidebar-drawer.tsx?raw"
import SidebarRailExample from "./examples/sidebar-rail"
import sidebarRailCode from "./examples/sidebar-rail.tsx?raw"

/* Personal dashboard + Right side: mini calendar */

/* Team switcher */
/** An app's window at a desktop's width: a sidebar beside its page needs
 * the room. It stands inside the docs' own main, so the page beside the
 * sidebar is a plain block here (a page holds one main); the snippet the
 * reader takes keeps its main. Centred while the card holds it; on a phone the card scrolls
 * to it, as the bracket does, rather than crushing the page beside the
 * sidebar. */
export default function SidebarExamples() {
  return (
    <>
      {/* Basic dashboard */}
      <DocSection id="sidebar-dashboard">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The workhorse frame: washed sidebar with a Main group, count badge, an upgrade card pinned above the user row,
          and a breadcrumb topbar whose toggle owns the icon rail.
        </p>
        <DemoCard code={sidebarDashboardCode}>
          <SidebarDashboardExample />
        </DemoCard>
      </DocSection>
      {/* Admin with profile */}
      <DocSection id="sidebar-admin">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A floating admin panel with a quick-actions group, a storage meter card, and the signed-in profile pinned to
          the footer. The topbar hamburger hides the whole panel; the red badge keeps triage loud.
        </p>
        <DemoCard code={sidebarAdminCode}>
          <SidebarAdminExample />
        </DemoCard>
      </DocSection>
      {/* E-commerce filters */}
      <DocSection id="sidebar-filters">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A filter rail for a storefront: search, category and brand checkboxes with result counts, a two-thumb price
          range, and apply/reset pinned to the footer. The topbar echoes the live filter count.
        </p>
        <DemoCard code={sidebarFiltersCode}>
          <SidebarFiltersExample />
        </DemoCard>
      </DocSection>
      {/* Documentation nav */}
      <DocSection id="sidebar-docs">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A docs tree: version chip, ⌘K search, one section open with the active page, the rest folded behind chevrons,
          and a help card in the footer. Compact rows, no icon rail: a docs tree needs its labels.
        </p>
        <DemoCard code={sidebarDocsCode}>
          <SidebarDocsExample />
        </DemoCard>
      </DocSection>
      {/* Dual layout */}
      <DocSection id="sidebar-dual">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Two tiers: a permanent icon rail picks the context, a second panel shows that context's tree. The rail is a
          Sidebar pinned to its rail state; the panel is a plain inset Sidebar beside it.
        </p>
        <DemoCard code={sidebarDualCode}>
          <SidebarDualExample />
        </DemoCard>
      </DocSection>
      {/* Personal dashboard */}
      <DocSection id="sidebar-personal">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A personal hub: avatar header, a mini month at a glance, and two todo lists whose done items strike through.
          Everything is live: tick a box and the footer count follows.
        </p>
        <DemoCard code={sidebarPersonalCode}>
          <SidebarPersonalExample />
        </DemoCard>
      </DocSection>
      {/* Floating left */}
      <DocSection id="sidebar-floating">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A detached card over the canvas: workspace switcher up top, search, primary rows with an inbox badge, and
          favorites that truncate gracefully. Collapses to the icon rail like any other Sidebar.
        </p>
        <DemoCard code={sidebarFloatingCode}>
          <SidebarFloatingExample />
        </DemoCard>
      </DocSection>
      {/* Right side */}
      <DocSection id="sidebar-right">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The same Sidebar flipped to the right edge: a profile header, the mini month, and calendar toggles with their
          color dots. The topbar button hides the whole panel when the content needs the room.
        </p>
        <DemoCard code={sidebarRightCode}>
          <SidebarRightExample />
        </DemoCard>
      </DocSection>
      {/* Team switcher */}
      <DocSection id="sidebar-teams">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One sidebar, three workspaces. The header dropdown swaps the whole identity: wash color, accent, groups,
          badges. Arrow keys walk the menu; Escape returns focus to the trigger.
        </p>
        <DemoCard code={sidebarTeamsCode}>
          <SidebarTeamsExample />
        </DemoCard>
      </DocSection>
      {/* File tree */}
      <DocSection id="sidebar-tree">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sub-menus nest: an explorer three levels deep with expand/collapse all, rail guides on every level, and a
          selected file the header echoes.
        </p>
        <DemoCard code={sidebarTreeCode}>
          <SidebarTreeExample />
        </DemoCard>
      </DocSection>
      {/* Mobile drawer */}
      <DocSection id="sidebar-drawer">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Below the breakpoint the sidebar rides in a drawer: hamburger opens, picking a destination closes, swipe
          dismisses. Groups and items work standalone inside any panel.
        </p>
        <DemoCard code={sidebarDrawerCode}>
          <SidebarDrawerExample />
        </DemoCard>
      </DocSection>
      {/* Icon rail */}
      <DocSection id="sidebar-rail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The whole nav in 56 pixels: a permanent rail where tooltips carry the labels, badges fold to colored dots, and
          the footer keeps the person.
        </p>
        <DemoCard code={sidebarRailCode}>
          <SidebarRailExample />
        </DemoCard>
      </DocSection>
    </>
  )
}
