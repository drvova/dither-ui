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
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import accordionProps from "virtual:dither-props/DitherAccordion"
import alertDialogProps from "virtual:dither-props/DitherAlertDialog"
import drawerProps from "virtual:dither-props/DitherDrawer"
import sidebarProps from "virtual:dither-props/DitherSidebar"
import sidebarGroupProps from "virtual:dither-props/DitherSidebarGroup"
import sidebarItemProps from "virtual:dither-props/DitherSidebarItem"
import sidebarSubProps from "virtual:dither-props/DitherSidebarSub"
import gaugeProps from "virtual:dither-props/DitherGauge"
import scopeProps from "virtual:dither-props/DitherScope"
import meterProps from "virtual:dither-props/DitherMeter"
import scrollAreaProps from "virtual:dither-props/DitherScrollArea"
import toolbarProps from "virtual:dither-props/DitherToolbar"
import navMenuProps from "virtual:dither-props/DitherNavMenu"
import DocSection from "../DocSection"

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

const SNIPPET_GAUGE = `const [pressure, setPressure] = createSignal(62)

<div class="grid grid-cols-3 gap-4">
  <DitherGauge value={pressure()} label="kPa" />
  <DitherGauge value={84} label="load" warn={0.75} />
  <DitherGauge value={1.6} min={0} max={4} ticks={8} decimals={1} label="bar" warn={null} />
</div>
<DitherSlider modelValue={pressure()} onUpdateModelValue={setPressure} label="Pressure" />`

const SNIPPET_GAUGE_LIVE = `// this page's frames a second and its worst frame, read every half second
const [fps, setFps] = createSignal(0)
const [worst, setWorst] = createSignal(0)
let raf = 0
let stamps = []
function measure(now) {
  stamps.push(now)
  if (now - stamps[0] >= 500) {
    setFps(Math.round(((stamps.length - 1) * 1000) / (now - stamps[0])))
    setWorst(Math.max(...stamps.slice(1).map((t, i) => t - stamps[i])))
    stamps = [now]
  }
  raf = requestAnimationFrame(measure)
}
onMount(() => (raf = requestAnimationFrame(measure)))
onCleanup(() => cancelAnimationFrame(raf))

<div class="grid grid-cols-2 gap-4">
  <DitherGauge value={fps()} max={120} ticks={6} warn={null} label="fps" />
  <DitherGauge value={worst()} max={50} decimals={1} warn={0.66} label="worst ms" />
</div>`

const SNIPPET_ACCORDION = `const [faq, setFaq] = createSignal("what")
const items = [
  { value: "what", title: "What is dithering?" },
  { value: "why", title: "Why canvas?" },
  { value: "copy", title: "Can I copy the kit out?" },
]

<DitherAccordion modelValue={faq()} onUpdateModelValue={setFaq} items={items} type="single" color="blue"
  what={
    <>
      Ordered dithering trades smooth gradients for a fixed threshold
      matrix: the same Bayer 4x4 behind every fill in this kit.
    </>
  }
  why="One engine paints every fill, so components stay coherent."
  copy="Yes, the kit folder has zero app imports; copy it and alias it."
/>`

const SNIPPET_ALERT_DIALOG = `const [open, setOpen] = createSignal(false)

<DitherButton color="red" onClick={() => setOpen(true)}>Delete artboard…</DitherButton>
<DitherAlertDialog
  open={open()}
  danger
  title="Delete artboard?"
  description="This removes the artboard and its layers. There is no undo across sessions."
  confirmLabel="Delete"
  onConfirm={() => setOpen(false)}
  onCancel={() => setOpen(false)}
/>`

