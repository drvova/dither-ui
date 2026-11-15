import { createSignal, For } from "solid-js"
import { DitherTabPanel, DitherTabs } from "@dither-ui/kit"
import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import tabsProps from "virtual:dither-props/DitherTabs"
import tabPanelProps from "virtual:dither-props/DitherTabPanel"
import collapsibleProps from "virtual:dither-props/DitherCollapsible"
import dialogProps from "virtual:dither-props/DitherDialog"
import centerMorphModalProps from "virtual:dither-props/DitherCenterMorphModal"
import kbdProps from "virtual:dither-props/DitherKbd"
import DocSection from "../DocSection"
import CollapsibleExample from "./examples/collapsible"
import collapsibleCode from "./examples/collapsible.tsx?raw"
import DialogExample from "./examples/dialog"
import dialogCode from "./examples/dialog.tsx?raw"
import CenterMorphModalExample from "./examples/center-morph-modal"
import centerMorphModalCode from "./examples/center-morph-modal.tsx?raw"
import TabsExample from "./examples/tabs"
import tabsCode from "./examples/tabs.tsx?raw"
import KbdExample from "./examples/kbd"
import kbdCode from "./examples/kbd.tsx?raw"

const TABS = ["Overview", "Metrics", "Logs"]
const TAB_VARIANTS = ["underline", "segmented", "washed"] as const
const VERT_TABS = [
  { value: "Inbox", badge: 12 },
  { value: "Drafts", badge: 2 },
  { value: "Archive" },
  { value: "Spam", disabled: true },
]

export const API: Record<string, PropRow[]> = {
  tabs: [...kitTable(tabsProps), ...kitTable(tabPanelProps, { part: "TabPanel" })],
  collapsible: kitTable(collapsibleProps),
  dialog: kitTable(dialogProps),
  centerMorphModal: kitTable(centerMorphModalProps),
  kbd: kitTable(kbdProps),
}

export default function StructureDocs() {
  const [variantTab, setVariantTab] = createSignal("Overview")
  const [vertTab, setVertTab] = createSignal("Inbox")

  return (
    <>
      <DocSection id="tabs">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A roving-tabindex tablist with a dithered underline that slides to the active tab. Arrow keys move selection.
        </p>
        <DemoCard code={tabsCode}>
          <TabsExample />
        </DemoCard>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Variants</h3>
        <div class="mt-4 grid gap-5 sm:grid-cols-3">
          <For each={TAB_VARIANTS}>
            {(v) => (
              <div>
                <div class="flex h-16 items-start justify-center rounded-lg border border-border/60 p-3">
                  <DitherTabs
                    modelValue={variantTab()}
                    onUpdateModelValue={setVariantTab}
                    tabs={TABS}
                    variant={v}
                    color="purple"
                  />
                </div>
                <div class="mt-2 text-center text-[10px] text-muted-foreground">{v}</div>
              </div>
            )}
          </For>
        </div>
        <h3 class="mt-8 text-[12px] text-muted-foreground">Vertical, badges and disabled</h3>
        <div class="mt-4 rounded-lg border border-border/60 p-4">
          <DitherTabs
            modelValue={vertTab()}
            onUpdateModelValue={setVertTab}
            tabs={VERT_TABS}
            orientation="vertical"
            variant="washed"
            color="green"
            class="mx-auto max-w-sm"
          >
            <For each={VERT_TABS}>
              {(t) => (
                <DitherTabPanel
                  value={t.value}
                  class="min-w-0 flex-1 self-stretch rounded-md border border-border/40 p-3"
                >
                  <p class="text-[12px] text-muted-foreground">
                    {t.value}: {t.badge ?? 0} items.
                  </p>
                </DitherTabPanel>
              )}
            </For>
          </DitherTabs>
        </div>
        <PropsTable rows={API.tabs} />
      </DocSection>

      <DocSection id="collapsible">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A disclosure row animated through grid-template-rows; when open, a 2px dithered rail runs down the left edge
          of the content.
        </p>
        <DemoCard code={collapsibleCode}>
          <div class="mx-auto max-w-sm divide-y divide-border/60">
            <CollapsibleExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.collapsible} />
      </DocSection>

      <DocSection id="dialog">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A portalled modal with labelled title and description, trapped focus, Escape/backdrop dismissal, focus
          restoration, and an optional action footer.
        </p>
        <DemoCard code={dialogCode}>
          <div class="flex justify-center">
            <DialogExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.dialog} />
      </DocSection>

      <DocSection id="center-morph-modal">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A composable modal whose full-size surface unfolds from its exact center toward every edge, then folds back
          the same way with an inset close control. Same focus trap, Escape, and backdrop contract as Dialog.
        </p>
        <DemoCard code={centerMorphModalCode}>
          <div class="flex justify-center">
            <CenterMorphModalExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.centerMorphModal} />
      </DocSection>

      <DocSection id="kbd">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          An honest keyboard key: no canvas, just the house border and a 2px bottom edge. Pairs with shortcut listings.
        </p>
        <DemoCard code={kbdCode}>
          <KbdExample />
        </DemoCard>
        <PropsTable rows={API.kbd} />
      </DocSection>
    </>
  )
}
