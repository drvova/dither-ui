import { createMemo, createSignal, For, Show } from "solid-js"
import { createMutable } from "solid-js/store"
import {
  DitherAvatar,
  DitherButton,
  DitherCheckbox,
  DitherDrawer,
  DitherInput,
  DitherMenu,
  DitherMeter,
  DitherSidebar,
  DitherSidebarGroup,
  DitherSidebarItem,
  DitherSidebarSub,
  DitherSlider,
  DitherTooltip,
} from "@dither-kit"
import DemoCard from "../DemoCard"

const CAT_COUNTS: Record<string, number> = { Prints: 125, Frames: 89, Zines: 34, Stickers: 67 }

const BRAND_COUNTS: Record<string, number> = { "Bayer & Co": 45, Ordered: 38, Halftone: 29 }

const DOCS_TREE: Record<string, string[]> = {
  "Getting started": ["Introduction", "Installation", "Quick start", "Configuration"],
  "API reference": ["Props", "Events", "Slots"],
  Guides: ["Theming", "Composition"],
}

const PANELS: Record<string, { title: string; items: { label: string; badge?: number }[] }> = {
  Inbox: {
    title: "Inbox",
    items: [
      { label: "All mail", badge: 24 },
      { label: "Starred", badge: 3 },
      { label: "Drafts" },
      { label: "Archive" },
    ],
  },
  Files: {
    title: "Files",
    items: [{ label: "Recent" }, { label: "Shared with me", badge: 5 }, { label: "Exports" }, { label: "Trash" }],
  },
  Tasks: {
    title: "Tasks",
    items: [{ label: "Today", badge: 4 }, { label: "Upcoming", badge: 12 }, { label: "Someday" }, { label: "Done" }],
  },
}

/* Personal dashboard + Right side: mini calendar */
const CAL_LEAD = 2 // month opens on a Wednesday

const CAL_DAYS = 31

const CAL_TODAY = 21

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

const FAVORITES = [
  "Print run planning & schedule",
  "Zine layouts & paste-ups",
  "Palette research notebook",
  "Client proofs & feedback",
]

/* Team switcher */
type Team = {
  color: "blue" | "green" | "purple"
  plan: string
  groups: Record<string, { label: string; badge?: number }[]>
}

const TEAMS: Record<string, Team> = {
  "Acme Inc": {
    color: "blue",
    plan: "Enterprise",
    groups: {
      Product: [{ label: "Roadmap" }, { label: "Releases", badge: 3 }, { label: "Feedback" }],
      Ops: [{ label: "Billing" }, { label: "Members", badge: 24 }],
    },
  },
  "Pixel Labs": {
    color: "purple",
    plan: "Startup",
    groups: {
      Research: [{ label: "Experiments", badge: 7 }, { label: "Datasets" }, { label: "Notebooks" }],
      Studio: [{ label: "Prototypes" }, { label: "Reviews", badge: 2 }],
    },
  },
  "Zine Press": {
    color: "green",
    plan: "Indie",
    groups: {
      Issues: [{ label: "Drafts", badge: 4 }, { label: "Published" }],
      Shop: [{ label: "Orders", badge: 12 }, { label: "Stock" }],
    },
  },
}

const RAIL_ITEMS = [
  { label: "Charts", badge: undefined, color: "blue" as const },
  { label: "Palettes", badge: 2, color: "purple" as const },
  { label: "Exports", badge: undefined, color: "green" as const },
  { label: "Alerts", badge: 5, color: "red" as const },
]

const SNIPPET_DASHBOARD = `<div class="flex h-96 overflow-hidden rounded-lg border">
  <DitherSidebar v-model="collapsed" variant="washed" wash-color="blue">
    <template #header>…wordmark…</template>
    <DitherSidebarGroup label="Main">
      <DitherSidebarItem label="Dashboard" :active="active === 'Dashboard'" />
      <DitherSidebarItem label="Projects" :badge="12" />
      <DitherSidebarItem label="Team" />
      <DitherSidebarItem label="Settings" />
    </DitherSidebarGroup>
    <template #footer>
      <div class="rounded-md border p-2.5">   <!-- upgrade card -->
        Upgrade to pro
        <DitherButton color="blue" class="w-full">Upgrade</DitherButton>
      </div>
      …user row…
    </template>
  </DitherSidebar>
  <main class="flex-1">
    <button @click="collapsed = !collapsed" aria-label="Toggle sidebar" />
    <nav aria-label="Breadcrumb">Home / Projects / {{ active }}</nav>
    …content…
  </main>
</div>`

const SNIPPET_ADMIN = `<DitherSidebar v-model="hidden" collapse="hide" variant="floating" :toggle="false">
  <DitherSidebarGroup label="Manage">
    <DitherSidebarItem label="Members" :badge="24" />
    <DitherSidebarItem label="Roles" />
    <DitherSidebarItem label="Audit log" badge="!" color="red" />
  </DitherSidebarGroup>
  <DitherSidebarGroup label="Quick actions">
    <DitherSidebarItem label="New member" />
    <DitherSidebarItem label="Create invite" />
  </DitherSidebarGroup>
  <template #footer>
    <div class="rounded-md border p-2.5">    <!-- storage card -->
      Storage <DitherMeter :value="68" /> 6.8 of 10 GB
    </div>
    <DitherAvatar name="Rei Toma" :size="22" />  <!-- profile row -->
    <button aria-label="Sign out">…</button>
  </template>
</DitherSidebar>
<main><button @click="hidden = !hidden">☰</button> …table…</main>`

const SNIPPET_FILTERS = `<DitherSidebar collapse="none" variant="inset">
  <template #header>…store name + tagline…</template>
  <DitherInput v-model="search" placeholder="Search products…" />

  <DitherSidebarGroup label="Categories">
    <label v-for="c in categories">
      <DitherCheckbox v-model="checked[c]">{{ c }}</DitherCheckbox>
      <span>({{ counts[c] }})</span>
    </label>
  </DitherSidebarGroup>

  <DitherSidebarGroup label="Price">
    <DitherSlider v-model="price" :min="0" :max="500" label="Price" />
    <span>\${{ price[0] }} — \${{ price[1] }}</span>
  </DitherSidebarGroup>

  <template #footer>
    <DitherButton color="green" class="w-full">Apply filters</DitherButton>
    <button @click="reset">Reset all</button>
  </template>
</DitherSidebar>`

const SNIPPET_DOCS = `<DitherSidebar collapse="none" density="compact" variant="inset">
  <template #header>
    …project + v2.4 chip…
    <DitherInput v-model="query" placeholder="Search docs…" />  <!-- filters the tree -->
  </template>

  <!-- searching forces groups open and prunes rows -->
  <DitherSidebarSub v-for="(items, group) in filtered" :key="group"
    :label="group"
    :model-value="query ? true : open[group]"
    @update:model-value="(v) => (open[group] = v)">
    <DitherSidebarItem v-for="item in items" :key="item" :label="item"
      :active="active === item" @select="active = item" />
  </DitherSidebarSub>
  <p v-if="!Object.keys(filtered).length">No pages match.</p>

  <template #footer>
    <div class="rounded-md border p-2.5">Need help? …</div>
  </template>
</DitherSidebar>`

