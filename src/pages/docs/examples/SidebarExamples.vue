<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import {
  DitherAvatar,
  DitherButton,
  DitherCheckbox,
  DitherInput,
  DitherMeter,
  DitherSidebar,
  DitherSidebarGroup,
  DitherSidebarItem,
  DitherSidebarSub,
  DitherSlider,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"

/* Basic dashboard */
const dashCollapsed = ref(false)
const dashActive = ref("Dashboard")

/* Admin with profile */
const adminHidden = ref(false)
const adminActive = ref("Members")

/* E-commerce filters */
const filterSearch = ref("")
const cats = reactive<Record<string, boolean>>({ Prints: true, Frames: false, Zines: false, Stickers: false })
const CAT_COUNTS: Record<string, number> = { Prints: 125, Frames: 89, Zines: 34, Stickers: 67 }
const brands = reactive<Record<string, boolean>>({ "Bayer & Co": false, Ordered: true, Halftone: false })
const BRAND_COUNTS: Record<string, number> = { "Bayer & Co": 45, Ordered: 38, Halftone: 29 }
const price = ref<[number, number]>([50, 500])
const activeFilters = computed(
  () => Object.values(cats).filter(Boolean).length + Object.values(brands).filter(Boolean).length
)
function resetFilters() {
  for (const k in cats) cats[k] = false
  for (const k in brands) brands[k] = false
  price.value = [0, 500]
  filterSearch.value = ""
}

/* Documentation nav */
const docsSearch = ref("")
const docsActive = ref("Installation")
const docsStarted = ref(true)
const docsApi = ref(false)
const docsGuides = ref(false)

/* Dual layout */
const railActive = ref("Inbox")
const PANELS: Record<string, { title: string; items: { label: string; badge?: number }[] }> = {
  Inbox: { title: "Inbox", items: [{ label: "All mail", badge: 24 }, { label: "Starred", badge: 3 }, { label: "Drafts" }, { label: "Archive" }] },
  Files: { title: "Files", items: [{ label: "Recent" }, { label: "Shared with me", badge: 5 }, { label: "Exports" }, { label: "Trash" }] },
  Tasks: { title: "Tasks", items: [{ label: "Today", badge: 4 }, { label: "Upcoming", badge: 12 }, { label: "Someday" }, { label: "Done" }] },
}
const dualActive = ref("All mail")

/* Personal dashboard + Right side: mini calendar */
const CAL_LEAD = 2 // month opens on a Wednesday
const CAL_DAYS = 31
const CAL_TODAY = 21
const calCells = Array.from({ length: CAL_LEAD + CAL_DAYS }, (_, i) => (i < CAL_LEAD ? null : i - CAL_LEAD + 1))
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

const personal = reactive([
  { label: "Morning walk", done: true },
  { label: "Read 30 minutes", done: false },
  { label: "Water the plants", done: true },
  { label: "Plan weekend trip", done: false },
])
const work = reactive([
  { label: "Team standup", done: true },
  { label: "Review pull requests", done: false },
  { label: "Prepare demo", done: false },
])

/* Floating left */
const floatCollapsed = ref(false)
const floatActive = ref("Home")
const FAVORITES = [
  "Print run planning & schedule",
  "Zine layouts & paste-ups",
  "Palette research notebook",
  "Client proofs & feedback",
]
const favActive = ref("")

/* Right side */
const calendars = reactive([
  { label: "Personal", color: "blue", on: true },
  { label: "Work", color: "green", on: true },
  { label: "Family", color: "purple", on: false },
  { label: "Deadlines", color: "red", on: true },
] as { label: string; color: "blue" | "green" | "purple" | "red"; on: boolean }[])

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
    <DitherInput v-model="query" placeholder="Search docs…" />  <!-- ⌘K -->
  </template>
  <DitherSidebarSub v-model="started" label="Getting started">
    <DitherSidebarItem label="Introduction" />
    <DitherSidebarItem label="Installation" :active="active === 'Installation'" />
    <DitherSidebarItem label="Quick start" />
  </DitherSidebarSub>
  <DitherSidebarSub v-model="api" label="API reference">…</DitherSidebarSub>
  <DitherSidebarSub v-model="guides" label="Guides">…</DitherSidebarSub>
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
</script>

<template>
  <!-- Basic dashboard -->
  <section id="sidebar-dashboard" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Basic dashboard</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The workhorse frame — washed sidebar with a Main group, count badge,
      an upgrade card pinned above the user row, and a breadcrumb topbar
      whose toggle owns the icon rail.
    </p>
    <DemoCard :code="SNIPPET_DASHBOARD">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar v-model="dashCollapsed" label="Dashboard nav" variant="washed" wash-color="blue" :toggle="false">
          <template #header>
            <div class="flex h-8 items-center gap-2 px-2.5">
              <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <span v-if="!dashCollapsed" class="text-[12px] tracking-tight">acme.io</span>
            </div>
          </template>
          <DitherSidebarGroup label="Main">
            <DitherSidebarItem label="Dashboard" :active="dashActive === 'Dashboard'" @select="dashActive = 'Dashboard'" />
            <DitherSidebarItem label="Projects" :badge="12" :active="dashActive === 'Projects'" @select="dashActive = 'Projects'" />
            <DitherSidebarItem label="Team" :active="dashActive === 'Team'" @select="dashActive = 'Team'" />
            <DitherSidebarItem label="Settings" :active="dashActive === 'Settings'" @select="dashActive = 'Settings'" />
          </DitherSidebarGroup>
          <template #footer>
            <div v-if="!dashCollapsed" class="mb-2 rounded-md border border-border/60 bg-background/40 p-2.5">
              <div class="text-[11px] text-foreground">Upgrade to pro</div>
              <div class="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">Unlock exports and presets.</div>
              <DitherButton color="blue" variant="gradient" class="mt-2 w-full py-1 text-[10px]">Upgrade</DitherButton>
            </div>
            <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
              <DitherAvatar name="Ada Byte" :size="22" />
              <div v-if="!dashCollapsed" class="min-w-0 leading-tight">
                <div class="truncate text-[11px] text-foreground">Ada Byte</div>
                <div class="truncate text-[10px] text-muted-foreground">ada@acme.io</div>
              </div>
            </div>
          </template>
        </DitherSidebar>
        <main class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center gap-2 border-b border-border/60 px-3">
            <button
              type="button"
              class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              :aria-label="dashCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              :aria-expanded="!dashCollapsed"
              @click="dashCollapsed = !dashCollapsed"
            >
              <span aria-hidden="true" class="text-[12px] leading-none">▤</span>
            </button>
            <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Home</span>
              <span aria-hidden="true">/</span>
              <span>Projects</span>
              <span aria-hidden="true">/</span>
              <span class="text-foreground">{{ dashActive }}</span>
            </nav>
          </div>
          <div class="grid grid-cols-3 gap-3 p-4">
            <div v-for="s in [['Revenue', '$12,480'], ['Active', '1,204'], ['Churn', '0.8%']]" :key="s[0]" class="rounded-md border border-border/60 p-3">
              <div class="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">{{ s[0] }}</div>
              <div class="mt-1 text-[15px] tabular-nums text-foreground">{{ s[1] }}</div>
            </div>
          </div>
          <div class="mx-4 mb-4 flex-1 rounded-md border border-dashed border-border/60" aria-hidden="true" />
        </main>
      </div>
    </DemoCard>
  </section>

  <!-- Admin with profile -->
  <section id="sidebar-admin" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Admin with profile</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A floating admin panel with a quick-actions group, a storage meter card,
      and the signed-in profile pinned to the footer. The topbar hamburger
      hides the whole panel; the red badge keeps triage loud.
    </p>
    <DemoCard :code="SNIPPET_ADMIN">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar v-model="adminHidden" label="Admin nav" collapse="hide" variant="floating" :toggle="false">
          <template #header>
            <div class="flex h-8 items-center gap-2 px-2.5">
              <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <span class="text-[12px] tracking-tight">admin</span>
            </div>
          </template>
          <DitherSidebarGroup label="Manage">
            <DitherSidebarItem label="Members" :badge="24" :active="adminActive === 'Members'" @select="adminActive = 'Members'" />
            <DitherSidebarItem label="Roles" :active="adminActive === 'Roles'" @select="adminActive = 'Roles'" />
            <DitherSidebarItem label="Audit log" badge="!" color="red" :active="adminActive === 'Audit log'" @select="adminActive = 'Audit log'" />
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Quick actions">
            <DitherSidebarItem label="New member" :active="adminActive === 'New member'" @select="adminActive = 'New member'" />
            <DitherSidebarItem label="Create invite" color="green" :active="adminActive === 'Create invite'" @select="adminActive = 'Create invite'" />
            <DitherSidebarItem label="Support" :active="adminActive === 'Support'" @select="adminActive = 'Support'" />
          </DitherSidebarGroup>
          <template #footer>
            <div class="mb-2 rounded-md border border-border/60 bg-background/40 p-2.5">
              <div class="flex items-baseline justify-between">
                <span class="text-[11px] text-foreground">Storage</span>
                <span class="text-[10px] tabular-nums text-muted-foreground">68%</span>
              </div>
              <DitherMeter :value="68" class="mt-1.5 h-2 w-full" />
              <div class="mt-1 text-[10px] text-muted-foreground">6.8 of 10 GB used</div>
            </div>
            <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
              <DitherAvatar name="Rei Toma" :size="22" color="purple" />
              <div class="min-w-0 flex-1 leading-tight">
                <div class="truncate text-[11px] text-foreground">Rei Toma</div>
                <div class="truncate text-[10px] text-muted-foreground">Owner</div>
              </div>
              <button
                type="button"
                aria-label="Sign out"
                class="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                <span aria-hidden="true" class="text-[11px]">⏻</span>
              </button>
            </div>
          </template>
        </DitherSidebar>
        <main class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center gap-3 border-b border-border/60 px-3">
            <button
              type="button"
              class="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              :aria-label="adminHidden ? 'Show sidebar' : 'Hide sidebar'"
              :aria-expanded="!adminHidden"
              @click="adminHidden = !adminHidden"
            >
              <span aria-hidden="true" class="text-[13px] leading-none">☰</span>
            </button>
            <span class="text-[12px] text-foreground">{{ adminActive }}</span>
          </div>
          <div class="grid gap-2 p-4" aria-hidden="true">
            <div class="flex h-8 items-center gap-3 rounded-md border border-border/60 px-3" v-for="i in 5" :key="i">
              <span class="size-3 rounded-[2px] bg-border/70" />
              <span class="h-2 rounded-sm bg-border/50" :class="['w-1/3', 'w-1/4', 'w-2/5', 'w-1/3', 'w-1/5'][i - 1]" />
              <span class="ml-auto h-2 w-10 rounded-sm bg-border/40" />
            </div>
          </div>
        </main>
      </div>
    </DemoCard>
  </section>

  <!-- E-commerce filters -->
  <section id="sidebar-filters" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">E-commerce filters</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A filter rail for a storefront — search, category and brand checkboxes
      with result counts, a two-thumb price range, and apply/reset pinned to
      the footer. The topbar echoes the live filter count.
    </p>
    <DemoCard :code="SNIPPET_FILTERS">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar label="Product filters" collapse="none" variant="inset" class="w-60 border-r border-border/60">
          <template #header>
            <div class="px-2.5">
              <div class="flex items-center gap-2">
                <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
                <span class="text-[12px] tracking-tight">pixelmart</span>
              </div>
              <div class="mt-0.5 text-[10px] text-muted-foreground">Filter products</div>
              <DitherInput v-model="filterSearch" placeholder="Search products…" class="mt-2.5 w-full text-[11px]" />
            </div>
          </template>
          <DitherSidebarGroup label="Categories">
            <label
              v-for="(count, c) in CAT_COUNTS"
              :key="c"
              class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
            >
              <DitherCheckbox v-model="cats[c]" class="text-[11px]">{{ c }}</DitherCheckbox>
              <span class="ml-auto tabular-nums text-muted-foreground/70">({{ count }})</span>
            </label>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Price">
            <div class="px-2.5 pt-1">
              <DitherSlider v-model="price" :min="0" :max="500" :step="10" label="Price range" color="green" />
              <div class="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                <span>${{ price[0] }}</span>
                <span>${{ price[1] }}</span>
              </div>
            </div>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Brands">
            <label
              v-for="(count, b) in BRAND_COUNTS"
              :key="b"
              class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
            >
              <DitherCheckbox v-model="brands[b]" class="text-[11px]">{{ b }}</DitherCheckbox>
              <span class="ml-auto tabular-nums text-muted-foreground/70">({{ count }})</span>
            </label>
          </DitherSidebarGroup>
          <template #footer>
            <div class="grid gap-1.5 border-t border-border/60 px-2 pt-2">
              <DitherButton color="green" variant="gradient" class="w-full py-1.5 text-[11px]">Apply filters</DitherButton>
              <button
                type="button"
                class="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                @click="resetFilters"
              >
                Reset all
              </button>
            </div>
          </template>
        </DitherSidebar>
        <main class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center justify-between border-b border-border/60 px-4">
            <span class="text-[12px] text-foreground">Products</span>
            <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {{ activeFilters }} filters · ${{ price[0] }}–${{ price[1] }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-3 p-4" aria-hidden="true">
            <div v-for="i in 6" :key="i" class="rounded-md border border-border/60 p-2">
              <div class="aspect-square rounded bg-card/60" />
              <div class="mt-2 h-2 w-3/4 rounded-sm bg-border/50" />
              <div class="mt-1 h-2 w-1/3 rounded-sm bg-border/40" />
            </div>
          </div>
        </main>
      </div>
    </DemoCard>
  </section>

  <!-- Documentation nav -->
  <section id="sidebar-docs" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Documentation nav</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A docs tree — version chip, ⌘K search, one section open with the active
      page, the rest folded behind chevrons, and a help card in the footer.
      Compact rows, no icon rail: a docs tree needs its labels.
    </p>
    <DemoCard :code="SNIPPET_DOCS">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar label="Docs nav" collapse="none" density="compact" variant="inset" class="w-60 border-r border-border/60">
          <template #header>
            <div class="px-2.5">
              <div class="flex h-8 items-center justify-between">
                <span class="text-[12px] tracking-tight">dither-ui</span>
                <span class="rounded border border-border/60 px-1 text-[10px] tabular-nums text-muted-foreground">v2.4</span>
              </div>
              <div class="relative">
                <DitherInput v-model="docsSearch" placeholder="Search docs…" class="w-full pr-8 text-[11px]" />
                <span class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border/60 px-1 text-[9px] text-muted-foreground">⌘K</span>
              </div>
            </div>
          </template>
          <DitherSidebarSub v-model="docsStarted" label="Getting started">
            <DitherSidebarItem label="Introduction" :active="docsActive === 'Introduction'" @select="docsActive = 'Introduction'" />
            <DitherSidebarItem label="Installation" :active="docsActive === 'Installation'" @select="docsActive = 'Installation'" />
            <DitherSidebarItem label="Quick start" :active="docsActive === 'Quick start'" @select="docsActive = 'Quick start'" />
            <DitherSidebarItem label="Configuration" :active="docsActive === 'Configuration'" @select="docsActive = 'Configuration'" />
          </DitherSidebarSub>
          <DitherSidebarSub v-model="docsApi" label="API reference">
            <DitherSidebarItem label="Props" :active="docsActive === 'Props'" @select="docsActive = 'Props'" />
            <DitherSidebarItem label="Events" :active="docsActive === 'Events'" @select="docsActive = 'Events'" />
            <DitherSidebarItem label="Slots" :active="docsActive === 'Slots'" @select="docsActive = 'Slots'" />
          </DitherSidebarSub>
          <DitherSidebarSub v-model="docsGuides" label="Guides">
            <DitherSidebarItem label="Theming" :active="docsActive === 'Theming'" @select="docsActive = 'Theming'" />
            <DitherSidebarItem label="Composition" :active="docsActive === 'Composition'" @select="docsActive = 'Composition'" />
          </DitherSidebarSub>
          <template #footer>
            <div class="rounded-md border border-border/60 bg-background/40 p-2.5">
              <div class="text-[11px] text-foreground">Need help?</div>
              <div class="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">Ask in the community or file an issue.</div>
            </div>
          </template>
        </DitherSidebar>
        <main class="min-w-0 flex-1 overflow-hidden p-5">
          <div class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Docs / {{ docsActive }}</div>
          <div class="mt-2 text-[15px] tracking-tight text-foreground">{{ docsActive }}</div>
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

  <!-- Dual layout -->
  <section id="sidebar-dual" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dual layout</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Two tiers — a permanent icon rail picks the context, a second panel
      shows that context's tree. The rail is a Sidebar pinned to its rail
      state; the panel is a plain inset Sidebar beside it.
    </p>
    <DemoCard :code="SNIPPET_DUAL">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar label="Context rail" collapse="rail" :model-value="true" :toggle="false" class="border-r-0">
          <template #header>
            <div class="grid h-8 place-items-center">
              <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
            </div>
          </template>
          <DitherSidebarItem
            v-for="(p, name) in PANELS"
            :key="name"
            :label="String(name)"
            :active="railActive === name"
            @select="railActive = String(name); dualActive = p.items[0].label"
          />
        </DitherSidebar>
        <DitherSidebar label="Context panel" collapse="none" variant="inset" class="w-52 border-r border-border/60 bg-background/20">
          <template #header>
            <div class="flex h-8 items-center px-2.5 text-[12px] tracking-tight text-foreground">{{ PANELS[railActive].title }}</div>
          </template>
          <DitherSidebarItem
            v-for="item in PANELS[railActive].items"
            :key="item.label"
            :label="item.label"
            :badge="item.badge"
            :active="dualActive === item.label"
            @select="dualActive = item.label"
          />
        </DitherSidebar>
        <main class="grid min-w-0 flex-1 place-items-center">
          <div class="text-center">
            <div class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{{ railActive }}</div>
            <div class="mt-1 text-[13px] text-foreground">{{ dualActive }}</div>
          </div>
        </main>
      </div>
    </DemoCard>
  </section>

  <!-- Personal dashboard -->
  <section id="sidebar-personal" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Personal dashboard</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A personal hub — avatar header, a mini month at a glance, and two todo
      lists whose done items strike through. Everything is live: tick a box
      and the footer count follows.
    </p>
    <DemoCard :code="SNIPPET_PERSONAL">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <DitherSidebar label="Personal hub" collapse="none" variant="inset" class="w-60 border-r border-border/60">
          <template #header>
            <div class="flex items-center gap-2.5 px-2.5">
              <DitherAvatar name="Mika Dot" :size="26" color="purple" />
              <div class="min-w-0 leading-tight">
                <div class="truncate text-[12px] text-foreground">Personal hub</div>
                <div class="truncate text-[10px] text-muted-foreground">Organize your day</div>
              </div>
            </div>
          </template>
          <DitherSidebarGroup label="Calendar">
            <div class="px-2.5">
              <div class="flex items-center justify-between text-[10px] text-muted-foreground">
                <button type="button" aria-label="Previous month" class="grid size-5 place-items-center rounded hover:bg-card hover:text-foreground">‹</button>
                <span class="tracking-[0.15em] uppercase">Jul 2026</span>
                <button type="button" aria-label="Next month" class="grid size-5 place-items-center rounded hover:bg-card hover:text-foreground">›</button>
              </div>
              <div class="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[9px] text-muted-foreground/70">
                <span v-for="d in DOW" :key="d">{{ d }}</span>
              </div>
              <div class="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-[10px] tabular-nums">
                <span
                  v-for="(day, i) in calCells"
                  :key="i"
                  class="grid h-5 place-items-center rounded-[3px]"
                  :class="day === CAL_TODAY ? 'bg-card text-foreground ring-1 ring-border' : day ? 'text-muted-foreground' : ''"
                >{{ day ?? "" }}</span>
              </div>
            </div>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Personal">
            <label
              v-for="t in personal"
              :key="t.label"
              class="flex h-7 cursor-pointer items-center rounded-md px-2.5 text-[11px] transition-colors hover:bg-card/60"
            >
              <DitherCheckbox v-model="t.done" color="purple" class="text-[11px]">
                <span :class="t.done ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'">{{ t.label }}</span>
              </DitherCheckbox>
            </label>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Work">
            <label
              v-for="t in work"
              :key="t.label"
              class="flex h-7 cursor-pointer items-center rounded-md px-2.5 text-[11px] transition-colors hover:bg-card/60"
            >
              <DitherCheckbox v-model="t.done" color="green" class="text-[11px]">
                <span :class="t.done ? 'text-muted-foreground/60 line-through' : 'text-muted-foreground'">{{ t.label }}</span>
              </DitherCheckbox>
            </label>
          </DitherSidebarGroup>
          <template #footer>
            <div class="flex items-center gap-1.5 border-t border-border/60 px-2.5 pt-2 text-[10px] text-muted-foreground">
              <span class="size-1.5 rounded-full bg-green-500/80" aria-hidden="true" />
              {{ [...personal, ...work].filter((t) => t.done).length }} of {{ personal.length + work.length }} done — synced
            </div>
          </template>
        </DitherSidebar>
        <main class="grid min-w-0 flex-1 place-items-center text-[12px] text-muted-foreground">
          Stay organized, stay focused
        </main>
      </div>
    </DemoCard>
  </section>

  <!-- Floating left -->
  <section id="sidebar-floating" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Floating left</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A detached card over the canvas — workspace switcher up top, search,
      primary rows with an inbox badge, and favorites that truncate
      gracefully. Collapses to the icon rail like any other Sidebar.
    </p>
    <DemoCard :code="SNIPPET_FLOATING">
      <div class="relative mx-auto h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60 bg-card/20">
        <div class="absolute inset-0 grid place-items-center text-[12px] text-muted-foreground" aria-hidden="true">
          Canvas
        </div>
        <DitherSidebar v-model="floatCollapsed" label="Workspace nav" variant="floating" class="relative h-[calc(100%-1rem)]">
          <template #header>
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5 text-left transition-colors hover:bg-card"
              aria-label="Switch workspace"
            >
              <DitherAvatar name="Acme Inc" :size="22" color="blue" />
              <span v-if="!floatCollapsed" class="min-w-0 flex-1 leading-tight">
                <span class="block truncate text-[11px] text-foreground">Acme Inc</span>
                <span class="block truncate text-[9px] text-muted-foreground">Enterprise</span>
              </span>
              <span v-if="!floatCollapsed" aria-hidden="true" class="text-[10px] text-muted-foreground">⇅</span>
            </button>
            <DitherInput v-if="!floatCollapsed" placeholder="Search…" class="mt-2 w-full text-[11px]" />
          </template>
          <DitherSidebarItem label="Assistant" color="purple" :active="floatActive === 'Assistant'" @select="floatActive = 'Assistant'" />
          <DitherSidebarItem label="Home" :active="floatActive === 'Home'" @select="floatActive = 'Home'" />
          <DitherSidebarItem label="Inbox" :badge="10" :active="floatActive === 'Inbox'" @select="floatActive = 'Inbox'" />
          <DitherSidebarGroup label="Favorites">
            <DitherSidebarItem
              v-for="f in FAVORITES"
              :key="f"
              :label="f"
              :active="favActive === f"
              @select="favActive = f; floatActive = ''"
            />
          </DitherSidebarGroup>
          <template #footer>
            <div class="flex items-center gap-2 border-t border-border/60 px-2 pt-2">
              <DitherAvatar name="Juno Bit" :size="22" color="green" />
              <div v-if="!floatCollapsed" class="min-w-0 leading-tight">
                <div class="truncate text-[11px] text-foreground">Juno Bit</div>
                <div class="truncate text-[10px] text-muted-foreground">juno@acme.io</div>
              </div>
            </div>
          </template>
        </DitherSidebar>
      </div>
    </DemoCard>
  </section>

  <!-- Right side -->
  <section id="sidebar-right" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Right side</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The same Sidebar flipped to the right edge — a profile header, the mini
      month, and calendar toggles with their color dots. The topbar button
      hides the whole panel when the content needs the room.
    </p>
    <DemoCard :code="SNIPPET_RIGHT">
      <div class="mx-auto flex h-96 max-w-2xl overflow-hidden rounded-lg border border-border/60">
        <main class="flex min-w-0 flex-1 flex-col">
          <div class="flex h-10 items-center justify-between border-b border-border/60 px-3">
            <span class="text-[12px] text-foreground">July 2026</span>
            <span class="rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {{ calendars.filter((c) => c.on).length }} calendars shown
            </span>
          </div>
          <div class="grid flex-1 grid-cols-7 gap-px bg-border/40 p-px" aria-hidden="true">
            <div v-for="i in 35" :key="i" class="bg-background/80" />
          </div>
        </main>
        <DitherSidebar label="Calendar panel" side="right" collapse="none" variant="inset" class="w-56 border-l border-border/60 bg-card/20">
          <template #header>
            <div class="flex items-center gap-2.5 px-2.5">
              <DitherAvatar name="Juno Bit" :size="24" color="green" />
              <div class="min-w-0 leading-tight">
                <div class="truncate text-[12px] text-foreground">Juno Bit</div>
                <div class="truncate text-[10px] text-muted-foreground">juno@dither-ui.com</div>
              </div>
            </div>
          </template>
          <DitherSidebarGroup label="Calendar">
            <div class="px-2.5">
              <div class="grid grid-cols-7 gap-0.5 text-center text-[9px] text-muted-foreground/70">
                <span v-for="d in DOW" :key="d">{{ d }}</span>
              </div>
              <div class="mt-0.5 grid grid-cols-7 gap-0.5 text-center text-[10px] tabular-nums">
                <span
                  v-for="(day, i) in calCells"
                  :key="i"
                  class="grid h-5 place-items-center rounded-[3px]"
                  :class="day === CAL_TODAY ? 'bg-card text-foreground ring-1 ring-border' : day ? 'text-muted-foreground' : ''"
                >{{ day ?? "" }}</span>
              </div>
            </div>
          </DitherSidebarGroup>
          <DitherSidebarGroup label="My calendars">
            <label
              v-for="c in calendars"
              :key="c.label"
              class="flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
            >
              <DitherCheckbox v-model="c.on" :color="c.color" class="text-[11px]">{{ c.label }}</DitherCheckbox>
              <span class="ml-auto size-1.5 rounded-full" :style="{ backgroundColor: `var(--swatch-${c.color}, currentColor)` }" aria-hidden="true" />
            </label>
          </DitherSidebarGroup>
          <template #footer>
            <button
              type="button"
              class="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              <span aria-hidden="true">+</span> New calendar
            </button>
          </template>
        </DitherSidebar>
      </div>
    </DemoCard>
  </section>
</template>
