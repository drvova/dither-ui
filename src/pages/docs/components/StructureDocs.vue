<script setup lang="ts">
import { ref } from "vue"
import {
  DitherButton,
  DitherCenterMorphModal,
  DitherCollapsible,
  DitherDialog,
  DitherKbd,
  DitherTabPanel,
  DitherTabs,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const TABS = ["Overview", "Metrics", "Logs"]
const tab = ref("Overview")
const PANEL: Record<string, string> = {
  Overview: "Requests are steady; nothing on fire.",
  Metrics: "p95 latency 42ms, error rate 0.02%.",
  Logs: "3 warnings in the last hour, zero errors.",
}
const TAB_VARIANTS = ["underline", "segmented", "washed"] as const
const variantTab = ref("Overview")
const vertTab = ref("Inbox")
const VERT_TABS = [
  { value: "Inbox", badge: 12 },
  { value: "Drafts", badge: 2 },
  { value: "Archive" },
  { value: "Spam", disabled: true },
]

const openA = ref(true)
const openB = ref(false)

const dialogOpen = ref(false)
const morphOpen = ref(false)

const SNIPPET_TABS = `<!-- panels nest inside so they inherit the tab context -->
<DitherTabs v-model="tab" :tabs="['Overview', 'Metrics', 'Logs']">
  <DitherTabPanel value="Overview" class="mt-4">…</DitherTabPanel>
  <DitherTabPanel value="Metrics" class="mt-4">…</DitherTabPanel>
  <DitherTabPanel value="Logs" class="mt-4">…</DitherTabPanel>
</DitherTabs>

<!-- variant: underline | segmented | washed -->
<DitherTabs v-model="tab" :tabs="tabs" variant="segmented" />

<!-- objects add badges and disabled; vertical flips the rail -->
<DitherTabs v-model="folder" orientation="vertical" variant="washed"
  :tabs="[{ value: 'Inbox', badge: 12 }, { value: 'Spam', disabled: true }]" />`

const SNIPPET_COLLAPSIBLE = `<script setup>
const openA = ref(true)
const openB = ref(false)
<\/script>

<DitherCollapsible v-model="openA" title="What is dithering?" color="blue">
  Ordered dithering trades smooth gradients for a fixed threshold
  matrix — the same Bayer 4x4 behind every fill in this kit.
</DitherCollapsible>
<DitherCollapsible v-model="openB" title="Why canvas?" color="purple">
  One engine paints every fill, so components stay coherent.
</DitherCollapsible>`

const SNIPPET_DIALOG = `<script setup>
const open = ref(false)
<\/script>

<DitherButton @click="open = true">Open dialog</DitherButton>
<DitherDialog :open="open" title="Confirm"
  description="Ship the dithered build to production?" @close="open = false">
  <p class="text-[13px] text-muted-foreground">Review the release before continuing.</p>
  <template #footer>
    <DitherButton color="green" @click="open = false">Confirm</DitherButton>
  </template>
</DitherDialog>`

const SNIPPET_MORPH = `<script setup>
const open = ref(false)
<\/script>

<DitherButton @click="open = true">Open modal</DitherButton>
<DitherCenterMorphModal :open="open" label="Release notes" @close="open = false">
  <div class="flex h-full flex-col justify-end gap-2">
    <h3 class="text-sm font-medium text-foreground">v2.4 — dithered everything</h3>
    <p class="max-w-md text-[13px] leading-relaxed text-muted-foreground">
      This full-size surface unfolded from its exact center. Press Escape,
      the backdrop, or the inset control to fold it back.
    </p>
  </div>
</DitherCenterMorphModal>`

const SNIPPET_KBD = `<div class="flex items-center gap-6 text-xs">
  <div class="flex items-center gap-2">
    <span class="text-muted-foreground">Command menu</span>
    <DitherKbd>⌘</DitherKbd>
    <DitherKbd>K</DitherKbd>
  </div>
  <div class="flex items-center gap-2">
    <span class="text-muted-foreground">Shortcuts</span>
    <DitherKbd>?</DitherKbd>
  </div>
</div>`

const API: Record<string, PropRow[]> = {
  tabs: [
    { prop: "tabs", type: "(string | { value, label?, badge?, disabled? })[]", default: "—" },
    { prop: "modelValue", type: "string", default: "—" },
    { prop: "variant", type: '"underline" | "segmented" | "washed"', default: '"underline"' },
    { prop: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"' },
    { prop: "color", type: "PixelColor", default: '"blue"' },
    { prop: "value (TabPanel)", type: "string — nests inside DitherTabs", default: "—" },
  ],
  collapsible: [
    { prop: "title", type: "string", default: "—" },
    { prop: "modelValue", type: "boolean", default: "false" },
    { prop: "color", type: "PixelColor", default: '"blue"' },
  ],
  dialog: [
    { prop: "open", type: "boolean", default: "—" },
    { prop: "title", type: "string", default: "undefined" },
    { prop: "description", type: "string", default: "undefined" },
    { prop: "closeOnBackdrop", type: "boolean", default: "true" },
    { prop: "class", type: "string", default: "—" },
  ],
  centerMorphModal: [
    { prop: "open", type: "boolean", default: "—" },
    { prop: "label", type: "string — accessible name", default: '"Modal"' },
    { prop: "closeOnBackdrop", type: "boolean", default: "true" },
    { prop: "class", type: "string", default: "—" },
  ],
  kbd: [{ prop: "class", type: "string", default: "undefined" }],
}
</script>

<template>
  <section id="tabs" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Tabs</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A roving-tabindex tablist with a dithered underline that slides to the
      active tab. Arrow keys move selection.
    </p>
    <DemoCard :code="SNIPPET_TABS">
      <div class="mx-auto max-w-sm">
        <DitherTabs v-model="tab" :tabs="TABS" color="blue">
          <DitherTabPanel v-for="t in TABS" :key="t" :value="t" class="mt-4">
            <p class="text-[12px] text-muted-foreground">{{ PANEL[t] }}</p>
          </DitherTabPanel>
        </DitherTabs>
      </div>
    </DemoCard>
    <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">variants</h3>
    <div class="mt-4 grid gap-5 sm:grid-cols-3">
      <div v-for="v in TAB_VARIANTS" :key="v">
        <div class="flex h-16 items-start justify-center rounded-lg border border-border/60 p-3">
          <DitherTabs v-model="variantTab" :tabs="TABS" :variant="v" color="purple" />
        </div>
        <div class="mt-2 text-center text-[10px] text-muted-foreground">{{ v }}</div>
      </div>
    </div>
    <h3 class="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">vertical · badges · disabled</h3>
    <div class="mt-4 rounded-lg border border-border/60 p-4">
      <DitherTabs v-model="vertTab" :tabs="VERT_TABS" orientation="vertical" variant="washed" color="green" class="mx-auto max-w-sm">
        <DitherTabPanel v-for="t in VERT_TABS" :key="t.value" :value="t.value" class="min-w-0 flex-1 self-stretch rounded-md border border-border/40 p-3">
          <p class="text-[12px] text-muted-foreground">{{ t.value }} — {{ t.badge ?? 0 }} items.</p>
        </DitherTabPanel>
      </DitherTabs>
    </div>
    <PropsTable :rows="API.tabs" />
  </section>

  <section id="collapsible" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Collapsible</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A disclosure row animated through grid-template-rows; when open, a 2px
      dithered rail runs down the left edge of the content.
    </p>
    <DemoCard :code="SNIPPET_COLLAPSIBLE">
      <div class="mx-auto max-w-sm divide-y divide-border/60">
        <DitherCollapsible v-model="openA" title="What is dithering?" color="blue">
          Ordered dithering trades smooth gradients for a fixed threshold
          matrix — the same Bayer 4x4 behind every fill in this kit.
        </DitherCollapsible>
        <DitherCollapsible v-model="openB" title="Why canvas?" color="purple">
          One engine paints every fill, so components stay coherent.
        </DitherCollapsible>
      </div>
    </DemoCard>
    <PropsTable :rows="API.collapsible" />
  </section>

  <section id="dialog" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Dialog</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A teleported modal with labelled title and description, trapped focus,
      Escape/backdrop dismissal, focus restoration, and an optional action footer.
    </p>
    <DemoCard :code="SNIPPET_DIALOG">
      <div class="flex justify-center">
        <DitherButton @click="dialogOpen = true">Open dialog</DitherButton>
        <DitherDialog :open="dialogOpen" title="Confirm" description="Ship the dithered build to production?" @close="dialogOpen = false">
          <p class="text-[13px] leading-relaxed text-muted-foreground">Review the release before continuing.</p>
          <template #footer>
            <DitherButton color="green" @click="dialogOpen = false">Confirm</DitherButton>
          </template>
        </DitherDialog>
      </div>
    </DemoCard>
    <PropsTable :rows="API.dialog" />
  </section>

  <section id="center-morph-modal" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Center Morph Modal</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A composable modal whose full-size surface unfolds from its exact center
      toward every edge, then folds back the same way with an inset close
      control. Same focus trap, Escape, and backdrop contract as Dialog.
    </p>
    <DemoCard :code="SNIPPET_MORPH">
      <div class="flex justify-center">
        <DitherButton @click="morphOpen = true">Open modal</DitherButton>
        <DitherCenterMorphModal :open="morphOpen" label="Release notes" @close="morphOpen = false">
          <div class="flex h-full flex-col justify-end gap-2">
            <h3 class="text-sm font-medium text-foreground">v2.4 — dithered everything</h3>
            <p class="max-w-md text-[13px] leading-relaxed text-muted-foreground">
              This full-size surface unfolded from its exact center. Press Escape,
              the backdrop, or the inset control to fold it back.
            </p>
          </div>
        </DitherCenterMorphModal>
      </div>
    </DemoCard>
    <PropsTable :rows="API.centerMorphModal" />
  </section>

  <section id="kbd" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Kbd</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An honest keyboard key — no canvas, just the house border and a 2px
      bottom edge. Pairs with shortcut listings.
    </p>
    <DemoCard :code="SNIPPET_KBD">
      <div class="flex items-center justify-center gap-6 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">Command menu</span>
          <span class="flex items-center gap-1">
            <DitherKbd>⌘</DitherKbd>
            <DitherKbd>K</DitherKbd>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">Shortcuts</span>
          <DitherKbd>?</DitherKbd>
        </div>
      </div>
    </DemoCard>
    <PropsTable :rows="API.kbd" />
  </section>
</template>
