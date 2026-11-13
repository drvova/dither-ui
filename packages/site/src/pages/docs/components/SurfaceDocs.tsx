import { createMemo, createSignal, For, Show } from "solid-js"
import { createInviewLoop } from "@dither-ui/kit/solid/runtime/in-view.ts"
import type { ScopeWave } from "@dither-ui/kit/engine/scope.ts"
import { FRAME_WINDOW, readFrames } from "@/pages/docs/components/frames"
import {
  cssColor,
  DitherAccordion,
  DitherAlertDialog,
  DitherButton,
  DitherDrawer,
  DitherGauge,
  DitherMeter,
  DitherNavMenu,
  DitherScope,
  DitherScrollArea,
  DitherSeparator,
  DitherSidebar,
  DitherSidebarGroup,
  DitherSidebarItem,
  DitherSidebarSub,
  DitherSlider,
  DitherSwipeArea,
  DitherSwitch,
  DitherToaster,
  DitherToggleGroup,
  DitherToolbar,
  toast,
} from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { type PropRow } from "../PropsTable"

const FAQ = [
  { value: "what", title: "What is dithering?" },
  { value: "why", title: "Why canvas?" },
  { value: "copy", title: "Can I copy the kit out?" },
]

const SNAPS = [0.35, 0.75]
const ACTIONS = ["Duplicate", "Rename", "Export PNG", "Move to group"]

const SIDEBAR_VARIANTS = ["default", "floating", "inset", "washed"] as const

const NAV_ITEMS = [{ label: "Overview" }, { label: "Components" }, { label: "Pricing" }, { label: "Docs" }]

const METERS = [
  { label: "Disk", value: 35 },
  { label: "Memory", value: 68 },
  { label: "CPU", value: 92 },
]

// A scope: the picked wave drifting, its afterglow from the slider.
const WAVES: { value: ScopeWave; label: string }[] = ["sine", "square", "triangle", "saw"].map((value) => ({
  value: value as ScopeWave,
  label: value,
}))

const LOG_LINES = Array.from({ length: 15 }, (_, i) => i + 1)

const SNIPPET_GAUGE = `<script setup>
const pressure = ref(62)
</script>

<div class="grid grid-cols-3 gap-4">
  <DitherGauge :value="pressure" label="kPa" />
  <DitherGauge :value="84" label="load" :warn="0.75" />
  <DitherGauge :value="1.6" :min="0" :max="4" :ticks="8" :decimals="1" label="bar" :warn="null" />
</div>
<DitherSlider v-model="pressure" label="Pressure" />`

const SNIPPET_GAUGE_LIVE = `<script setup>
// this page's frames a second and its worst frame, read every half second
const fps = ref(0)
const worst = ref(0)
let raf = 0
let stamps = []
function measure(now) {
  stamps.push(now)
  if (now - stamps[0] >= 500) {
    fps.value = Math.round(((stamps.length - 1) * 1000) / (now - stamps[0]))
    worst.value = Math.max(...stamps.slice(1).map((t, i) => t - stamps[i]))
    stamps = [now]
  }
  raf = requestAnimationFrame(measure)
}
onMounted(() => (raf = requestAnimationFrame(measure)))
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<div class="grid grid-cols-2 gap-4">
  <DitherGauge :value="fps" :max="120" :ticks="6" :warn="null" label="fps" />
  <DitherGauge :value="worst" :max="50" :decimals="1" :warn="0.66" label="worst ms" />
</div>`

const SNIPPET_ACCORDION = `<script setup>
const faq = ref("what")
const items = [
  { value: "what", title: "What is dithering?" },
  { value: "why", title: "Why canvas?" },
  { value: "copy", title: "Can I copy the kit out?" },
]
</script>

<DitherAccordion v-model="faq" :items="items" type="single" color="blue">
  <template #what>
    Ordered dithering trades smooth gradients for a fixed threshold
    matrix: the same Bayer 4x4 behind every fill in this kit.
  </template>
  <template #why>
    One engine paints every fill, so components stay coherent.
  </template>
  <template #copy>
    Yes, the kit folder has zero app imports; copy it and alias it.
  </template>
</DitherAccordion>`

const SNIPPET_ALERT_DIALOG = `<script setup>
const open = ref(false)
</script>

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

const SNIPPET_DRAWER = `const settings = ref(false)
const sheet = ref(false)
const sized = ref(false)
const snap = ref(0.35)
const account = ref(false)
const security = ref(false)

