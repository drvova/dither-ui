import { createSignal, For, Show } from "solid-js"
import {
  DitherDrawer,
  DitherSidebar,
  DitherSidebarGroup,
  DitherSidebarItem,
  DitherSwipeArea,
  DitherSwitch,
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
import ToastExample from "./examples/toast"
import toastCode from "./examples/toast.tsx?raw"
import GaugeExample from "./examples/gauge"
import gaugeCode from "./examples/gauge.tsx?raw"
import ToolbarExample from "./examples/toolbar"
import toolbarCode from "./examples/toolbar.tsx?raw"
import NavMenuExample from "./examples/nav-menu"
import navMenuCode from "./examples/nav-menu.tsx?raw"
import AccordionExample from "./examples/accordion"
import accordionCode from "./examples/accordion.tsx?raw"
import AlertDialogExample from "./examples/alert-dialog"
import alertDialogCode from "./examples/alert-dialog.tsx?raw"
import DrawerExample from "./examples/drawer"
import drawerCode from "./examples/drawer.tsx?raw"
import SidebarExample from "./examples/sidebar"
import sidebarCode from "./examples/sidebar.tsx?raw"
import MeterExample from "./examples/meter"
import meterCode from "./examples/meter.tsx?raw"
import Gauge2Example from "./examples/gauge-2"
import gauge2Code from "./examples/gauge-2.tsx?raw"
import ScopeExample from "./examples/scope"
import scopeCode from "./examples/scope.tsx?raw"
import ScrollAreaExample from "./examples/scroll-area"
import scrollAreaCode from "./examples/scroll-area.tsx?raw"

const SIDEBAR_VARIANTS = ["default", "floating", "inset", "washed"] as const

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
  const [swipeAreaOn, setSwipeAreaOn] = createSignal(false)
  const [swipeDrawer, setSwipeDrawer] = createSignal(false)

  const [variantActive, setVariantActive] = createSignal("Overview")
  const [modeActive, setModeActive] = createSignal("Overview")

  return (
    <>
      <DocSection id="accordion">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A stack of disclosure rows animated through grid-template-rows, each with the 2px dithered rail. Single type
          closes siblings on open.
        </p>
        <DemoCard code={accordionCode}>
          <AccordionExample />
        </DemoCard>
        <PropsTable rows={API.accordion} />
      </DocSection>

      <DocSection id="alert-dialog">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A modal that demands an answer: overlay clicks do nothing, Escape cancels, and focus lands on the safe Cancel
          button. Danger seeds the confirm fill red.
        </p>
        <DemoCard code={alertDialogCode}>
          <AlertDialogExample />
        </DemoCard>
        <PropsTable rows={API.alertDialog} />
      </DocSection>

      <DocSection id="drawer">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A side panel that slides in over a scrim. Escape or scrim click closes, the close button takes focus on open.
        </p>
        <DemoCard code={drawerCode}>
          <DrawerExample />
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
        <DemoCard code={sidebarCode}>
          <SidebarExample />
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
        <DemoCard code={toastCode}>
          <div class="flex justify-center gap-3">
            <ToastExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.toast} />
      </DocSection>

      <DocSection id="meter">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A static gauge on the progress track. The fill seed picks itself: green below the low mark, orange between,
          red above the high mark.
        </p>
        <DemoCard code={meterCode}>
          <MeterExample />
        </DemoCard>
        <PropsTable rows={API.meter} />
      </DocSection>

      <DocSection id="gauge">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An instrument dial. The band prints cell by cell through the threshold matrix, filled to the needle; past the
          warn mark the zone is in the warning ink. A changed value settles on the spring, and under reduced motion the
          needle simply stands on it.
        </p>
        <DemoCard code={gaugeCode}>
          <div class="mx-auto grid max-w-md gap-5">
            <GaugeExample />
          </div>
        </DemoCard>
        <p class="mt-6 text-[13px] leading-relaxed text-muted-foreground">
          Instruments that read something real: this page's frame rate, its worst frame in the last half second (past
          33ms a frame drops) and how many elements it holds, read while the panel is on screen.
        </p>
        <DemoCard code={gauge2Code}>
          <Gauge2Example />
        </DemoCard>
        <PropsTable rows={API.gauge} />
      </DocSection>

      <DocSection id="scope">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An oscilloscope screen. The beam prints through the threshold matrix, bright where it moves slowly and faint
          on its edges, and a named wave drifts with a trail of its earlier phases. Give it samples and it traces those.
          Under reduced motion, or off screen, it holds still.
        </p>
        <DemoCard code={scopeCode}>
          <ScopeExample />
        </DemoCard>
        <PropsTable rows={API.scope} />
      </DocSection>

      <DocSection id="scroll-area">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An honest overflow container: no canvas, just thin token-colored scrollbars that match the house border.
        </p>
        <DemoCard code={scrollAreaCode}>
          <ScrollAreaExample />
        </DemoCard>
        <PropsTable rows={API.scrollArea} />
      </DocSection>

      <DocSection id="toolbar">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A roving-tabindex strip: one Tab stop for the whole bar, arrow keys walk the buttons, Home and End jump to the
          edges.
        </p>
        <DemoCard code={toolbarCode}>
          <div class="flex justify-center">
            <ToolbarExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.toolbar} />
      </DocSection>

      <DocSection id="nav-menu">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          DitherTabs' sliding dithered underline with nav semantics: anchors instead of tabs, aria-current on the active
          page.
        </p>
        <DemoCard code={navMenuCode}>
          <div class="mx-auto max-w-sm">
            <NavMenuExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.navMenu} />
      </DocSection>
    </>
  )
}