const SNIPPET_DRAWER = `const [settings, setSettings] = createSignal(false)
const [sheet, setSheet] = createSignal(false)
const [sized, setSized] = createSignal(false)
const [snap, setSnap] = createSignal(0.35)
const [account, setAccount] = createSignal(false)
const [security, setSecurity] = createSignal(false)

{/* indent: what DitherDrawerIndent holds (your app) scales back while any drawer is open */}
<DitherDrawerIndent>
  <div class="flex flex-wrap gap-3">
    <DitherButton onClick={() => setSettings(true)}>Open settings</DitherButton>
    <DitherButton color="purple" onClick={() => setSheet(true)}>Bottom sheet</DitherButton>
    <DitherButton color="pink" onClick={() => setSized(true)}>Snap points</DitherButton>
    <DitherButton color="green" onClick={() => setAccount(true)}>Nested</DitherButton>
  </div>
</DitherDrawerIndent>

{/* side drawers swipe-dismiss along their axis;
     bottom sheets get a handle and dismiss downward */}
<DitherDrawer open={settings()} side="right" title="Settings" onClose={() => setSettings(false)}>
  <p class="text-[13px]">Swipe the panel right to dismiss.</p>
</DitherDrawer>
<DitherDrawer open={sheet()} side="bottom" title="Notifications" onClose={() => setSheet(false)}>
  <p class="text-[13px]">You are all caught up.</p>
</DitherDrawer>

{/* snap points: vh fractions or px; flicks can skip points */}
<DitherDrawer snapPoint={snap()} onUpdateSnapPoint={setSnap} open={sized()} side="bottom" title="Snap points"
  snapPoints={[0.35, 0.75]} onClose={() => setSized(false)}>
  <p class="text-[13px]">Resting at {Math.round(snap() * 100)}vh.</p>
</DitherDrawer>

{/* nesting: a child drawer pushes its parent back automatically */}
<DitherDrawer open={account()} side="right" title="Account" onClose={() => setAccount(false)}>
  <DitherButton onClick={() => setSecurity(true)}>Security</DitherButton>
  <DitherDrawer open={security()} side="right" title="Security" onClose={() => setSecurity(false)}>
    <p class="text-[13px]">Two-factor sign-in is on.</p>
  </DitherDrawer>
</DitherDrawer>

{/* swipe-to-open from the viewport edge */}
<DitherSwipeArea side="right" onOpen={() => setSettings(true)} />`

const SNIPPET_SIDEBAR = `const [collapsed, setCollapsed] = createSignal(false)
const [active, setActive] = createSignal("Overview")
const [components, setComponents] = createSignal(true)

<div class="flex h-80 overflow-hidden rounded-lg border">
  <DitherSidebar modelValue={collapsed()} onUpdateModelValue={setCollapsed} variant="default" collapse="rail"
    header={
      <div class="flex h-8 items-center gap-2 px-2.5 text-[12px]">
        <span class="size-2.5 shrink-0 rounded-[2px] bg-foreground" />
        <Show when={!collapsed()}><span>dither-ui</span></Show>
      </div>
    }
  >

    {/* a group's label folds to a hairline on the rail, a badge to a dot */}
    <DitherSidebarGroup label="Platform">
      <DitherSidebarItem label="Overview" active={active() === 'Overview'} onSelect={() => setActive('Overview')} />
      <DitherSidebarItem label="Charts" badge={12} active={active() === 'Charts'} onSelect={() => setActive('Charts')} />
    </DitherSidebarGroup>

    <DitherSidebarGroup label="Library">
      <DitherSidebarSub modelValue={components()} onUpdateModelValue={setComponents} label="Components">
        <DitherSidebarItem label="Buttons" active={active() === 'Buttons'} onSelect={() => setActive('Buttons')} />
        <DitherSidebarItem label="Forms" active={active() === 'Forms'} onSelect={() => setActive('Forms')} />
      </DitherSidebarSub>
    </DitherSidebarGroup>
  </DitherSidebar>
  <div class="grid flex-1 place-items-center text-[12px]">{active()}</div>
</div>

{/* variant: default, floating, inset or washed (dither gradient chrome);
     collapse: rail, hide or none; side: left or right;
     density: default or compact; toggle={false} keeps a permanent rail */}`