<!-- indent: what DitherDrawerIndent holds (your app) scales back while any drawer is open -->
<DitherDrawerIndent>
  <div class="flex flex-wrap gap-3">
    <DitherButton @click="settings = true">Open settings</DitherButton>
    <DitherButton color="purple" @click="sheet = true">Bottom sheet</DitherButton>
    <DitherButton color="pink" @click="sized = true">Snap points</DitherButton>
    <DitherButton color="green" @click="account = true">Nested</DitherButton>
  </div>
</DitherDrawerIndent>

<!-- side drawers swipe-dismiss along their axis;
     bottom sheets get a handle and dismiss downward -->
<DitherDrawer :open="settings" side="right" title="Settings" @close="settings = false">
  <p class="text-[13px]">Swipe the panel right to dismiss.</p>
</DitherDrawer>
<DitherDrawer :open="sheet" side="bottom" title="Notifications" @close="sheet = false">
  <p class="text-[13px]">You are all caught up.</p>
</DitherDrawer>

<!-- snap points: vh fractions or px; flicks can skip points -->
<DitherDrawer v-model:snap-point="snap" :open="sized" side="bottom" title="Snap points"
  :snap-points="[0.35, 0.75]" @close="sized = false">
  <p class="text-[13px]">Resting at {{ Math.round(snap * 100) }}vh.</p>
</DitherDrawer>

<!-- nesting: a child drawer pushes its parent back automatically -->
<DitherDrawer :open="account" side="right" title="Account" @close="account = false">
  <DitherButton @click="security = true">Security</DitherButton>
  <DitherDrawer :open="security" side="right" title="Security" @close="security = false">
    <p class="text-[13px]">Two-factor sign-in is on.</p>
  </DitherDrawer>
</DitherDrawer>

<!-- swipe-to-open from the viewport edge -->
<DitherSwipeArea side="right" @open="settings = true" />`

const SNIPPET_SIDEBAR = `const collapsed = ref(false)
const active = ref("Overview")
const components = ref(true)

<div class="flex h-80 overflow-hidden rounded-lg border">
  <DitherSidebar v-model="collapsed" variant="default" collapse="rail">
    <template #header>
      <div class="flex h-8 items-center gap-2 px-2.5 text-[12px]">
        <span class="size-2.5 shrink-0 rounded-[2px] bg-foreground" />
        <span v-if="!collapsed">dither-ui</span>
      </div>
    </template>

    <!-- a group's label folds to a hairline on the rail, a badge to a dot -->
    <DitherSidebarGroup label="Platform">
      <DitherSidebarItem label="Overview" :active="active === 'Overview'" @select="active = 'Overview'" />
      <DitherSidebarItem label="Charts" :badge="12" :active="active === 'Charts'" @select="active = 'Charts'" />
    </DitherSidebarGroup>

    <DitherSidebarGroup label="Library">
      <DitherSidebarSub v-model="components" label="Components">
        <DitherSidebarItem label="Buttons" :active="active === 'Buttons'" @select="active = 'Buttons'" />
        <DitherSidebarItem label="Forms" :active="active === 'Forms'" @select="active = 'Forms'" />
      </DitherSidebarSub>
    </DitherSidebarGroup>
  </DitherSidebar>
  <div class="grid flex-1 place-items-center text-[12px]">{{ active }}</div>
</div>

<!-- variant: default, floating, inset or washed (dither gradient chrome);
     collapse: rail, hide or none; side: left or right;
     density: default or compact; toggle={false} keeps a permanent rail -->`

const SNIPPET_TOAST = `<script setup>
import { DitherToaster, toast } from "@dither-kit"
</script>

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
    Log line {{ i }}: ordered dither keeps the texture coherent.
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
</script>