const SNIPPET_DUAL = `<!-- tier 1: permanent icon rail · tier 2: contextual panel -->
<DitherSidebar collapse="rail" :model-value="true" :toggle="false" class="w-14">
  <DitherSidebarItem v-for="p in panels" :label="p"
    :active="rail === p" @select="rail = p" />
</DitherSidebar>

<DitherSidebar collapse="none" variant="inset" class="border-r">
  <template #header>{{ rail }}</template>
  <DitherSidebarItem v-for="item in panelItems[rail]"
    :label="item.label" :badge="item.badge"
    :active="active === item.label" @select="active = item.label" />
</DitherSidebar>

<main>…{{ rail }} / {{ active }}…</main>`

const SNIPPET_PERSONAL = `<DitherSidebar collapse="none" variant="inset">
  <template #header>
    <DitherAvatar name="Mika" :size="26" color="purple" />
    Personal hub — organize your day
  </template>

  <DitherSidebarGroup label="Calendar">
    <div class="grid grid-cols-7 gap-0.5 text-center">
      <span v-for="d in dow">{{ d }}</span>
      <span v-for="day in cells" :class="day === today && 'bg-card ring-1'">
        {{ day }}
      </span>
    </div>
  </DitherSidebarGroup>

  <DitherSidebarGroup label="Personal">
    <label v-for="t in personal">
      <DitherCheckbox v-model="t.done" color="purple">
        <span :class="t.done && 'line-through opacity-60'">{{ t.label }}</span>
      </DitherCheckbox>
    </label>
  </DitherSidebarGroup>

  <DitherSidebarGroup label="Work">…same shape…</DitherSidebarGroup>
  <template #footer>All synced</template>
</DitherSidebar>`

const SNIPPET_FLOATING = `<div class="relative h-96 rounded-lg border bg-card/20 p-2">
  <DitherSidebar v-model="collapsed" variant="floating" class="m-0 h-full">
    <template #header>                <!-- workspace switcher -->
      <button class="flex w-full items-center gap-2 rounded-md border p-1.5">
        <DitherAvatar name="acme" :size="22" />
        <span v-if="!collapsed">Acme Inc — enterprise</span>
        <span aria-hidden="true">⇅</span>
      </button>
      <DitherInput v-if="!collapsed" placeholder="Search…" />
    </template>
    <DitherSidebarItem label="Assistant" color="purple" />
    <DitherSidebarItem label="Home" :active="active === 'Home'" />
    <DitherSidebarItem label="Inbox" :badge="10" />
    <DitherSidebarGroup label="Favorites">
      <DitherSidebarItem v-for="f in favorites" :label="f" />  <!-- truncates -->
    </DitherSidebarGroup>
    <template #footer>…user row…</template>
  </DitherSidebar>
</div>`

const SNIPPET_RIGHT = `<div class="flex h-96 overflow-hidden rounded-lg border">
  <main class="flex-1">
    <button aria-label="Toggle panel" @click="collapsed = !collapsed">☰</button>
    …content…
  </main>

  <DitherSidebar v-model="collapsed" side="right" collapse="hide" :toggle="false">
    <template #header>
      <DitherAvatar name="Juno Bit" :size="24" />
      Juno Bit — juno@dither-ui.com
    </template>

    <DitherSidebarGroup label="Calendar">…mini month grid…</DitherSidebarGroup>

    <DitherSidebarGroup label="My calendars">
      <label v-for="c in calendars" class="flex items-center gap-2">
        <DitherCheckbox v-model="c.on" :color="c.color">{{ c.label }}</DitherCheckbox>
        <span class="ml-auto size-1.5 rounded-full" :style="{ background: c.color }" />
      </label>
    </DitherSidebarGroup>

    <template #footer><button>+ New calendar</button></template>
  </DitherSidebar>
</div>`

const SNIPPET_TEAMS = `<DitherSidebar :variant="'washed'" :wash-color="teams[team].color">
  <template #header>              <!-- workspace dropdown really switches -->
    <DitherMenu :items="names.map((n) => ({ label: n }))" @select="switchTeam">
      <span class="flex items-center gap-2">
        <DitherAvatar :name="team" :size="22" :color="teams[team].color" />
        {{ team }} — {{ teams[team].plan }} <span aria-hidden="true">⇅</span>
      </span>
    </DitherMenu>
  </template>
  <DitherSidebarGroup v-for="(items, group) in teams[team].groups" :label="group">
    <DitherSidebarItem v-for="i in items" :label="i.label" :badge="i.badge"
      :color="teams[team].color"
      :active="active === i.label" @select="active = i.label" />
  </DitherSidebarGroup>
</DitherSidebar>`

const SNIPPET_TREE = `<DitherSidebar collapse="none" density="compact" variant="inset">
  <template #header>
    Explorer · <button @click="all(true)">expand</button>
    / <button @click="all(false)">collapse</button>
  </template>

  <DitherSidebarSub v-model="open.src" label="src">
    <DitherSidebarSub v-model="open.components" label="components">   <!-- nests -->
      <DitherSidebarItem label="DitherSidebar.vue"
        :active="file === 'DitherSidebar.vue'" @select="file = 'DitherSidebar.vue'" />
      <DitherSidebarItem label="DitherButton.vue" />
    </DitherSidebarSub>
    <DitherSidebarSub v-model="open.charts" label="charts">…</DitherSidebarSub>
    <DitherSidebarItem label="index.ts" />
  </DitherSidebarSub>
  <DitherSidebarSub v-model="open.public" label="public">…</DitherSidebarSub>
</DitherSidebar>`

const SNIPPET_DRAWER = `<!-- mobile: the sidebar rides in a drawer -->
<button aria-label="Open navigation" @click="open = true">☰</button>

<DitherDrawer :open="open" side="left" title="Navigation" @close="open = false">
  <DitherSidebarGroup label="Browse">   <!-- items work standalone -->
    <DitherSidebarItem v-for="i in items" :label="i"
      :active="active === i" @select="pick(i)" />  <!-- pick() also closes -->
  </DitherSidebarGroup>
  <DitherSidebarGroup label="Library">…</DitherSidebarGroup>
</DitherDrawer>

<!-- swipe-to-dismiss ships with the drawer; Escape closes; focus is trapped -->`

const SNIPPET_RAIL = `<!-- the whole nav in 56px — tooltips carry the labels -->
<DitherSidebar collapse="rail" :model-value="true" :toggle="false">
  <template #header>…glyph…</template>
  <DitherTooltip v-for="i in items" :text="i.label">
    <DitherSidebarItem :label="i.label" :badge="i.badge" :color="i.color"
      :active="active === i.label" @select="active = i.label" />
  </DitherTooltip>
  <template #footer><DitherAvatar name="Ada Byte" :size="22" /></template>
</DitherSidebar>`

