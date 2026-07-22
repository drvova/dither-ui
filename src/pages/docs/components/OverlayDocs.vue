<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue"
import {
  DitherAvatar,
  DitherBadge,
  DitherButton,
  DitherCommand,
  DitherContextMenu,
  DitherMenu,
  DitherMenubar,
  DitherPopover,
  DitherPreviewCard,
  DitherTooltip,
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const popoverOpen = ref(false)

/* Command palette: open state, catalog, last run, and a real hotkey. */
const commandOpen = ref(false)
const commandRan = ref("—")
const COMMAND_ITEMS = [
  { value: "new-artboard", label: "New artboard", group: "Studio", kbd: "N" },
  { value: "export-image", label: "Export image", group: "Studio", kbd: "⇧E" },
  { value: "open-docs", label: "Open docs", group: "Navigate" },
  { value: "open-studio", label: "Open studio", group: "Navigate" },
  { value: "toggle-theme", label: "Toggle theme", group: "Preferences" },
]
function commandHotkey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault()
    commandOpen.value = !commandOpen.value
  }
}
onMounted(() => window.addEventListener("keydown", commandHotkey))
onUnmounted(() => window.removeEventListener("keydown", commandHotkey))

const MENU_ITEMS = [
  { label: "New" },
  { label: "Duplicate" },
  { divider: true },
  { label: "Delete", danger: true },
]
const menuAction = ref("none")

const CTX_ITEMS = [
  { label: "Cut" },
  { label: "Copy" },
  { label: "Paste" },
  { divider: true },
  { label: "Delete", danger: true },
]
const ctxAction = ref("none")

const MENUBAR = [
  {
    label: "File",
    items: [{ label: "New" }, { label: "Open" }, { label: "Save" }],
  },
  {
    label: "Edit",
    items: [{ label: "Undo" }, { label: "Redo" }, { label: "Find" }],
  },
  {
    label: "View",
    items: [{ label: "Zoom in" }, { label: "Zoom out" }],
  },
]
const lastAction = ref("none")

const SNIPPET_POPOVER = `<script setup>
const open = ref(false)
<\/script>

<DitherPopover :open="open" align="center" @close="open = false">
  <template #trigger>
    <DitherButton @click="open = !open">Open popover</DitherButton>
  </template>
  <p class="text-[12px] leading-relaxed text-muted-foreground">
    Anchored to its trigger — Escape or an outside press closes it.
  </p>
</DitherPopover>`

const SNIPPET_MENU = `<script setup>
const items = [
  { label: "New" },
  { label: "Duplicate" },
  { divider: true },
  { label: "Delete", danger: true },
]
<\/script>

<DitherMenu :items="items" @select="(label) => run(label)">
  Actions
</DitherMenu>`

const SNIPPET_CONTEXT = `<script setup>
const items = [
  { label: "Cut" },
  { label: "Copy" },
  { label: "Paste" },
  { divider: true },
  { label: "Delete", danger: true },
]
<\/script>

<DitherContextMenu :items="items" @select="(label) => run(label)">
  <div class="rounded-lg border border-dashed border-border p-10">
    right-click me
  </div>
</DitherContextMenu>`

const SNIPPET_MENUBAR = `<script setup>
const menus = [
  { label: "File", items: [{ label: "New" }, { label: "Open" }, { label: "Save" }] },
  { label: "Edit", items: [{ label: "Undo" }, { label: "Redo" }, { label: "Find" }] },
  { label: "View", items: [{ label: "Zoom in" }, { label: "Zoom out" }] },
]
const last = ref("none")
<\/script>

<DitherMenubar :menus="menus" @select="(m, i) => (last = \`\${m} → \${i}\`)" />
<p class="mt-3 text-[12px] text-muted-foreground">last action: {{ last }}</p>`

const SNIPPET_TOOLTIP = `<DitherTooltip text="Deploys are frozen until Monday">
  <DitherBadge color="orange">frozen</DitherBadge>
</DitherTooltip>`

const SNIPPET_COMMAND = `<script setup>
const open = ref(false)
window.addEventListener("keydown", (e) => {   // the hotkey stays yours
  if ((e.metaKey || e.ctrlKey) && e.key === "k") (e.preventDefault(), open.value = !open.value)
})
<\/script>

<DitherButton @click="open = true">⌘K · Command</DitherButton>
<DitherCommand
  :open="open"
  :items="[
    { value: 'new', label: 'New artboard', group: 'Studio', kbd: 'N' },
    { value: 'export', label: 'Export image', group: 'Studio' },
    { value: 'docs', label: 'Open docs', group: 'Navigate' },
  ]"
  @select="run"
  @close="open = false"
/>

<!-- type to filter · ↑↓ walk · Enter runs · Escape leaves -->`

const SNIPPET_PREVIEW = `<DitherPreviewCard>
  <template #trigger>
    <span class="underline decoration-border underline-offset-4" tabindex="0">
      @ada
    </span>
  </template>
  <div class="flex items-center gap-3">
    <DitherAvatar name="Ada Lovelace" :size="40" />
    <div>
      <p class="text-[13px]">Ada Lovelace</p>
      <p class="text-[11px] text-muted-foreground">Wrote the first program.</p>
    </div>
  </div>
</DitherPreviewCard>`