<DitherNavMenu v-model="active" :items="items" color="blue" />
<p class="mt-4 text-[12px] text-muted-foreground">Viewing: {{ active }}</p>`

const API: Record<string, PropRow[]> = {
  accordion: [
    { prop: "items", type: "{ value: string; title: string }[]", default: "" },
    { prop: "modelValue", type: "string | string[]", default: "" },
    { prop: "type", type: '"single" | "multiple"', default: '"single"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
  ],
  alertDialog: [
    { prop: "open", type: "boolean", default: "" },
    { prop: "title", type: "string", default: "" },
    { prop: "description", type: "string", default: "undefined" },
    { prop: "confirmLabel", type: "string", default: '"Confirm"' },
    { prop: "cancelLabel", type: "string", default: '"Cancel"' },
    { prop: "danger", type: "boolean", default: "false" },
  ],
  drawer: [
    { prop: "open", type: "boolean", default: "" },
    { prop: "side", type: '"right" | "left" | "bottom"', default: '"right"' },
    { prop: "title", type: "string", default: "undefined" },
    { prop: "swipe", type: "boolean: drag to dismiss, momentum decides", default: "true" },
    { prop: "snapPoints", type: "number[]: ≤1 vh fraction, >1 px (bottom)", default: "undefined" },
    { prop: "snapPoint", type: "number (with onUpdateSnapPoint)", default: "first snap" },
    { prop: "modal", type: "boolean (false: no backdrop, page stays live)", default: "true" },
    { prop: "dismissible", type: "boolean (false: backdrop click ignored)", default: "true" },
  ],
  sidebar: [
    { prop: "modelValue (Sidebar)", type: "boolean: collapsed (with onUpdateModelValue)", default: "false" },
    { prop: "variant (Sidebar)", type: '"default" | "floating" | "inset" | "washed"', default: '"default"' },
    { prop: "collapse (Sidebar)", type: '"rail" | "hide" | "none"', default: '"rail"' },
    { prop: "side (Sidebar)", type: '"left" | "right"', default: '"left"' },
    { prop: "density (Sidebar)", type: '"default" | "compact"', default: '"default"' },
    { prop: "toggle (Sidebar)", type: "boolean (false: permanent rail)", default: "true" },
    { prop: "washColor (Sidebar)", type: 'PixelColor (for variant="washed")', default: '"blue"' },
    { prop: "label (Group)", type: "string: folds to a hairline on the rail", default: "undefined" },
    { prop: "label / active / color (Item)", type: "string / boolean / PixelColor", default: 'none / false / "blue"' },
    { prop: "badge (Item)", type: "string | number: dot on the rail", default: "undefined" },
    { prop: "modelValue / label (Sub)", type: "boolean (with onUpdateModelValue) / string", default: "false / none" },
  ],
  toast: [
    { prop: "message", type: "string", default: "" },
    { prop: "opts.color", type: "PixelColor", default: '"blue"' },
    { prop: "opts.duration", type: "number", default: "3500" },
  ],
  gauge: [
    { prop: "value", type: "number", default: "" },
    { prop: "min", type: "number", default: "0" },
    { prop: "max", type: "number", default: "100" },
    { prop: "ticks", type: "number (intervals between major ticks)", default: "10" },
    { prop: "warn", type: "number | null (where the zone starts, 0..1)", default: "0.8" },
    { prop: "label", type: "string (under the reading, its accessible name)", default: "undefined" },
    { prop: "decimals", type: "number", default: "0" },
    { prop: "color", type: "PixelColor", default: '"grey"' },
    { prop: "warnColor", type: "PixelColor (the zone and the hub)", default: '"orange"' },
    { prop: "seed", type: "number", default: "undefined" },
  ],
  scope: [
    { prop: "signal", type: '"sine" | "square" | "triangle" | "saw" | number[] (samples, -1..1)', default: '"sine"' },
    { prop: "cycles", type: "number (of a named wave across the screen)", default: "2" },
    { prop: "speed", type: "number (cycles a second; 0 holds it)", default: "0.5" },
    { prop: "gain", type: "number (1 fills the screen)", default: "0.8" },
    { prop: "afterglow", type: "number (0..1, the trail of earlier phases)", default: "0.6" },
    { prop: "label", type: "string (in the corner, its accessible name)", default: "undefined" },
    { prop: "color", type: "PixelColor", default: '"green"' },
    { prop: "seed", type: "number", default: "undefined" },
  ],
  meter: [
    { prop: "value", type: "number", default: "" },
    { prop: "min", type: "number", default: "0" },
    { prop: "max", type: "number", default: "100" },
    { prop: "low", type: "number", default: "0.5" },
    { prop: "high", type: "number", default: "0.8" },
  ],
  scrollArea: [{ prop: "class", type: "string", default: "undefined" }],
  toolbar: [{ prop: "label", type: "string", default: "undefined" }],
  navMenu: [
    { prop: "items", type: "{ label: string; href?: string }[]", default: "" },
    { prop: "modelValue", type: "string", default: "" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
  ],
}

export default function SurfaceDocs() {
  const [faq, setFaq] = createSignal<string | string[]>("what")

  const [alertOpen, setAlertOpen] = createSignal(false)
  const [lastChoice, setLastChoice] = createSignal("nothing yet")

  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [gridSnap, setGridSnap] = createSignal(true)
  const [showRulers, setShowRulers] = createSignal(false)
  const [sheetOpen, setSheetOpen] = createSignal(false)
  const [snapOpen, setSnapOpen] = createSignal(false)
  const [snapAt, setSnapAt] = createSignal(0.35)
  const [sheetActions, setSheetActions] = createSignal(false)
  const [lastAction, setLastAction] = createSignal("none")
  const [nestedOpen, setNestedOpen] = createSignal(false)
  const [nestedChild, setNestedChild] = createSignal(false)
  const [swipeAreaOn, setSwipeAreaOn] = createSignal(false)
  const [swipeDrawer, setSwipeDrawer] = createSignal(false)

  const [sidebarActive, setSidebarActive] = createSignal("Overview")
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false)
  const [sidebarSubOpen, setSidebarSubOpen] = createSignal(true)
  const [variantActive, setVariantActive] = createSignal("Overview")
  const [modeActive, setModeActive] = createSignal("Overview")

  const [navActive, setNavActive] = createSignal("Overview")

  // An instrument panel: the first dial follows the slider under it.
  const [pressure, setPressure] = createSignal(62)

  const [wave, setWave] = createSignal<string>("sine")
  const waveSignal = createMemo(() => wave() as ScopeWave)
  const [glow, setGlow] = createSignal(60)

  // A live panel reading this page: its frames a second, its worst frame and
  // how many elements it holds, read every half second while it is in view.
  let live: HTMLDivElement | undefined
  const [fps, setFps] = createSignal(0)
  const [worst, setWorst] = createSignal(0)
  const [nodes, setNodes] = createSignal(0)
  let liveRaf = 0
  let stamps: number[] = []
  function measure(now: number) {
    stamps.push(now)
    if (now - stamps[0] >= FRAME_WINDOW) {
      const r = readFrames(stamps)
      setFps(r.fps)
      setWorst(r.worst)
      setNodes(document.getElementsByTagName("*").length / 1000)
      stamps = [now]
    }
    liveRaf = requestAnimationFrame(measure)
  }
  createInviewLoop(
    () => live,
    () => {
      if (!liveRaf) liveRaf = requestAnimationFrame(measure)
    },
    () => {
      cancelAnimationFrame(liveRaf)
      liveRaf = 0
      stamps = []
    },
  )

  const SNIPPET_SCOPE = createMemo(
    () => `<script setup>