export default function SidebarExamples() {
  /* Basic dashboard */
  const [dashCollapsed, setDashCollapsed] = createSignal(false)

  const [dashActive, setDashActive] = createSignal("Dashboard")

  /* Admin with profile */
  const [adminHidden, setAdminHidden] = createSignal(false)

  const [adminActive, setAdminActive] = createSignal("Members")

  /* E-commerce filters */
  const [filterSearch, setFilterSearch] = createSignal("")

  const cats = createMutable<Record<string, boolean>>({ Prints: true, Frames: false, Zines: false, Stickers: false })

  const brands = createMutable<Record<string, boolean>>({ "Bayer & Co": false, Ordered: true, Halftone: false })

  const [price, setPrice] = createSignal<[number, number]>([50, 500])

  const activeFilters = createMemo(
    () => Object.values(cats).filter(Boolean).length + Object.values(brands).filter(Boolean).length,
  )

  function resetFilters() {
    for (const k in cats) cats[k] = false
    for (const k in brands) brands[k] = false
    setPrice([0, 500])
    setFilterSearch("")
  }

  /* Documentation nav — data-driven so the search really filters */
  const [docsSearch, setDocsSearch] = createSignal("")

  const [docsActive, setDocsActive] = createSignal("Installation")

  const docsOpen = createMutable<Record<string, boolean>>({
    "Getting started": true,
    "API reference": false,
    Guides: false,
  })

  const docsFiltered = createMemo(() => {
    const q = docsSearch().trim().toLowerCase()
    const out: Record<string, string[]> = {}
    for (const [group, items] of Object.entries(DOCS_TREE)) {
      const hit = q ? items.filter((i) => i.toLowerCase().includes(q)) : items
      if (hit.length) out[group] = hit
    }
    return out
  })

  /* Dual layout */
  const [railActive, setRailActive] = createSignal("Inbox")

  const [dualActive, setDualActive] = createSignal("All mail")

  const calCells = Array.from({ length: CAL_LEAD + CAL_DAYS }, (_, i) => (i < CAL_LEAD ? null : i - CAL_LEAD + 1))

  const personal = createMutable([
    { label: "Morning walk", done: true },
    { label: "Read 30 minutes", done: false },
    { label: "Water the plants", done: true },
    { label: "Plan weekend trip", done: false },
  ])

  const work = createMutable([
    { label: "Team standup", done: true },
    { label: "Review pull requests", done: false },
    { label: "Prepare demo", done: false },
  ])

  /* Floating left */
  const [floatCollapsed, setFloatCollapsed] = createSignal(false)

  const [floatActive, setFloatActive] = createSignal("Home")

  const [favActive, setFavActive] = createSignal("")

  /* Right side */
  const calendars = createMutable([
    { label: "Personal", color: "blue", on: true },
    { label: "Work", color: "green", on: true },
    { label: "Family", color: "purple", on: false },
    { label: "Deadlines", color: "red", on: true },
  ] as { label: string; color: "blue" | "green" | "purple" | "red"; on: boolean }[])

  const teamNames = Object.keys(TEAMS)

  const [team, setTeam] = createSignal(teamNames[0])

  const [teamActive, setTeamActive] = createSignal("Roadmap")

  function switchTeam(name: string) {
    if (!TEAMS[name]) return
    setTeam(name)
    setTeamActive(Object.values(TEAMS[name].groups)[0][0].label)
  }

  /* File tree */
  const treeOpen = createMutable<Record<string, boolean>>({
    src: true,
    components: true,
    charts: false,
    lib: false,
    public: false,
  })

  const [treeActive, setTreeActive] = createSignal("DitherSidebar.vue")

  const treeAll = (open: boolean) => Object.keys(treeOpen).forEach((k) => (treeOpen[k] = open))

  /* Mobile drawer */
  const [drawerOpen, setDrawerOpen] = createSignal(false)

  const [drawerActive, setDrawerActive] = createSignal("Home")

  function drawerPick(label: string) {
    setDrawerActive(label)
    setDrawerOpen(false)
  }

  /* Icon rail */
  const [railOnly, setRailOnly] = createSignal("Charts")

  return (
    <>
      {/* Basic dashboard */}
      <section class="mt-16 scroll-mt-24" id="sidebar-dashboard">
        <h2 class="text-lg tracking-tight">Basic dashboard</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The workhorse frame: washed sidebar with a Main group, count badge, an upgrade card pinned above the user row,
          and a breadcrumb topbar whose toggle owns the icon rail.
        </p>
        <DemoCard code={SNIPPET_DASHBOARD}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
            <DitherSidebar
              modelValue={dashCollapsed()}
              onUpdateModelValue={setDashCollapsed}
              label="Dashboard nav"
              variant="washed"
              washColor="blue"
              toggle={false}
              header={
                <div class="flex h-8 items-center gap-2 px-2.5">
                  <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
                  <Show when={!dashCollapsed()}>
                    <span class="text-[12px] tracking-tight">acme.io</span>
                  </Show>
                </div>
              }
              footer={
                <>
                  <Show when={!dashCollapsed()}>
                    <div class="mb-2 rounded-md border border-border/60 bg-background/40 p-2.5">
                      <div class="text-[11px] text-foreground">Upgrade to pro</div>
                      <div class="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                        Unlock exports and presets.
                      </div>
                      <DitherButton class="mt-2 w-full py-1 text-[10px]" color="blue" variant="gradient">
                        Upgrade
                      </DitherButton>
                    </div>
                  </Show>
                  <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
                    <DitherAvatar name="Ada Byte" size={22} />
                    <Show when={!dashCollapsed()}>
                      <div class="min-w-0 leading-tight">
                        <div class="truncate text-[11px] text-foreground">Ada Byte</div>
                        <div class="truncate text-[10px] text-muted-foreground">ada@acme.io</div>
                      </div>
                    </Show>
                  </div>
                </>
              }
            >
              <DitherSidebarGroup label="Main">
                <DitherSidebarItem
                  label="Dashboard"
                  active={dashActive() === "Dashboard"}
                  onSelect={() => setDashActive("Dashboard")}
                />
                <DitherSidebarItem
                  label="Projects"
                  badge={12}
                  active={dashActive() === "Projects"}
                  onSelect={() => setDashActive("Projects")}
                />
                <DitherSidebarItem
                  label="Team"
                  active={dashActive() === "Team"}
                  onSelect={() => setDashActive("Team")}
                />
                <DitherSidebarItem
                  label="Settings"
                  active={dashActive() === "Settings"}
                  onSelect={() => setDashActive("Settings")}
                />
              </DitherSidebarGroup>
            </DitherSidebar>
            <main class="flex min-w-0 flex-1 flex-col">
              <div class="flex h-10 items-center gap-2 border-b border-border/60 px-3">
                <button
                  class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  type="button"
                  aria-label={dashCollapsed() ? "Expand sidebar" : "Collapse sidebar"}
                  aria-expanded={!dashCollapsed()}
                  onClick={() => setDashCollapsed(!dashCollapsed())}
                >
                  <span class="text-[12px] leading-none" aria-hidden="true">
                    ▤
                  </span>
                </button>
                <nav class="flex items-center gap-1.5 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
                  <span>Home</span>
                  <span aria-hidden="true">/</span>
                  <span>Projects</span>
                  <span aria-hidden="true">/</span>
                  <span class="text-foreground">{dashActive()}</span>
                </nav>
              </div>
              <div class="grid grid-cols-3 gap-3 p-4">
                <For
                  each={[
                    ["Revenue", "$12,480"],
                    ["Active", "1,204"],
                    ["Churn", "0.8%"],
                  ]}
                >
                  {(s) => (
                    <div class="rounded-md border border-border/60 p-3">
                      <div class="text-[11px] text-muted-foreground">{s[0]}</div>
                      <div class="mt-1 text-[15px] tabular-nums text-foreground">{s[1]}</div>
                    </div>
                  )}
                </For>
              </div>
              <div class="mx-4 mb-4 flex-1 rounded-md border border-dashed border-border/60" aria-hidden="true" />
            </main>
          </div>
        </DemoCard>
      </section>
      {/* Admin with profile */}
      <section class="mt-16 scroll-mt-24" id="sidebar-admin">
        <h2 class="text-lg tracking-tight">Admin with profile</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A floating admin panel with a quick-actions group, a storage meter card, and the signed-in profile pinned to
          the footer. The topbar hamburger hides the whole panel; the red badge keeps triage loud.
        </p>
        <DemoCard code={SNIPPET_ADMIN}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
            <DitherSidebar
              modelValue={adminHidden()}
              onUpdateModelValue={setAdminHidden}
              label="Admin nav"
              collapse="hide"
              variant="floating"
              toggle={false}
              header={
                <div class="flex h-8 items-center gap-2 px-2.5">
                  <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
                  <span class="text-[12px] tracking-tight">admin</span>
                </div>
              }
              footer={
                <>
                  <div class="mb-2 rounded-md border border-border/60 bg-background/40 p-2.5">
                    <div class="flex items-baseline justify-between">
                      <span class="text-[11px] text-foreground">Storage</span>
                      <span class="text-[10px] tabular-nums text-muted-foreground">68%</span>
                    </div>
                    <DitherMeter class="mt-1.5 h-2 w-full" value={68} />
                    <div class="mt-1 text-[10px] text-muted-foreground">6.8 of 10 GB used</div>
                  </div>
                  <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
                    <DitherAvatar name="Rei Toma" size={22} color="purple" />
                    <div class="min-w-0 flex-1 leading-tight">
                      <div class="truncate text-[11px] text-foreground">Rei Toma</div>
                      <div class="truncate text-[10px] text-muted-foreground">Owner</div>
                    </div>
                    <button
                      class="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      type="button"
                      aria-label="Sign out"
                    >
                      <span class="text-[11px]" aria-hidden="true">
                        ⏻
                      </span>
                    </button>
                  </div>
                </>
              }
            >
              <DitherSidebarGroup label="Manage">
                <DitherSidebarItem
                  label="Members"
                  badge={24}
                  active={adminActive() === "Members"}
                  onSelect={() => setAdminActive("Members")}
                />
                <DitherSidebarItem
                  label="Roles"
                  active={adminActive() === "Roles"}
                  onSelect={() => setAdminActive("Roles")}
                />
                <DitherSidebarItem
                  label="Audit log"
                  badge="!"
                  color="red"
                  active={adminActive() === "Audit log"}
                  onSelect={() => setAdminActive("Audit log")}
                />
              </DitherSidebarGroup>
              <DitherSidebarGroup label="Quick actions">
                <DitherSidebarItem
                  label="New member"
                  active={adminActive() === "New member"}
                  onSelect={() => setAdminActive("New member")}
                />
                <DitherSidebarItem
                  label="Create invite"
                  color="green"
                  active={adminActive() === "Create invite"}
                  onSelect={() => setAdminActive("Create invite")}
                />
                <DitherSidebarItem
                  label="Support"
                  active={adminActive() === "Support"}
                  onSelect={() => setAdminActive("Support")}
                />
              </DitherSidebarGroup>
            </DitherSidebar>
            <main class="flex min-w-0 flex-1 flex-col">
              <div class="flex h-10 items-center gap-3 border-b border-border/60 px-3">
                <button
                  class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  type="button"
                  aria-label={adminHidden() ? "Show sidebar" : "Hide sidebar"}
                  aria-expanded={!adminHidden()}
                  onClick={() => setAdminHidden(!adminHidden())}
                >
                  <span class="text-[13px] leading-none" aria-hidden="true">
                    ☰
                  </span>
                </button>
                <span class="text-[12px] text-foreground">{adminActive()}</span>
              </div>
              <div class="grid gap-2 p-4" aria-hidden="true">
                <For each={Array.from({ length: 5 }, (_, k) => k + 1)}>
                  {(i) => (
                    <div class="flex h-8 items-center gap-3 rounded-md border border-border/60 px-3">
                      <span class="size-3 rounded-[2px] bg-border/70" />
                      <span
                        class={`h-2 rounded-sm bg-border/50 ${["w-1/3", "w-1/4", "w-2/5", "w-1/3", "w-1/5"][i - 1]}`}
                      />
                      <span class="ml-auto h-2 w-10 rounded-sm bg-border/40" />
                    </div>
                  )}
                </For>
              </div>
            </main>
          </div>
        </DemoCard>
      </section>
      {/* E-commerce filters */}
      <section class="mt-16 scroll-mt-24" id="sidebar-filters">
        <h2 class="text-lg tracking-tight">E-commerce filters</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A filter rail for a storefront: search, category and brand checkboxes with result counts, a two-thumb price
          range, and apply/reset pinned to the footer. The topbar echoes the live filter count.
        </p>
        <DemoCard code={SNIPPET_FILTERS}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
            <DitherSidebar
              class="w-60 border-r border-border/60"
              label="Product filters"
              collapse="none"
              variant="inset"
              header={
                <div class="px-2.5">
                  <div class="flex items-center gap-2">
                    <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
                    <span class="text-[12px] tracking-tight">pixelmart</span>
                  </div>
                  <div class="mt-0.5 text-[10px] text-muted-foreground">Filter products</div>
                  <DitherInput
                    class="mt-2.5 w-full text-[11px]"
                    modelValue={filterSearch()}
                    onUpdateModelValue={setFilterSearch}
                    placeholder="Search products…"
                  />
                </div>
              }
              footer={
                <div class="grid gap-1.5 border-t border-border/60 px-2 pt-2">
                  <DitherButton class="w-full py-1.5 text-[11px]" color="green" variant="gradient">
                    Apply filters
                  </DitherButton>
                  <button
                    class="min-h-6 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                    type="button"
                    onClick={resetFilters}
                  >
                    Reset all
                  </button>
                </div>
              }
            >
              <DitherSidebarGroup label="Categories">
                <For each={Object.keys(CAT_COUNTS)}>
                  {(c) => (
                    <label class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground">
                      <DitherCheckbox
                        class="text-[11px]"
                        modelValue={cats[c]}
                        onUpdateModelValue={(v) => (cats[c] = v)}
                      >
                        {c}
                      </DitherCheckbox>
                      <span class="ml-auto tabular-nums text-muted-foreground">({CAT_COUNTS[c]})</span>
                    </label>
                  )}
                </For>
              </DitherSidebarGroup>
              <DitherSidebarGroup label="Price">
                <div class="px-2.5 pt-1">
                  <DitherSlider
                    modelValue={price()}
                    onUpdateModelValue={setPrice}
                    min={0}
                    max={500}
                    step={10}
                    label="Price range"
                    color="green"
                  />
                  <div class="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                    <span>${price()[0]}</span>
                    <span>${price()[1]}</span>
                  </div>
                </div>
              </DitherSidebarGroup>
              <DitherSidebarGroup label="Brands">
                <For each={Object.keys(BRAND_COUNTS)}>
                  {(b) => (
                    <label class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground">
                      <DitherCheckbox
                        class="text-[11px]"
                        modelValue={brands[b]}
                        onUpdateModelValue={(v) => (brands[b] = v)}
                      >
                        {b}
                      </DitherCheckbox>
                      <span class="ml-auto tabular-nums text-muted-foreground">({BRAND_COUNTS[b]})</span>
                    </label>
                  )}
                </For>
              </DitherSidebarGroup>
            </DitherSidebar>
            <main class="flex min-w-0 flex-1 flex-col">
              <div class="flex h-10 items-center justify-between border-b border-border/60 px-4">
                <span class="text-[12px] text-foreground">Products</span>
                <span class="flex gap-2 rounded border border-border/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                  <span>{activeFilters()} filters</span>
                  <span>
                    ${price()[0]}–${price()[1]}
                  </span>
                </span>
              </div>
              <div class="grid grid-cols-3 gap-3 p-4" aria-hidden="true">
                <For each={Array.from({ length: 6 }, (_, k) => k + 1)}>
                  {() => (
                    <div class="rounded-md border border-border/60 p-2">
                      <div class="aspect-square rounded bg-card/60" />
                      <div class="mt-2 h-2 w-3/4 rounded-sm bg-border/50" />
                      <div class="mt-1 h-2 w-1/3 rounded-sm bg-border/40" />
                    </div>
                  )}
                </For>
              </div>
            </main>
          </div>
        </DemoCard>
      </section>
      {/* Documentation nav */}
      <section class="mt-16 scroll-mt-24" id="sidebar-docs">
        <h2 class="text-lg tracking-tight">Documentation nav</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A docs tree: version chip, ⌘K search, one section open with the active page, the rest folded behind chevrons,
          and a help card in the footer. Compact rows, no icon rail: a docs tree needs its labels.
        </p>
        <DemoCard code={SNIPPET_DOCS}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
            <DitherSidebar
              class="w-60 border-r border-border/60"
              label="Docs nav"
              collapse="none"
              density="compact"
              variant="inset"
              header={
                <div class="px-2.5">
                  <div class="flex h-8 items-center justify-between">
                    <span class="text-[12px] tracking-tight">dither-ui</span>
                    <span class="rounded border border-border/60 px-1 text-[10px] tabular-nums text-muted-foreground">
                      v2.4
                    </span>
                  </div>
                  <div class="relative">
                    <DitherInput
                      class="w-full pr-8 text-[11px]"
                      modelValue={docsSearch()}
                      onUpdateModelValue={setDocsSearch}
                      placeholder="Search docs…"
                    />
                    <span class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border/60 px-1 text-[9px] text-muted-foreground">
                      ⌘K
                    </span>
                  </div>
                </div>
              }
              footer={
                <div class="rounded-md border border-border/60 bg-background/40 p-2.5">
                  <div class="text-[11px] text-foreground">Need help?</div>
                  <div class="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    Ask in the community or file an issue.
                  </div>
                </div>
              }
            >
              <For each={Object.keys(docsFiltered())}>
                {(group) => (
                  <DitherSidebarSub
                    label={group}
                    modelValue={docsSearch().trim() ? true : docsOpen[group]}
                    onUpdateModelValue={(v: boolean) => (docsOpen[group] = v)}
                  >
                    <For each={docsFiltered()[group]}>
                      {(item) => (
                        <DitherSidebarItem
                          label={item}
                          active={docsActive() === item}
                          onSelect={() => setDocsActive(item)}
                        />
                      )}
                    </For>
                  </DitherSidebarSub>
                )}
              </For>
              <Show when={!Object.keys(docsFiltered()).length}>
                <p class="px-2.5 py-4 text-[11px] text-muted-foreground">No pages match “{docsSearch()}”.</p>
              </Show>
            </DitherSidebar>
            <main class="min-w-0 flex-1 overflow-hidden p-5">
              <div class="text-[11px] text-muted-foreground">Docs / {docsActive()}</div>
              <div class="mt-2 text-[15px] tracking-tight text-foreground">{docsActive()}</div>
              <div class="mt-4 grid gap-2" aria-hidden="true">
                <div class="h-2 w-11/12 rounded-sm bg-border/50" />
                <div class="h-2 w-full rounded-sm bg-border/50" />
                <div class="h-2 w-3/4 rounded-sm bg-border/50" />
                <div class="mt-3 h-20 rounded-md border border-border/60 bg-background/40" />
                <div class="h-2 w-5/6 rounded-sm bg-border/50" />
              </div>
            </main>
          </div>
        </DemoCard>
      </section>
      {/* Dual layout */}
      <section class="mt-16 scroll-mt-24" id="sidebar-dual">
        <h2 class="text-lg tracking-tight">Dual layout</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Two tiers: a permanent icon rail picks the context, a second panel shows that context's tree. The rail is a
          Sidebar pinned to its rail state; the panel is a plain inset Sidebar beside it.
        </p>
        <DemoCard code={SNIPPET_DUAL}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
            <DitherSidebar
              class="border-r-0"
              label="Context rail"
              collapse="rail"
              modelValue={true}
              toggle={false}
              header={
                <div class="grid h-8 place-items-center">
                  <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                </div>
              }
            >
              <For each={Object.keys(PANELS)}>
                {(name) => (
                  <DitherSidebarItem
                    label={name}
                    active={railActive() === name}
                    onSelect={() => {
                      setRailActive(name)
                      setDualActive(PANELS[name].items[0].label)
                    }}
                  />
                )}
              </For>
            </DitherSidebar>
            <DitherSidebar
              class="w-52 border-r border-border/60 bg-background/20"
              label="Context panel"
              collapse="none"
              variant="inset"
              header={
                <div class="flex h-8 items-center px-2.5 text-[12px] tracking-tight text-foreground">
                  {PANELS[railActive()].title}
                </div>
              }
            >
              <For each={PANELS[railActive()].items}>
                {(item) => (
                  <DitherSidebarItem
                    label={item.label}
                    badge={item.badge}
                    active={dualActive() === item.label}
                    onSelect={() => setDualActive(item.label)}
                  />
                )}
              </For>
            </DitherSidebar>
            <main class="grid min-w-0 flex-1 place-items-center">
              <div class="text-center">
                <div class="text-[11px] text-muted-foreground">{railActive()}</div>
                <div class="mt-1 text-[13px] text-foreground">{dualActive()}</div>
              </div>
            </main>
          </div>
        </DemoCard>
      </section>
      {/* Personal dashboard */}
      <section class="mt-16 scroll-mt-24" id="sidebar-personal">
        <h2 class="text-lg tracking-tight">Personal dashboard</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A personal hub: avatar header, a mini month at a glance, and two todo lists whose done items strike through.
          Everything is live: tick a box and the footer count follows.
        </p>
        <DemoCard code={SNIPPET_PERSONAL}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
            <DitherSidebar
              class="w-60 border-r border-border/60"
              label="Personal hub"
              collapse="none"
              variant="inset"
              header={
                <div class="flex items-center gap-2.5 px-2.5">
                  <DitherAvatar name="Mika Dot" size={26} color="purple" />
                  <div class="min-w-0 leading-tight">
                    <div class="truncate text-[12px] text-foreground">Personal hub</div>
                    <div class="truncate text-[10px] text-muted-foreground">Organize your day</div>
                  </div>
                </div>
              }
              footer={
                <div class="flex items-center gap-1.5 border-t border-border/60 px-2.5 pt-2 text-[10px] text-muted-foreground">
                  <span class="size-1.5 rounded-full bg-green-500/80" aria-hidden="true" />{" "}
                  {[...personal, ...work].filter((t) => t.done).length} of {personal.length + work.length} done, synced
                </div>
              }
            >
              <DitherSidebarGroup label="Calendar">
                <div class="px-2.5">
                  <div class="flex items-center justify-between text-[10px] text-muted-foreground">
                    <button
                      class="grid size-5 place-items-center rounded hover:bg-card hover:text-foreground"
                      type="button"
                      aria-label="Previous month"
                    >
                      ‹
                    </button>
                    <span class="text-[11px]">Jul 2026</span>
                    <button
                      class="grid size-5 place-items-center rounded hover:bg-card hover:text-foreground"
                      type="button"
                      aria-label="Next month"
                    >
                      ›
                    </button>
                  </div>
                  <div class="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[9px] text-muted-foreground">
                    <For each={DOW}>{(d) => <span>{d}</span>}</For>
                  </div>
                  <div class="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-[10px] tabular-nums">
                    <For each={calCells}>
                      {(day) => (
                        <span
                          class={`grid h-5 place-items-center rounded-[3px] ${
                            day === CAL_TODAY
                              ? "bg-card text-foreground ring-1 ring-border"
                              : day
                                ? "text-muted-foreground"
                                : ""
                          }`}
                        >
                          {day ?? ""}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
              </DitherSidebarGroup>
              <DitherSidebarGroup label="Personal">
                <For each={personal}>
                  {(t) => (
                    <label class="flex h-7 cursor-pointer items-center rounded-md px-2.5 text-[11px] transition-colors hover:bg-card/60">
                      <DitherCheckbox
                        class="text-[11px]"
                        modelValue={t.done}
                        onUpdateModelValue={(v) => (t.done = v)}
                        color="purple"
                      >
                        <span class={t.done ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                          {t.label}
                        </span>
                      </DitherCheckbox>
                    </label>
                  )}
                </For>
              </DitherSidebarGroup>
              <DitherSidebarGroup label="Work">
                <For each={work}>
                  {(t) => (
                    <label class="flex h-7 cursor-pointer items-center rounded-md px-2.5 text-[11px] transition-colors hover:bg-card/60">
                      <DitherCheckbox
                        class="text-[11px]"
                        modelValue={t.done}
                        onUpdateModelValue={(v) => (t.done = v)}
                        color="green"
                      >
                        <span class={t.done ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                          {t.label}
                        </span>
                      </DitherCheckbox>
                    </label>
                  )}
                </For>
              </DitherSidebarGroup>
            </DitherSidebar>
            <main class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">
              Stay organized, stay focused
            </main>
          </div>
        </DemoCard>
      </section>
      {/* Floating left */}
      <section class="mt-16 scroll-mt-24" id="sidebar-floating">
        <h2 class="text-lg tracking-tight">Floating left</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A detached card over the canvas: workspace switcher up top, search, primary rows with an inbox badge, and
          favorites that truncate gracefully. Collapses to the icon rail like any other Sidebar.
        </p>
        <DemoCard code={SNIPPET_FLOATING}>
          <div class="relative mx-auto h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
            <div class="absolute inset-0 grid place-items-center text-[12px] text-muted-foreground" aria-hidden="true">
              Canvas
            </div>
            <DitherSidebar
              class="relative h-[calc(100%-1rem)]"
              modelValue={floatCollapsed()}
              onUpdateModelValue={setFloatCollapsed}
              label="Workspace nav"
              variant="floating"
              header={
                <>
                  <button
                    class="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5 text-left transition-colors hover:bg-card"
                    type="button"
                    aria-label="Switch workspace"
                  >
                    <DitherAvatar name="Acme Inc" size={22} color="blue" />
                    <Show when={!floatCollapsed()}>
                      <span class="min-w-0 flex-1 leading-tight">
                        <span class="block truncate text-[11px] text-foreground">Acme Inc</span>
                        <span class="block truncate text-[9px] text-muted-foreground">Enterprise</span>
                      </span>
                    </Show>
                    <Show when={!floatCollapsed()}>
                      <span class="text-[10px] text-muted-foreground" aria-hidden="true">
                        ⇅
                      </span>
                    </Show>
                  </button>
                  <Show when={!floatCollapsed()}>
                    <DitherInput class="mt-2 w-full text-[11px]" placeholder="Search…" />
                  </Show>
                </>
              }
              footer={
                <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
                  <DitherAvatar name="Juno Bit" size={22} color="green" />
                  <Show when={!floatCollapsed()}>
                    <div class="min-w-0 leading-tight">
                      <div class="truncate text-[11px] text-foreground">Juno Bit</div>
                      <div class="truncate text-[10px] text-muted-foreground">juno@acme.io</div>
                    </div>
                  </Show>
                </div>
              }
            >
              <DitherSidebarItem
                label="Assistant"
                color="purple"
                active={floatActive() === "Assistant"}
                onSelect={() => setFloatActive("Assistant")}
              />
              <DitherSidebarItem
                label="Home"
                active={floatActive() === "Home"}
                onSelect={() => setFloatActive("Home")}
              />
              <DitherSidebarItem
                label="Inbox"
                badge={10}
                active={floatActive() === "Inbox"}
                onSelect={() => setFloatActive("Inbox")}
              />
              <DitherSidebarGroup label="Favorites">
                <For each={FAVORITES}>
                  {(f) => (
                    <DitherSidebarItem
                      label={f}
                      active={favActive() === f}
                      onSelect={() => {
                        setFavActive(f)
                        setFloatActive("")
                      }}
                    />
                  )}
                </For>
              </DitherSidebarGroup>
            </DitherSidebar>
          </div>
        </DemoCard>
      </section>
      {/* Right side */}
      <section class="mt-16 scroll-mt-24" id="sidebar-right">
        <h2 class="text-lg tracking-tight">Right side</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The same Sidebar flipped to the right edge: a profile header, the mini month, and calendar toggles with their
          color dots. The topbar button hides the whole panel when the content needs the room.
        </p>
        <DemoCard code={SNIPPET_RIGHT}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
            <main class="flex min-w-0 flex-1 flex-col">
              <div class="flex h-10 items-center justify-between border-b border-border/60 px-3">
                <span class="text-[12px] text-foreground">July 2026</span>
                <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {calendars.filter((c) => c.on).length} calendars shown
                </span>
              </div>
              <div class="grid flex-1 grid-cols-7 gap-px bg-border/40 p-px" aria-hidden="true">
                <For each={Array.from({ length: 35 }, (_, k) => k + 1)}>{() => <div class="bg-background/80" />}</For>
              </div>
            </main>
            <DitherSidebar
              class="w-56 border-l border-border/60 bg-card/20"
              label="Calendar panel"
              side="right"
              collapse="none"
              variant="inset"
              header={
                <div class="flex items-center gap-2.5 px-2.5">
                  <DitherAvatar name="Juno Bit" size={24} color="green" />
                  <div class="min-w-0 leading-tight">
                    <div class="truncate text-[12px] text-foreground">Juno Bit</div>
                    <div class="truncate text-[10px] text-muted-foreground">juno@dither-ui.com</div>
                  </div>
                </div>
              }
              footer={
                <button
                  class="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                  type="button"
                >
                  <span aria-hidden="true">+</span> New calendar
                </button>
              }
            >
              <DitherSidebarGroup label="Calendar">
                <div class="px-2.5">
                  <div class="grid grid-cols-7 gap-0.5 text-center text-[9px] text-muted-foreground">
                    <For each={DOW}>{(d) => <span>{d}</span>}</For>
                  </div>
                  <div class="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-[10px] tabular-nums">
                    <For each={calCells}>
                      {(day) => (
                        <span
                          class={`grid h-5 place-items-center rounded-[3px] ${
                            day === CAL_TODAY
                              ? "bg-card text-foreground ring-1 ring-border"
                              : day
                                ? "text-muted-foreground"
                                : ""
                          }`}
                        >
                          {day ?? ""}
                        </span>
                      )}
                    </For>
                  </div>
                </div>
              </DitherSidebarGroup>
              <DitherSidebarGroup label="My calendars">
                <For each={calendars}>
                  {(c) => (
                    <label class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground">
                      <DitherCheckbox
                        class="text-[11px]"
                        modelValue={c.on}
                        onUpdateModelValue={(v) => (c.on = v)}
                        color={c.color}
                      >
                        {c.label}
                      </DitherCheckbox>
                      <span
                        class="ml-auto size-1.5 rounded-full"
                        style={{ "background-color": `var(--swatch-${c.color}, currentColor)` }}
                        aria-hidden="true"
                      />
                    </label>
                  )}
                </For>
              </DitherSidebarGroup>
            </DitherSidebar>
          </div>
        </DemoCard>
      </section>
      {/* Team switcher */}
      <section class="mt-16 scroll-mt-24" id="sidebar-teams">
        <h2 class="text-lg tracking-tight">Team switcher</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One sidebar, three workspaces. The header dropdown swaps the whole identity: wash color, accent, groups,
          badges. Arrow keys walk the menu; Escape returns focus to the trigger.
        </p>
        <DemoCard code={SNIPPET_TEAMS}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
            <DitherSidebar
              class="w-60"
              label="Workspace nav"
              variant="washed"
              washColor={TEAMS[team()].color}
              collapse="none"
              header={
                <DitherMenu items={teamNames.map((n) => ({ label: n }))} onSelect={switchTeam}>
                  <span class="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5 text-left transition-colors hover:bg-card">
                    <DitherAvatar name={team()} size={22} color={TEAMS[team()].color} />
                    <span class="min-w-0 flex-1 leading-tight">
                      <span class="block truncate text-[11px] text-foreground">{team()}</span>
                      <span class="block truncate text-[9px] text-muted-foreground">{TEAMS[team()].plan}</span>
                    </span>
                    <span class="text-[10px] text-muted-foreground" aria-hidden="true">
                      ⇅
                    </span>
                  </span>
                </DitherMenu>
              }
            >
              <For each={Object.keys(TEAMS[team()].groups)}>
                {(group) => (
                  <DitherSidebarGroup label={group}>
                    <For each={TEAMS[team()].groups[group]}>
                      {(i) => (
                        <DitherSidebarItem
                          label={i.label}
                          badge={i.badge}
                          color={TEAMS[team()].color}
                          active={teamActive() === i.label}
                          onSelect={() => setTeamActive(i.label)}
                        />
                      )}
                    </For>
                  </DitherSidebarGroup>
                )}
              </For>
            </DitherSidebar>
            <main class="grid min-w-0 flex-1 place-items-center">
              <div class="text-center">
                <div class="text-[11px] text-muted-foreground">{team()}</div>
                <div class="mt-1 text-[13px] text-foreground">{teamActive()}</div>
              </div>
            </main>
          </div>
        </DemoCard>
      </section>
      {/* File tree */}
      <section class="mt-16 scroll-mt-24" id="sidebar-tree">
        <h2 class="text-lg tracking-tight">File tree</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Sub-menus nest: an explorer three levels deep with expand/collapse all, rail guides on every level, and a
          selected file the header echoes.
        </p>
        <DemoCard code={SNIPPET_TREE}>
          <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
            <DitherSidebar
              class="w-60 border-r border-border/60"
              label="File explorer"
              collapse="none"
              density="compact"
              variant="inset"
              header={
                <div class="flex h-8 items-center justify-between px-2.5">
                  <span class="text-[11px] text-muted-foreground">Explorer</span>
                  <span class="flex gap-1">
                    <button
                      class="grid size-5 place-items-center rounded text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      type="button"
                      aria-label="Expand all folders"
                      onClick={() => treeAll(true)}
                    >
                      +
                    </button>
                    <button
                      class="grid size-5 place-items-center rounded text-[10px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      type="button"
                      aria-label="Collapse all folders"
                      onClick={() => treeAll(false)}
                    >
                      −
                    </button>
                  </span>
                </div>
              }
            >
              <DitherSidebarSub modelValue={treeOpen.src} onUpdateModelValue={(v) => (treeOpen.src = v)} label="src">
                <DitherSidebarSub
                  modelValue={treeOpen.components}
                  onUpdateModelValue={(v) => (treeOpen.components = v)}
                  label="components"
                >
                  <DitherSidebarItem
                    label="DitherSidebar.vue"
                    active={treeActive() === "DitherSidebar.vue"}
                    onSelect={() => setTreeActive("DitherSidebar.vue")}
                  />
                  <DitherSidebarItem
                    label="DitherButton.vue"
                    active={treeActive() === "DitherButton.vue"}
                    onSelect={() => setTreeActive("DitherButton.vue")}
                  />
                  <DitherSidebarItem
                    label="DitherInput.vue"
                    active={treeActive() === "DitherInput.vue"}
                    onSelect={() => setTreeActive("DitherInput.vue")}
                  />
                </DitherSidebarSub>
                <DitherSidebarSub
                  modelValue={treeOpen.charts}
                  onUpdateModelValue={(v) => (treeOpen.charts = v)}
                  label="charts"
                >
                  <DitherSidebarItem
                    label="AreaChart.vue"
                    active={treeActive() === "AreaChart.vue"}
                    onSelect={() => setTreeActive("AreaChart.vue")}
                  />
                  <DitherSidebarItem
                    label="Sparkline.vue"
                    active={treeActive() === "Sparkline.vue"}
                    onSelect={() => setTreeActive("Sparkline.vue")}
                  />
                </DitherSidebarSub>
                <DitherSidebarSub modelValue={treeOpen.lib} onUpdateModelValue={(v) => (treeOpen.lib = v)} label="lib">
                  <DitherSidebarItem
                    label="palette.ts"
                    active={treeActive() === "palette.ts"}
                    onSelect={() => setTreeActive("palette.ts")}
                  />
                  <DitherSidebarItem
                    label="pixel.ts"
                    active={treeActive() === "pixel.ts"}
                    onSelect={() => setTreeActive("pixel.ts")}
                  />
                </DitherSidebarSub>
                <DitherSidebarItem
                  label="index.ts"
                  active={treeActive() === "index.ts"}
                  onSelect={() => setTreeActive("index.ts")}
                />
              </DitherSidebarSub>
              <DitherSidebarSub
                modelValue={treeOpen.public}
                onUpdateModelValue={(v) => (treeOpen.public = v)}
                label="public"
              >
                <DitherSidebarItem
                  label="faces.webp"
                  active={treeActive() === "faces.webp"}
                  onSelect={() => setTreeActive("faces.webp")}
                />
                <DitherSidebarItem
                  label="sprites.webp"
                  active={treeActive() === "sprites.webp"}
                  onSelect={() => setTreeActive("sprites.webp")}
                />
              </DitherSidebarSub>
            </DitherSidebar>
            <main class="flex min-w-0 flex-1 flex-col">
              <div class="flex h-9 items-center border-b border-border/60 px-3 text-[11px] text-muted-foreground">
                <span class="text-foreground">{treeActive()}</span>
              </div>
              <div class="grid flex-1 gap-1.5 p-4" aria-hidden="true">
                <For each={Array.from({ length: 8 }, (_, k) => k + 1)}>
                  {(i) => (
                    <div
                      class={`h-2 rounded-sm bg-border/40 ${["w-2/3", "w-11/12", "w-3/4", "w-5/6", "w-1/2", "w-4/5", "w-2/3", "w-1/3"][i - 1]}`}
                    />
                  )}
                </For>
              </div>
            </main>
          </div>
        </DemoCard>
      </section>
      {/* Mobile drawer */}
      <section class="mt-16 scroll-mt-24" id="sidebar-drawer">
        <h2 class="text-lg tracking-tight">Mobile drawer</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Below the breakpoint the sidebar rides in a drawer: hamburger opens, picking a destination closes, swipe
          dismisses. Groups and items work standalone inside any panel.
        </p>
        <DemoCard code={SNIPPET_DRAWER}>
          <div class="relative mx-auto flex h-96 w-64 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/40">
            <div class="flex h-11 shrink-0 items-center gap-2.5 border-b border-border/60 px-3">
              <button
                class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                type="button"
                aria-label="Open navigation"
                onClick={() => setDrawerOpen(true)}
              >
                <span class="text-[13px] leading-none" aria-hidden="true">
                  ☰
                </span>
              </button>
              <span class="text-[12px] text-foreground">{drawerActive()}</span>
            </div>
            <div class="grid flex-1 content-start gap-2 p-3" aria-hidden="true">
              <div class="h-24 rounded-md border border-border/60 bg-card/40" />
              <div class="h-2 w-3/4 rounded-sm bg-border/50" />
              <div class="h-2 w-1/2 rounded-sm bg-border/50" />
              <div class="h-16 rounded-md border border-border/60 bg-card/40" />
            </div>
            <DitherDrawer open={drawerOpen()} side="left" title="Navigation" onClose={() => setDrawerOpen(false)}>
              <DitherSidebarGroup label="Browse">
                <For each={["Home", "Discover", "Library"]}>
                  {(i) => <DitherSidebarItem label={i} active={drawerActive() === i} onSelect={() => drawerPick(i)} />}
                </For>
              </DitherSidebarGroup>
              <DitherSidebarGroup label="You">
                <DitherSidebarItem
                  label="Saved"
                  badge={8}
                  active={drawerActive() === "Saved"}
                  onSelect={() => drawerPick("Saved")}
                />
                <DitherSidebarItem
                  label="Settings"
                  active={drawerActive() === "Settings"}
                  onSelect={() => drawerPick("Settings")}
                />
              </DitherSidebarGroup>
            </DitherDrawer>
          </div>
        </DemoCard>
      </section>
      {/* Icon rail */}
      <section class="mt-16 scroll-mt-24" id="sidebar-rail">
        <h2 class="text-lg tracking-tight">Icon rail</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The whole nav in 56 pixels: a permanent rail where tooltips carry the labels, badges fold to colored dots, and
          the footer keeps the person.
        </p>
        <DemoCard code={SNIPPET_RAIL}>
          <div class="mx-auto flex h-80 max-w-md overflow-hidden rounded-lg border border-border/60">
            <DitherSidebar
              label="Rail nav"
              collapse="rail"
              modelValue={true}
              toggle={false}
              header={
                <div class="grid h-8 place-items-center">
                  <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
                </div>
              }
              footer={
                <div class="grid place-items-center border-t border-border/60 pt-2">
                  <DitherAvatar name="Ada Byte" size={22} />
                </div>
              }
            >
              <For each={RAIL_ITEMS}>
                {(i) => (
                  <DitherTooltip text={i.label}>
                    <DitherSidebarItem
                      label={i.label}
                      badge={i.badge}
                      color={i.color}
                      active={railOnly() === i.label}
                      onSelect={() => setRailOnly(i.label)}
                    />
                  </DitherTooltip>
                )}
              </For>
            </DitherSidebar>
            <main class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">{railOnly()}</main>
          </div>
        </DemoCard>
      </section>
    </>
  )
}