const SNIPPET_TOAST = `import { DitherToaster, toast } from "@dither-kit"

<DitherToaster />
<DitherButton color="green" onClick={() => toast('Saved', { color: 'green' })}>
  Save
</DitherButton>
<DitherButton color="red" onClick={() => toast('Export failed', { color: 'red' })}>
  Export
</DitherButton>`

const SNIPPET_METER = `<div class="grid gap-3">
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>Disk</span><span>35%</span>
    </div>
    <DitherMeter value={35} />
  </div>
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>Memory</span><span>68%</span>
    </div>
    <DitherMeter value={68} />
  </div>
  <div>
    <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
      <span>CPU</span><span>92%</span>
    </div>
    <DitherMeter value={92} />
  </div>
</div>`

const SNIPPET_SCROLL_AREA = `<DitherScrollArea class="h-40 rounded-lg border border-border/60 p-3">
  <For each={Array.from({ length: 15 }, (_, k) => k + 1)}>
    {(i) => (
      <p class="py-1 text-[12px] text-muted-foreground">
        Log line {i}: ordered dither keeps the texture coherent.
      </p>
    )}
  </For>
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

const SNIPPET_NAV_MENU = `const [active, setActive] = createSignal("Overview")
const items = [
  { label: "Overview" },
  { label: "Components" },
  { label: "Pricing" },
  { label: "Docs" },
]

<DitherNavMenu modelValue={active()} onUpdateModelValue={setActive} items={items} color="blue" />
<p class="mt-4 text-[12px] text-muted-foreground">Viewing: {active()}</p>`

export const API: Record<string, PropRow[]> = {
  accordion: kitTable(accordionProps),
  alertDialog: kitTable(alertDialogProps),
  drawer: kitTable(drawerProps),
  sidebar: [
    ...kitTable(sidebarProps, { part: "Sidebar" }),
    ...kitTable(sidebarGroupProps, { part: "Group" }),
    ...kitTable(sidebarItemProps, { part: "Item", join: [["label", "active", "color"]] }),
    ...kitTable(sidebarSubProps, { part: "Sub", join: [["modelValue", "label"]] }),
  ],
  toast: [
    { prop: "message", type: "string", default: "" },
    { prop: "opts.color", type: "PixelColor", default: '"blue"' },
    { prop: "opts.duration", type: "number", default: "3500" },
  ],
  gauge: kitTable(gaugeProps),
  scope: kitTable(scopeProps),
  meter: kitTable(meterProps),
  scrollArea: kitTable(scrollAreaProps),
  toolbar: kitTable(toolbarProps),
  navMenu: kitTable(navMenuProps),
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
    () => `const [wave, setWave] = createSignal("${wave()}")
const [glow, setGlow] = createSignal(${glow()})
const waves = ["sine", "square", "triangle", "saw"].map((w) => ({ value: w, label: w }))

<DitherScope signal={wave()} afterglow={glow() / 100} label="ch1" />
<DitherToggleGroup modelValue={wave()} onUpdateModelValue={setWave} options={waves} />
<DitherSlider modelValue={glow()} onUpdateModelValue={setGlow} label="Afterglow" />`,
  )

  return (
    <>
      <DocSection id="accordion">
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
      </DocSection>

      <DocSection id="alert-dialog">
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
      </DocSection>

      <DocSection id="drawer">
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
      </DocSection>

      <DocSection id="sidebar">
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
      </DocSection>

      <DocSection id="toast">
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
      </DocSection>

      <DocSection id="meter">
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
      </DocSection>

      <DocSection id="gauge">
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
      </DocSection>

      <DocSection id="scope">
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
      </DocSection>

      <DocSection id="scroll-area">
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
      </DocSection>

      <DocSection id="toolbar">
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
      </DocSection>

      <DocSection id="nav-menu">
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
      </DocSection>
    </>
  )
}