const API: Record<string, PropRow[]> = {
  popover: [
    { prop: "open", type: "boolean", default: "—" },
    { prop: "align", type: '"start" | "center" | "end"', default: '"start"' },
  ],
  menu: [{ prop: "items", type: "MenuItem[]", default: "—" }],
  contextMenu: [{ prop: "items", type: "ContextMenuItem[]", default: "—" }],
  menubar: [
    {
      prop: "menus",
      type: "{ label: string; items: MenubarItem[] }[]",
      default: "—",
    },
  ],
  tooltip: [
    { prop: "text", type: "string", default: "—" },
    { prop: "delay", type: "number", default: "300" },
  ],
  previewCard: [{ prop: "delay", type: "number", default: "400" }],
  command: [
    { prop: "open", type: "boolean — @close asks to leave", default: "required" },
    { prop: "items", type: "{ value, label, group?, kbd? }[]", default: "required" },
    { prop: "placeholder", type: "string", default: '"Type a command…"' },
    { prop: "empty", type: "string — no-match line", default: '"No results."' },
    { prop: "@select", type: "(value) — fired before close", default: "—" },
  ],
}
</script>

<template>
  <section id="popover" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Popover</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      An anchored panel below its trigger — bring your own trigger and content.
      Escape or an outside press emits close.
    </p>
    <DemoCard :code="SNIPPET_POPOVER">
      <div class="flex justify-center">
        <DitherPopover
          :open="popoverOpen"
          align="center"
          @close="popoverOpen = false"
        >
          <template #trigger>
            <DitherButton @click="popoverOpen = !popoverOpen">
              Open popover
            </DitherButton>
          </template>
          <p class="text-[12px] leading-relaxed text-muted-foreground">
            Anchored to its trigger — Escape or an outside press closes it.
          </p>
        </DitherPopover>
      </div>
    </DemoCard>
    <PropsTable :rows="API.popover" />
  </section>

  <section id="menu" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Menu</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A dropdown menu behind a single button — arrow keys move focus, Enter
      selects, Escape closes and refocuses the trigger.
    </p>
    <DemoCard :code="SNIPPET_MENU">
      <div class="flex flex-col items-center gap-3">
        <DitherMenu :items="MENU_ITEMS" @select="(label) => (menuAction = label)">
          Actions
        </DitherMenu>
        <p class="text-[12px] text-muted-foreground">
          last action: {{ menuAction }}
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.menu" />
  </section>

  <section id="context-menu" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Context Menu</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A right-click menu teleported to the pointer — same items and keyboard
      behavior as Menu, dismissed by Escape or any outside press.
    </p>
    <DemoCard :code="SNIPPET_CONTEXT">
      <div class="flex flex-col items-center gap-3">
        <DitherContextMenu
          :items="CTX_ITEMS"
          @select="(label) => (ctxAction = label)"
        >
          <div
            class="flex h-32 w-64 items-center justify-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground select-none"
          >
            right-click me
          </div>
        </DitherContextMenu>
        <p class="text-[12px] text-muted-foreground">
          last action: {{ ctxAction }}
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.contextMenu" />
  </section>

  <section id="menubar" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Menubar</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A desktop-style horizontal bar — one menu open at a time, hover switches
      between top items, ArrowLeft/Right move across them.
    </p>
    <DemoCard :code="SNIPPET_MENUBAR">
      <div class="flex flex-col items-center gap-3">
        <DitherMenubar
          :menus="MENUBAR"
          @select="(m, i) => (lastAction = `${m} → ${i}`)"
        />
        <p class="text-[12px] text-muted-foreground">
          last action: {{ lastAction }}
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.menubar" />
  </section>

  <section id="tooltip" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Tooltip</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A delayed hover tip above its target — also shows on focus, hides on
      leave, blur, or Escape. No transition under reduced motion.
    </p>
    <DemoCard :code="SNIPPET_TOOLTIP">
      <div class="flex justify-center">
        <DitherTooltip text="Deploys are frozen until Monday">
          <DitherBadge color="orange">frozen</DitherBadge>
        </DitherTooltip>
      </div>
    </DemoCard>
    <PropsTable :rows="API.tooltip" />
  </section>

  <section id="preview-card" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Preview Card</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A hover preview for rich content — opens after a delay on hover or focus;
      a short close delay lets the pointer travel into the card.
    </p>
    <DemoCard :code="SNIPPET_PREVIEW">
      <div class="flex justify-center">
        <DitherPreviewCard>
          <template #trigger>
            <span
              class="cursor-pointer text-[13px] underline decoration-border underline-offset-4"
              tabindex="0"
            >
              @ada
            </span>
          </template>
          <div class="flex items-center gap-3">
            <DitherAvatar name="Ada Lovelace" :size="40" />
            <div>
              <p class="text-[13px] text-foreground">Ada Lovelace</p>
              <p class="text-[11px] text-muted-foreground">
                Wrote the first program.
              </p>
            </div>
          </div>
        </DitherPreviewCard>
      </div>
    </DemoCard>
    <PropsTable :rows="API.previewCard" />
  </section>

  <section id="command" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Command</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The ⌘K palette — type to filter, arrows to walk, Enter runs, Escape
      leaves. Groups follow first appearance; the hotkey stays in your hands.
      Try ⌘K right here.
    </p>
    <DemoCard :code="SNIPPET_COMMAND">
      <div class="grid min-h-28 place-items-center gap-3">
        <DitherButton color="blue" class="px-3 py-1.5 text-[12px]" @click="commandOpen = true">⌘K · Command</DitherButton>
        <p class="text-[10px] text-muted-foreground">last ran: {{ commandRan }}</p>
        <DitherCommand
          :open="commandOpen"
          :items="COMMAND_ITEMS"
          @select="commandRan = $event"
          @close="commandOpen = false"
        />
      </div>
    </DemoCard>
    <PropsTable :rows="API.command" />
  </section>
</template>
