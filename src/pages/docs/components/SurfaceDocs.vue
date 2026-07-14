<script setup lang="ts">
import { ref } from "vue"
import {
  cssColor,
  DitherAccordion,
  DitherAlertDialog,
  DitherButton,
  DitherDrawer,
  DitherMeter,
  DitherNavMenu,
  DitherScrollArea,
  DitherSeparator,
  DitherSidebar,
  DitherSidebarGroup,
  DitherSidebarItem,
  DitherSidebarSub,
  DitherSwipeArea,
  DitherSwitch,
  DitherToaster,
  DitherToolbar,
  toast,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const FAQ = [
  { value: "what", title: "What is dithering?" },
  { value: "why", title: "Why canvas?" },
  { value: "copy", title: "Can I copy the kit out?" },
]
const faq = ref("what")

const alertOpen = ref(false)
const lastChoice = ref("nothing yet")

const drawerOpen = ref(false)
const gridSnap = ref(true)
const showRulers = ref(false)
const sheetOpen = ref(false)
const snapOpen = ref(false)
const snapAt = ref(0.35)
const SNAPS = [0.35, 0.75]
const sheetActions = ref(false)
const lastAction = ref("none")
const ACTIONS = ["Duplicate", "Rename", "Export PNG", "Move to group"]
const nestedOpen = ref(false)
const nestedChild = ref(false)
const swipeAreaOn = ref(false)
const swipeDrawer = ref(false)

const sidebarActive = ref("Overview")
const sidebarCollapsed = ref(false)
const sidebarSubOpen = ref(true)
const SIDEBAR_VARIANTS = ["default", "floating", "inset", "washed"] as const
const variantActive = ref("Overview")
const modeActive = ref("Overview")

const NAV_ITEMS = [
  { label: "Overview" },
  { label: "Components" },
  { label: "Pricing" },
  { label: "Docs" },
]
const navActive = ref("Overview")

const METERS = [
  { label: "Disk", value: 35 },
  { label: "Memory", value: 68 },
  { label: "CPU", value: 92 },
]

const SNIPPET_ACCORDION = `<script setup>
const faq = ref("what")
const items = [
  { value: "what", title: "What is dithering?" },
  { value: "why", title: "Why canvas?" },
  { value: "copy", title: "Can I copy the kit out?" },
]
<\/script>

<DitherAccordion v-model="faq" :items="items" type="single" color="blue">
  <template #what>
    Ordered dithering trades smooth gradients for a fixed threshold
    matrix — the same Bayer 4x4 behind every fill in this kit.
  </template>
  <template #why>
    One engine paints every fill, so components stay coherent.
  </template>
  <template #copy>
    Yes — the kit folder has zero app imports; copy it and alias it.
  </template>
</DitherAccordion>`

const SNIPPET_ALERT_DIALOG = `<script setup>
const open = ref(false)
<\/script>

<DitherButton color="red" @click="open = true">Delete artboard…</DitherButton>
<DitherAlertDialog
  :open="open"
  danger
  title="Delete artboard?"
  description="This removes the artboard and its layers. There is no undo across sessions."
  confirm-label="Delete"
  @confirm="open = false"
  @cancel="open = false"
/>`

const SNIPPET_DRAWER = `<!-- side drawers swipe-dismiss along their axis;
     bottom sheets get a handle and dismiss downward -->
<DitherDrawer :open="open" side="right" title="Settings" @close="open = false">
  …
</DitherDrawer>
<DitherDrawer :open="sheet" side="bottom" title="Notifications" @close="sheet = false" />

<!-- nesting: a child drawer pushes its parent back automatically -->
<DitherDrawer :open="account" title="Account" @close="account = false">
  <DitherDrawer :open="security" title="Security" @close="security = false" />
</DitherDrawer>

<!-- swipe-to-open from the viewport edge -->
<DitherSwipeArea side="right" @open="open = true" />

<!-- snap points: vh fractions or px; flicks can skip points -->
<DitherDrawer v-model:snap-point="snap" :open="open" side="bottom"
  :snap-points="[0.35, 0.75]" @close="open = false" />

<!-- indent: your app scales back while any drawer is open -->
<DitherDrawerIndent>
  <App />
</DitherDrawerIndent>`

const SNIPPET_SIDEBAR = `<DitherSidebar v-model="collapsed" variant="default" collapse="rail">
  <template #header>…wordmark…</template>

  <DitherSidebarGroup label="Platform">   <!-- label folds to a hairline on the rail -->
    <DitherSidebarItem label="Overview" :active="active === 'Overview'" />
    <DitherSidebarItem label="Charts" :badge="12" />  <!-- badge folds to a dot -->
  </DitherSidebarGroup>

  <DitherSidebarGroup label="Library">
    <DitherSidebarSub v-model="subOpen" label="Components">
      <DitherSidebarItem label="Buttons" />
      <DitherSidebarItem label="Forms" />
    </DitherSidebarSub>
  </DitherSidebarGroup>
</DitherSidebar>

<!-- variant: default | floating | inset | washed (dither gradient chrome)
     collapse: rail | hide | none · side: left | right
     density: default | compact · :toggle="false" = permanent rail -->`

const SNIPPET_TOAST = `<script setup>
import { DitherToaster, toast } from "@dither-kit"
<\/script>

<DitherToaster />
<DitherButton color="green" @click="toast('Saved', { color: 'green' })">
  Save
</DitherButton>
<DitherButton color="red" @click="toast('Export failed', { color: 'red' })">
  Export
</DitherButton>`

const SNIPPET_METER = `<div class="grid gap-3">
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>Disk</span><span>35%</span>
    </div>
    <DitherMeter :value="35" />
  </div>
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>Memory</span><span>68%</span>
    </div>
    <DitherMeter :value="68" />
  </div>
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>CPU</span><span>92%</span>
    </div>
    <DitherMeter :value="92" />
  </div>
</div>`

const SNIPPET_SCROLL_AREA = `<DitherScrollArea class="h-40 rounded-lg border border-border/60 p-3">
  <p v-for="i in 15" :key="i" class="py-1 text-[12px] text-muted-foreground">
    Log line {{ i }} — ordered dither keeps the texture coherent.
  </p>
</DitherScrollArea>`

const SNIPPET_TOOLBAR = `<DitherToolbar label="Formatting">
  <DitherButton class="px-2.5 py-1" aria-label="Bold">B</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Italic">I</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Underline">U</DitherButton>
  <DitherSeparator orientation="vertical" class="mx-1 h-5" />
  <DitherButton class="px-2.5 py-1" aria-label="Align left">⇤</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Align center">⇹</DitherButton>
  <DitherButton class="px-2.5 py-1" aria-label="Align right">⇥</DitherButton>
</DitherToolbar>`

const SNIPPET_NAV_MENU = `<script setup>
const active = ref("Overview")
const items = [
  { label: "Overview" },
  { label: "Components" },
  { label: "Pricing" },
  { label: "Docs" },
]
<\/script>

<DitherNavMenu v-model="active" :items="items" color="blue" />
<p class="mt-4 text-[12px] text-muted-foreground">Viewing: {{ active }}</p>`

const API: Record<string, PropRow[]> = {
  accordion: [
    { prop: "items", type: "{ value: string; title: string }[]", default: "—" },
    { prop: "modelValue", type: "string | string[]", default: "—" },
    { prop: "type", type: '"single" | "multiple"', default: '"single"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
  ],
  alertDialog: [
    { prop: "open", type: "boolean", default: "—" },
    { prop: "title", type: "string", default: "—" },
    { prop: "description", type: "string", default: "undefined" },
    { prop: "confirmLabel", type: "string", default: '"Confirm"' },
    { prop: "cancelLabel", type: "string", default: '"Cancel"' },
    { prop: "danger", type: "boolean", default: "false" },
  ],
  drawer: [
    { prop: "open", type: "boolean", default: "—" },
    { prop: "side", type: '"right" | "left" | "bottom"', default: '"right"' },
    { prop: "title", type: "string", default: "undefined" },
    { prop: "swipe", type: "boolean — drag to dismiss, momentum decides", default: "true" },
    { prop: "snap-points", type: "number[] — ≤1 vh fraction, >1 px (bottom)", default: "undefined" },
    { prop: "snap-point", type: "number — v-model:snap-point", default: "first snap" },
    { prop: "modal", type: "boolean — false: no backdrop, page stays live", default: "true" },
    { prop: "dismissible", type: "boolean — false: backdrop click ignored", default: "true" },
  ],
  sidebar: [
    { prop: "modelValue (Sidebar)", type: "boolean — collapsed (v-model)", default: "false" },
    { prop: "variant (Sidebar)", type: '"default" | "floating" | "inset" | "washed"', default: '"default"' },
    { prop: "collapse (Sidebar)", type: '"rail" | "hide" | "none"', default: '"rail"' },
    { prop: "side (Sidebar)", type: '"left" | "right"', default: '"left"' },
    { prop: "density (Sidebar)", type: '"default" | "compact"', default: '"default"' },
    { prop: "toggle (Sidebar)", type: "boolean — false: permanent rail", default: "true" },
    { prop: "wash-color (Sidebar)", type: 'PixelColor — for variant="washed"', default: '"blue"' },
    { prop: "label (Group)", type: "string — folds to a hairline on the rail", default: "undefined" },
    { prop: "label / active / color (Item)", type: "string / boolean / PixelColor", default: '— / false / "blue"' },
    { prop: "badge (Item)", type: "string | number — dot on the rail", default: "undefined" },
    { prop: "modelValue / label (Sub)", type: "boolean (v-model) / string", default: "false / —" },
  ],
  toast: [
    { prop: "message", type: "string", default: "—" },
    { prop: "opts.color", type: "PixelColor", default: '"blue"' },
    { prop: "opts.duration", type: "number", default: "3500" },
  ],
  meter: [
    { prop: "value", type: "number", default: "—" },
    { prop: "min", type: "number", default: "0" },
    { prop: "max", type: "number", default: "100" },
    { prop: "low", type: "number", default: "0.5" },
    { prop: "high", type: "number", default: "0.8" },
  ],
  scrollArea: [{ prop: "class", type: "string", default: "undefined" }],
  toolbar: [{ prop: "label", type: "string", default: "undefined" }],
  navMenu: [
    { prop: "items", type: "{ label: string; href?: string }[]", default: "—" },
    { prop: "modelValue", type: "string", default: "—" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
  ],
}
</script>

<template>
  <section id="accordion" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Accordion</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A stack of disclosure rows animated through grid-template-rows, each with
      the 2px dithered rail. Single type closes siblings on open.
    </p>
    <DemoCard :code="SNIPPET_ACCORDION">
      <div class="mx-auto max-w-sm">
        <DitherAccordion v-model="faq" :items="FAQ" type="single" color="blue">
          <template #what>
            Ordered dithering trades smooth gradients for a fixed threshold
            matrix — the same Bayer 4x4 behind every fill in this kit.
          </template>
          <template #why>
            One engine paints every fill, so components stay coherent.
          </template>
          <template #copy>
            Yes — the kit folder has zero app imports; copy it and alias it.
          </template>
        </DitherAccordion>
      </div>
    </DemoCard>
    <PropsTable :rows="API.accordion" />
  </section>

  <section id="alert-dialog" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Alert Dialog</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A modal that demands an answer — overlay clicks do nothing, Escape
      cancels, and focus lands on the safe Cancel button. Danger seeds the
      confirm fill red.
    </p>
    <DemoCard :code="SNIPPET_ALERT_DIALOG">
      <div class="flex flex-col items-center gap-4">
        <DitherButton color="red" @click="alertOpen = true">
          Delete artboard…
        </DitherButton>
        <p class="text-[12px] text-muted-foreground">Last choice: {{ lastChoice }}</p>
        <DitherAlertDialog
          :open="alertOpen"
          danger
          title="Delete artboard?"
          description="This removes the artboard and its layers. There is no undo across sessions."
          confirm-label="Delete"
          @confirm="(alertOpen = false), (lastChoice = 'confirmed')"
          @cancel="(alertOpen = false), (lastChoice = 'cancelled')"
        />
      </div>
    </DemoCard>
    <PropsTable :rows="API.alertDialog" />
  </section>

  <section id="drawer" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Drawer</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A side panel that slides in over a scrim — Escape or scrim click closes,
      the close button takes focus on open.
    </p>
    <DemoCard :code="SNIPPET_DRAWER">
      <div class="flex flex-wrap justify-center gap-3">
        <DitherButton @click="drawerOpen = true">Open settings</DitherButton>
        <DitherButton color="purple" @click="sheetOpen = true">Bottom sheet</DitherButton>
        <DitherButton color="pink" @click="snapOpen = true; snapAt = 0.35">Snap points</DitherButton>
        <DitherButton color="orange" @click="sheetActions = true">Action sheet</DitherButton>
        <DitherButton color="green" @click="nestedOpen = true">Nested</DitherButton>
        <DitherDrawer
          :open="drawerOpen"
          side="right"
          title="Settings"
          @close="drawerOpen = false"
        >
          <p class="pb-2 text-[11px] text-muted-foreground">Swipe the panel right to dismiss.</p>
          <div class="flex items-center justify-between py-2 text-[13px]">
            <span>Snap to grid</span>
            <DitherSwitch v-model="gridSnap" label="Snap to grid" color="green" />
          </div>
          <div class="flex items-center justify-between py-2 text-[13px]">
            <span>Show rulers</span>
            <DitherSwitch v-model="showRulers" label="Show rulers" />
          </div>
        </DitherDrawer>
        <DitherDrawer :open="sheetOpen" side="bottom" title="Notifications" @close="sheetOpen = false">
          <p class="text-[13px] text-muted-foreground">
            You are all caught up. Drag the handle down to dismiss — a flick
            counts through its momentum, a slow drag settles back.
          </p>
        </DitherDrawer>
        <DitherDrawer
          v-model:snap-point="snapAt"
          :open="snapOpen"
          side="bottom"
          title="Snap points"
          :snap-points="SNAPS"
          @close="snapOpen = false"
        >
          <p class="text-[13px] text-muted-foreground">
            Resting at <span class="text-foreground tabular-nums">{{ Math.round(snapAt * 100) }}vh</span>.
            Drag the handle up for the tall snap, down to the short one — a
            flick's momentum can skip straight past a point. Below half the
            smallest snap, it dismisses.
          </p>
        </DitherDrawer>
        <DitherDrawer :open="sheetActions" side="bottom" title="Artboard" @close="sheetActions = false">
          <div class="grid gap-1 pb-2">
            <button
              v-for="a in ACTIONS"
              :key="a"
              type="button"
              class="rounded-md px-3 py-2 text-left text-[13px] text-foreground/90 transition-colors hover:bg-background"
              @click="lastAction = a; sheetActions = false"
            >
              {{ a }}
            </button>
            <div class="my-1 h-px bg-border/60" />
            <button
              type="button"
              class="rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-background"
              :style="{ color: cssColor('red') }"
              @click="lastAction = 'Delete'; sheetActions = false"
            >
              Delete artboard
            </button>
          </div>
        </DitherDrawer>
        <p class="w-full text-center text-[11px] text-muted-foreground">last action: {{ lastAction }}</p>
        <DitherDrawer :open="nestedOpen" side="right" title="Account" @close="nestedOpen = false">
          <p class="pb-3 text-[13px] text-muted-foreground">
            Opening a child pushes this drawer back — scaled, dimmed, out of
            reach until the child closes.
          </p>
          <DitherButton color="green" @click="nestedChild = true">Security settings</DitherButton>
          <DitherDrawer :open="nestedChild" side="right" title="Security" @close="nestedChild = false">
            <p class="text-[13px] text-muted-foreground">
              Independently focus-managed; Escape closes just this one.
            </p>
          </DitherDrawer>
        </DitherDrawer>
      </div>
    </DemoCard>
    <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">swipe to open</h3>
    <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4">
      <p class="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
        <code class="text-foreground/80">DitherSwipeArea</code> is an invisible
        strip on the viewport edge — arm it, then swipe inward from the right
        edge of your screen to open the drawer.
      </p>
      <div class="flex items-center gap-2 text-[12px]">
        <span class="text-muted-foreground">arm edge</span>
        <DitherSwitch v-model="swipeAreaOn" label="Arm swipe area" color="purple" />
      </div>
      <DitherSwipeArea v-if="swipeAreaOn" side="right" @open="swipeDrawer = true" />
      <DitherDrawer :open="swipeDrawer" side="right" title="From the edge" @close="swipeDrawer = false">
        <p class="text-[13px] text-muted-foreground">Opened by an edge swipe.</p>
      </DitherDrawer>
    </div>
    <PropsTable :rows="API.drawer" />
  </section>

  <section id="sidebar" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Sidebar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An app sidebar that collapses to an icon rail — items keep their hit
      area, labels fold away, the active item carries a dithered rail.
    </p>
    <DemoCard :code="SNIPPET_SIDEBAR">
      <div class="mx-auto flex h-80 max-w-md overflow-hidden rounded-lg border border-border/60">
        <DitherSidebar v-model="sidebarCollapsed" label="Demo sidebar">
          <template #header>
            <div class="flex h-8 items-center gap-2 px-2.5">
              <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
              <span v-if="!sidebarCollapsed" class="text-[12px] tracking-tight">dither-ui</span>
            </div>
          </template>
          <DitherSidebarGroup label="Platform">
            <DitherSidebarItem label="Overview" :active="sidebarActive === 'Overview'" @select="sidebarActive = 'Overview'" />
            <DitherSidebarItem label="Charts" :badge="12" :active="sidebarActive === 'Charts'" @select="sidebarActive = 'Charts'" />
            <DitherSidebarItem label="Alerts" :badge="3" color="red" :active="sidebarActive === 'Alerts'" @select="sidebarActive = 'Alerts'" />
          </DitherSidebarGroup>
          <DitherSidebarGroup label="Library">
            <DitherSidebarSub v-model="sidebarSubOpen" label="Components">
              <DitherSidebarItem label="Buttons" :active="sidebarActive === 'Buttons'" @select="sidebarActive = 'Buttons'" />
              <DitherSidebarItem label="Forms" :active="sidebarActive === 'Forms'" @select="sidebarActive = 'Forms'" />
            </DitherSidebarSub>
            <DitherSidebarItem label="Palette" :active="sidebarActive === 'Palette'" @select="sidebarActive = 'Palette'" />
          </DitherSidebarGroup>
        </DitherSidebar>
        <div class="grid flex-1 place-items-center text-[12px] text-muted-foreground">
          {{ sidebarActive }}
        </div>
      </div>
    </DemoCard>
    <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
    <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div v-for="v in SIDEBAR_VARIANTS" :key="v">
        <div class="flex h-44 overflow-hidden rounded-lg border border-border/60" :class="v === 'inset' ? 'bg-card/30 p-1.5' : ''">
          <DitherSidebar :variant="v" collapse="none" :wash-color="v === 'washed' ? 'purple' : undefined" :label="`${v} sidebar`" class="w-32">
            <DitherSidebarItem
              v-for="item in ['Overview', 'Charts', 'Palette']"
              :key="item"
              :label="item"
              :color="v === 'washed' ? 'purple' : 'blue'"
              :active="variantActive === item"
              @select="variantActive = item"
            />
          </DitherSidebar>
          <div class="min-w-0 flex-1" :class="v === 'inset' ? 'm-1.5 rounded-md border border-border/60 bg-background' : ''" />
        </div>
        <div class="mt-2 text-center text-[10px] text-muted-foreground">{{ v }}</div>
      </div>
    </div>
    <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">modes</h3>
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <div class="flex h-48 overflow-hidden rounded-lg border border-border/60">
          <DitherSidebar collapse="none" density="compact" label="Compact sidebar" class="w-36">
            <DitherSidebarGroup label="Files">
              <DitherSidebarItem
                v-for="item in ['index.ts', 'palette.ts', 'pixel.ts', 'gesture.ts', 'lib.ts']"
                :key="item"
                :label="item"
                :active="modeActive === item"
                @select="modeActive = item"
              />
            </DitherSidebarGroup>
          </DitherSidebar>
          <div class="min-w-0 flex-1" />
        </div>
        <div class="mt-2 text-center text-[10px] text-muted-foreground">density="compact"</div>
      </div>
      <div>
        <div class="flex h-48 overflow-hidden rounded-lg border border-border/60">
          <DitherSidebar collapse="rail" :model-value="true" :toggle="false" label="Permanent rail">
            <DitherSidebarItem
              v-for="item in ['Overview', 'Charts', 'Alerts']"
              :key="item"
              :label="item"
              :badge="item === 'Alerts' ? 2 : undefined"
              :color="item === 'Alerts' ? 'red' : 'blue'"
              :active="modeActive === item"
              @select="modeActive = item"
            />
          </DitherSidebar>
          <div class="grid min-w-0 flex-1 place-items-center text-[11px] text-muted-foreground">{{ modeActive }}</div>
        </div>
        <div class="mt-2 text-center text-[10px] text-muted-foreground">permanent rail · :toggle="false"</div>
      </div>
    </div>
    <PropsTable :rows="API.sidebar" />
  </section>

  <section id="toast" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Toast</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A module-level toast() call feeds a teleported bottom-right stack; each
      toast carries a 3px dithered rail in its color and dismisses itself after
      its duration. API table below documents the toast() function.
    </p>
    <DemoCard :code="SNIPPET_TOAST">
      <div class="flex justify-center gap-3">
        <DitherToaster />
        <DitherButton color="green" @click="toast('Saved', { color: 'green' })">
          Save
        </DitherButton>
        <DitherButton color="red" @click="toast('Export failed', { color: 'red' })">
          Export
        </DitherButton>
      </div>
    </DemoCard>
    <PropsTable :rows="API.toast" />
  </section>

  <section id="meter" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Meter</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A static gauge on the progress track — the fill seed picks itself: green
      below the low mark, orange between, red above the high mark.
    </p>
    <DemoCard :code="SNIPPET_METER">
      <div class="mx-auto grid max-w-sm gap-3">
        <div v-for="m in METERS" :key="m.label">
          <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
            <span>{{ m.label }}</span><span>{{ m.value }}%</span>
          </div>
          <DitherMeter :value="m.value" />
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.meter" />
  </section>

  <section id="scroll-area" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Scroll Area</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An honest overflow container — no canvas, just thin token-colored
      scrollbars that match the house border.
    </p>
    <DemoCard :code="SNIPPET_SCROLL_AREA">
      <DitherScrollArea class="mx-auto h-40 max-w-sm rounded-lg border border-border/60 p-3">
        <p v-for="i in 15" :key="i" class="py-1 text-[12px] text-muted-foreground">
          Log line {{ i }} — ordered dither keeps the texture coherent.
        </p>
      </DitherScrollArea>
    </DemoCard>
    <PropsTable :rows="API.scrollArea" />
  </section>

  <section id="toolbar" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Toolbar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A roving-tabindex strip — one Tab stop for the whole bar, arrow keys walk
      the buttons, Home and End jump to the edges.
    </p>
    <DemoCard :code="SNIPPET_TOOLBAR">
      <div class="flex justify-center">
        <DitherToolbar label="Formatting">
          <DitherButton class="px-2.5 py-1" aria-label="Bold">B</DitherButton>
          <DitherButton class="px-2.5 py-1" aria-label="Italic">I</DitherButton>
          <DitherButton class="px-2.5 py-1" aria-label="Underline">U</DitherButton>
          <DitherSeparator orientation="vertical" class="mx-1 h-5" />
          <DitherButton class="px-2.5 py-1" aria-label="Align left">⇤</DitherButton>
          <DitherButton class="px-2.5 py-1" aria-label="Align center">⇹</DitherButton>
          <DitherButton class="px-2.5 py-1" aria-label="Align right">⇥</DitherButton>
        </DitherToolbar>
      </div>
    </DemoCard>
    <PropsTable :rows="API.toolbar" />
  </section>

  <section id="nav-menu" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Navigation Menu</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      DitherTabs' sliding dithered underline with nav semantics — anchors
      instead of tabs, aria-current on the active page.
    </p>
    <DemoCard :code="SNIPPET_NAV_MENU">
      <div class="mx-auto max-w-sm">
        <DitherNavMenu v-model="navActive" :items="NAV_ITEMS" color="blue" />
        <p class="mt-4 text-[12px] text-muted-foreground">Viewing: {{ navActive }}</p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.navMenu" />
  </section>
</template>
