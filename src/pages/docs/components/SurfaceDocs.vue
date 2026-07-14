<script setup lang="ts">
import { ref } from "vue"
import {
  DitherAccordion,
  DitherAlertDialog,
  DitherButton,
  DitherDrawer,
  DitherMeter,
  DitherNavMenu,
  DitherScrollArea,
  DitherSeparator,
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

const SNIPPET_DRAWER = `<script setup>
const open = ref(false)
const gridSnap = ref(true)
const showRulers = ref(false)
<\/script>

<DitherButton @click="open = true">Open settings</DitherButton>
<DitherDrawer :open="open" side="right" title="Settings" @close="open = false">
  <div class="flex items-center justify-between py-2 text-[13px]">
    <span>Snap to grid</span>
    <DitherSwitch v-model="gridSnap" color="green" />
  </div>
  <div class="flex items-center justify-between py-2 text-[13px]">
    <span>Show rulers</span>
    <DitherSwitch v-model="showRulers" />
  </div>
</DitherDrawer>`

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
    { prop: "side", type: '"right" | "left"', default: '"right"' },
    { prop: "title", type: "string", default: "undefined" },
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
      <div class="flex justify-center">
        <DitherButton @click="drawerOpen = true">Open settings</DitherButton>
        <DitherDrawer
          :open="drawerOpen"
          side="right"
          title="Settings"
          @close="drawerOpen = false"
        >
          <div class="flex items-center justify-between py-2 text-[13px]">
            <span>Snap to grid</span>
            <DitherSwitch v-model="gridSnap" color="green" />
          </div>
          <div class="flex items-center justify-between py-2 text-[13px]">
            <span>Show rulers</span>
            <DitherSwitch v-model="showRulers" />
          </div>
        </DitherDrawer>
      </div>
    </DemoCard>
    <PropsTable :rows="API.drawer" />
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