const wave = ref("${wave()}")
const glow = ref(${glow()})
const waves = ["sine", "square", "triangle", "saw"].map((w) => ({ value: w, label: w }))
</script>

<DitherScope :signal="wave" :afterglow="glow / 100" label="ch1" />
<DitherToggleGroup v-model="wave" :options="waves" />
<DitherSlider v-model="glow" label="Afterglow" />`,
  )

  return (
    <>
      <section id="accordion" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Accordion</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A stack of disclosure rows animated through grid-template-rows, each with the 2px dithered rail. Single type
          closes siblings on open.
        </p>
        <DemoCard code={SNIPPET_ACCORDION}>
          <div class="mx-auto max-w-sm">
            <DitherAccordion
              modelValue={faq()}
              onUpdateModelValue={setFaq}
              items={FAQ}
              type="single"
              color="blue"
              slots={{
                what: (
                  <>
                    Ordered dithering trades smooth gradients for a fixed threshold matrix: the same Bayer 4x4 behind
                    every fill in this kit.
                  </>
                ),
                why: <>One engine paints every fill, so components stay coherent.</>,
                copy: <>Yes, the kit folder has zero app imports; copy it and alias it.</>,
              }}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.accordion} />
      </section>

      <section id="alert-dialog" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Alert dialog</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A modal that demands an answer: overlay clicks do nothing, Escape cancels, and focus lands on the safe Cancel
          button. Danger seeds the confirm fill red.
        </p>
        <DemoCard code={SNIPPET_ALERT_DIALOG}>
          <div class="flex flex-col items-center gap-4">
            <DitherButton color="red" onClick={() => setAlertOpen(true)}>
              Delete artboard…
            </DitherButton>
            <p class="text-[12px] text-muted-foreground">Last choice: {lastChoice()}</p>
            <DitherAlertDialog
              open={alertOpen()}
              danger
              title="Delete artboard?"
              description="This removes the artboard and its layers. There is no undo across sessions."
              confirmLabel="Delete"
              onConfirm={() => (setAlertOpen(false), setLastChoice("confirmed"))}
              onCancel={() => (setAlertOpen(false), setLastChoice("cancelled"))}
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.alertDialog} />
      </section>

      <section id="drawer" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Drawer</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A side panel that slides in over a scrim. Escape or scrim click closes, the close button takes focus on open.
        </p>
        <DemoCard code={SNIPPET_DRAWER}>
          <div class="flex flex-wrap justify-center gap-3">
            <DitherButton onClick={() => setDrawerOpen(true)}>Open settings</DitherButton>
            <DitherButton color="purple" onClick={() => setSheetOpen(true)}>
              Bottom sheet
            </DitherButton>
            <DitherButton
              color="pink"
              onClick={() => {
                setSnapOpen(true)
                setSnapAt(0.35)
              }}
            >
              Snap points
            </DitherButton>
            <DitherButton color="orange" onClick={() => setSheetActions(true)}>
              Action sheet
            </DitherButton>
            <DitherButton color="green" onClick={() => setNestedOpen(true)}>
              Nested
            </DitherButton>
            <DitherDrawer open={drawerOpen()} side="right" title="Settings" onClose={() => setDrawerOpen(false)}>
              <p class="pb-2 text-[11px] text-muted-foreground">Swipe the panel right to dismiss.</p>
              <div class="flex items-center justify-between py-2 text-[13px]">
                <span>Snap to grid</span>
                <DitherSwitch
                  modelValue={gridSnap()}
                  onUpdateModelValue={setGridSnap}
                  label="Snap to grid"
                  color="green"
                />
              </div>
              <div class="flex items-center justify-between py-2 text-[13px]">
                <span>Show rulers</span>
                <DitherSwitch modelValue={showRulers()} onUpdateModelValue={setShowRulers} label="Show rulers" />
              </div>
            </DitherDrawer>
            <DitherDrawer open={sheetOpen()} side="bottom" title="Notifications" onClose={() => setSheetOpen(false)}>
              <p class="text-[13px] text-muted-foreground">
                You are all caught up. Drag the handle down to dismiss: a flick counts through its momentum, a slow drag
                settles back.
              </p>
            </DitherDrawer>
            <DitherDrawer
              snapPoint={snapAt()}
              onUpdateSnapPoint={setSnapAt}
              open={snapOpen()}
              side="bottom"
              title="Snap points"
              snapPoints={SNAPS}
              onClose={() => setSnapOpen(false)}
            >
              <p class="text-[13px] text-muted-foreground">
                Resting at <span class="text-foreground tabular-nums">{Math.round(snapAt() * 100)}vh</span>. Drag the
                handle up for the tall snap, down to the short one. A flick's momentum can skip straight past a point.
                Below half the smallest snap, it dismisses.
              </p>
            </DitherDrawer>
            <DitherDrawer open={sheetActions()} side="bottom" title="Artboard" onClose={() => setSheetActions(false)}>
              <div class="grid gap-1 pb-2">
                <For each={ACTIONS}>
                  {(a) => (
                    <button
                      type="button"
                      class="rounded-md px-3 py-2 text-left text-[13px] text-foreground/90 transition-colors hover:bg-background"
                      onClick={() => {
                        setLastAction(a)
                        setSheetActions(false)
                      }}
                    >
                      {a}
                    </button>
                  )}
                </For>
                <div class="my-1 h-px bg-border/60" />
                <button
                  type="button"
                  class="rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-background"
                  style={{ color: cssColor("red") }}
                  onClick={() => {
                    setLastAction("Delete")
                    setSheetActions(false)
                  }}
                >
                  Delete artboard
                </button>
              </div>
            </DitherDrawer>
            <p class="w-full text-center text-[11px] text-muted-foreground">last action: {lastAction()}</p>
            <DitherDrawer open={nestedOpen()} side="right" title="Account" onClose={() => setNestedOpen(false)}>
              <p class="pb-3 text-[13px] text-muted-foreground">
                Opening a child pushes this drawer back: scaled, dimmed, out of reach until the child closes.
              </p>
              <DitherButton color="green" onClick={() => setNestedChild(true)}>
                Security settings
              </DitherButton>
              <DitherDrawer open={nestedChild()} side="right" title="Security" onClose={() => setNestedChild(false)}>
                <p class="text-[13px] text-muted-foreground">
                  Independently focus-managed; Escape closes just this one.
                </p>
              </DitherDrawer>
            </DitherDrawer>
          </div>
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Swipe to open</h3>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-4">
          <p class="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
            <code class="text-foreground/80">DitherSwipeArea</code> is an invisible strip on the viewport edge. Arm it,
            then swipe inward from the right edge of your screen to open the drawer.
          </p>
          <div class="flex items-center gap-2 text-[12px]">
            <span class="text-muted-foreground">arm edge</span>
            <DitherSwitch
              modelValue={swipeAreaOn()}
              onUpdateModelValue={setSwipeAreaOn}
              label="Arm swipe area"
              color="purple"
            />
          </div>
          <Show when={swipeAreaOn()}>
            <DitherSwipeArea side="right" onOpen={() => setSwipeDrawer(true)} />
          </Show>
          <DitherDrawer open={swipeDrawer()} side="right" title="From the edge" onClose={() => setSwipeDrawer(false)}>
            <p class="text-[13px] text-muted-foreground">Opened by an edge swipe.</p>
          </DitherDrawer>
        </div>
        <PropsTable rows={API.drawer} />
      </section>

      <section id="sidebar" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Sidebar</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An app sidebar that collapses to an icon rail: items keep their hit area, labels fold away, the active item
          carries a dithered rail.
        </p>
        <DemoCard code={SNIPPET_SIDEBAR}>
          <div class="mx-auto flex h-80 max-w-md overflow-hidden rounded-lg border border-border/60">
            <DitherSidebar
              modelValue={sidebarCollapsed()}
              onUpdateModelValue={setSidebarCollapsed}
              label="Demo sidebar"
              header={
                <div class="flex h-8 items-center gap-2 px-2.5">
                  <span class="inline-block size-2.5 shrink-0 rounded-[2px] bg-foreground" />
                  <Show when={!sidebarCollapsed()}>
                    <span class="text-[12px] tracking-tight">dither-ui</span>
                  </Show>
                </div>
              }
            >
              <DitherSidebarGroup label="Platform">
                <DitherSidebarItem
                  label="Overview"
                  active={sidebarActive() === "Overview"}
                  onSelect={() => setSidebarActive("Overview")}
                />
                <DitherSidebarItem
                  label="Charts"
                  badge={12}
                  active={sidebarActive() === "Charts"}
                  onSelect={() => setSidebarActive("Charts")}
                />
                <DitherSidebarItem
                  label="Alerts"
                  badge={3}
                  color="red"
                  active={sidebarActive() === "Alerts"}
                  onSelect={() => setSidebarActive("Alerts")}
                />
              </DitherSidebarGroup>
              <DitherSidebarGroup label="Library">
                <DitherSidebarSub
                  modelValue={sidebarSubOpen()}
                  onUpdateModelValue={setSidebarSubOpen}
                  label="Components"
                >
                  <DitherSidebarItem
                    label="Buttons"
                    active={sidebarActive() === "Buttons"}
                    onSelect={() => setSidebarActive("Buttons")}
                  />
                  <DitherSidebarItem
                    label="Forms"
                    active={sidebarActive() === "Forms"}
                    onSelect={() => setSidebarActive("Forms")}
                  />
                </DitherSidebarSub>
                <DitherSidebarItem
                  label="Palette"
                  active={sidebarActive() === "Palette"}
                  onSelect={() => setSidebarActive("Palette")}
                />
              </DitherSidebarGroup>
            </DitherSidebar>
            <div class="grid flex-1 place-items-center text-[12px] text-muted-foreground">{sidebarActive()}</div>
          </div>
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
        <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <For each={SIDEBAR_VARIANTS}>
            {(v) => (
              <div>
                <div
                  class={`flex h-44 overflow-hidden rounded-lg border border-border/60 ${v === "inset" ? "bg-card/30 p-1.5" : ""}`}
                >
                  <DitherSidebar
                    variant={v}
                    collapse="none"
                    washColor={v === "washed" ? "purple" : undefined}
                    label={`${v} sidebar`}
                    class="w-32"
                  >
                    <For each={["Overview", "Charts", "Palette"]}>
                      {(item) => (
                        <DitherSidebarItem
                          label={item}
                          color={v === "washed" ? "purple" : "blue"}
                          active={variantActive() === item}
                          onSelect={() => setVariantActive(item)}
                        />
                      )}
                    </For>
                  </DitherSidebar>
                  <div
                    class={`min-w-0 flex-1 ${v === "inset" ? "m-1.5 rounded-md border border-border/60 bg-background" : ""}`}
                  />
                </div>
                <div class="mt-2 text-center text-[10px] text-muted-foreground">{v}</div>
              </div>
            )}
          </For>
        </div>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Modes</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div class="flex h-48 overflow-hidden rounded-lg border border-border/60">
              <DitherSidebar collapse="none" density="compact" label="Compact sidebar" class="w-36">
                <DitherSidebarGroup label="Files">
                  <For each={["index.ts", "palette.ts", "pixel.ts", "gesture.ts", "lib.ts"]}>
                    {(item) => (
                      <DitherSidebarItem
                        label={item}
                        active={modeActive() === item}
                        onSelect={() => setModeActive(item)}
                      />
                    )}
                  </For>
                </DitherSidebarGroup>
              </DitherSidebar>
              <div class="min-w-0 flex-1" />
            </div>
            <div class="mt-2 text-center text-[10px] text-muted-foreground">density="compact"</div>
          </div>
          <div>
            <div class="flex h-48 overflow-hidden rounded-lg border border-border/60">
              <DitherSidebar collapse="rail" modelValue={true} toggle={false} label="Permanent rail">
                <For each={["Overview", "Charts", "Alerts"]}>
                  {(item) => (
                    <DitherSidebarItem
                      label={item}
                      badge={item === "Alerts" ? 2 : undefined}
                      color={item === "Alerts" ? "red" : "blue"}
                      active={modeActive() === item}
                      onSelect={() => setModeActive(item)}
                    />
                  )}
                </For>
              </DitherSidebar>
              <div class="grid min-w-0 flex-1 place-items-center text-[11px] text-muted-foreground">{modeActive()}</div>
            </div>
            <div class="mt-2 text-center text-[10px] text-muted-foreground">permanent rail (toggle={"{false}"})</div>
          </div>
        </div>
        <PropsTable rows={API.sidebar} />
      </section>

      <section id="toast" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Toast</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A module-level toast() call feeds a portalled bottom-right stack; each toast carries a 3px dithered rail in
          its color and dismisses itself after its duration. API table below documents the toast() function.
        </p>
        <DemoCard code={SNIPPET_TOAST}>
          <div class="flex justify-center gap-3">
            <DitherToaster />
            <DitherButton color="green" onClick={() => toast("Saved", { color: "green" })}>
              Save
            </DitherButton>
            <DitherButton color="red" onClick={() => toast("Export failed", { color: "red" })}>
              Export
            </DitherButton>
          </div>
        </DemoCard>
        <PropsTable rows={API.toast} />
      </section>

      <section id="meter" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Meter</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A static gauge on the progress track. The fill seed picks itself: green below the low mark, orange between,
          red above the high mark.
        </p>
        <DemoCard code={SNIPPET_METER}>
          <div class="mx-auto grid max-w-sm gap-3">
            <For each={METERS}>
              {(m) => (
                <div>
                  <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
                    <span>{m.label}</span>
                    <span>{m.value}%</span>
                  </div>
                  <DitherMeter value={m.value} />
                </div>
              )}
            </For>
          </div>
        </DemoCard>
        <PropsTable rows={API.meter} />
      </section>

      <section id="gauge" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Gauge</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An instrument dial. The band prints cell by cell through the threshold matrix, filled to the needle; past the
          warn mark the zone is in the warning ink. A changed value settles on the spring, and under reduced motion the
          needle simply stands on it.
        </p>
        <DemoCard code={SNIPPET_GAUGE}>
          <div class="mx-auto grid max-w-md gap-5">
            <div class="grid grid-cols-3 gap-4">
              <DitherGauge value={pressure()} label="kPa" />
              <DitherGauge value={84} label="load" warn={0.75} />
              <DitherGauge value={1.6} min={0} max={4} ticks={8} decimals={1} label="bar" warn={null} />
            </div>
            <DitherSlider
              modelValue={pressure()}
              onUpdateModelValue={(v) => setPressure(v as number)}
              label="Pressure"
            />
          </div>
        </DemoCard>
        <p class="mt-6 text-[13px] leading-relaxed text-muted-foreground">
          Instruments that read something real: this page's frame rate, its worst frame in the last half second (past
          33ms a frame drops) and how many elements it holds, read while the panel is on screen.
        </p>
        <DemoCard code={SNIPPET_GAUGE_LIVE}>
          <div ref={(el) => (live = el)} class="mx-auto grid max-w-md grid-cols-3 gap-4">
            <DitherGauge value={fps()} max={120} ticks={6} warn={null} label="fps" />
            <DitherGauge value={worst()} max={50} decimals={1} warn={0.66} label="worst ms" />
            <DitherGauge value={nodes()} max={20} decimals={1} label="k elements" />
          </div>
        </DemoCard>
        <PropsTable rows={API.gauge} />
      </section>

      <section id="scope" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Scope</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An oscilloscope screen. The beam prints through the threshold matrix, bright where it moves slowly and faint
          on its edges, and a named wave drifts with a trail of its earlier phases. Give it samples and it traces those.
          Under reduced motion, or off screen, it holds still.
        </p>
        <DemoCard code={SNIPPET_SCOPE()}>
          <div class="mx-auto grid max-w-md gap-5">
            <DitherScope signal={waveSignal()} afterglow={glow() / 100} label="ch1" />
            <div role="group" aria-label="Wave" class="flex justify-center">
              <DitherToggleGroup modelValue={wave()} onUpdateModelValue={(v) => setWave(v as string)} options={WAVES} />
            </div>
            <DitherSlider modelValue={glow()} onUpdateModelValue={(v) => setGlow(v as number)} label="Afterglow" />
          </div>
        </DemoCard>
        <PropsTable rows={API.scope} />
      </section>

      <section id="scroll-area" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Scroll area</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An honest overflow container: no canvas, just thin token-colored scrollbars that match the house border.
        </p>
        <DemoCard code={SNIPPET_SCROLL_AREA}>
          <DitherScrollArea class="mx-auto h-40 max-w-sm rounded-lg border border-border/60 p-3">
            <For each={LOG_LINES}>
              {(i) => (
                <p class="py-1 text-[12px] text-muted-foreground">
                  Log line {i}: ordered dither keeps the texture coherent.
                </p>
              )}
            </For>
          </DitherScrollArea>
        </DemoCard>
        <PropsTable rows={API.scrollArea} />
      </section>

      <section id="toolbar" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Toolbar</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A roving-tabindex strip: one Tab stop for the whole bar, arrow keys walk the buttons, Home and End jump to the
          edges.
        </p>
        <DemoCard code={SNIPPET_TOOLBAR}>
          <div class="flex justify-center">
            <DitherToolbar label="Formatting">
              <DitherButton class="px-2.5 py-1" aria-label="Bold">
                B
              </DitherButton>
              <DitherButton class="px-2.5 py-1" aria-label="Italic">
                I
              </DitherButton>
              <DitherButton class="px-2.5 py-1" aria-label="Underline">
                U
              </DitherButton>
              <DitherSeparator orientation="vertical" class="mx-1 h-5" />
              <DitherButton class="px-2.5 py-1" aria-label="Align left">
                ⇤
              </DitherButton>
              <DitherButton class="px-2.5 py-1" aria-label="Align center">
                ⇹
              </DitherButton>
              <DitherButton class="px-2.5 py-1" aria-label="Align right">
                ⇥
              </DitherButton>
            </DitherToolbar>
          </div>
        </DemoCard>
        <PropsTable rows={API.toolbar} />
      </section>

      <section id="nav-menu" class="mt-16 scroll-mt-24">
        <h2 class="text-lg tracking-tight">Navigation menu</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          DitherTabs' sliding dithered underline with nav semantics: anchors instead of tabs, aria-current on the active
          page.
        </p>
        <DemoCard code={SNIPPET_NAV_MENU}>
          <div class="mx-auto max-w-sm">
            <DitherNavMenu modelValue={navActive()} onUpdateModelValue={setNavActive} items={NAV_ITEMS} color="blue" />
            <p class="mt-4 text-[12px] text-muted-foreground">Viewing: {navActive()}</p>
          </div>
        </DemoCard>
        <PropsTable rows={API.navMenu} />
      </section>
    </>
  )
}
