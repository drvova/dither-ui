<script setup lang="ts">
import { computed, nextTick, reactive, ref } from "vue"
import type { Artboard } from "@/entities/artboard"
import { type Layer, layersOf } from "@/entities/chart"
import {
  deleteGroup,
  deleteSeries,
  duplicateSelected,
  editor,
  type Group,
  groupSelected,
  removeArtboard,
  selectArtboard,
  selectGroup,
  selectLayer,
  setArtboardHidden,
  setArtboardLocked,
  setGroupHidden,
  setGroupLocked,
  ungroup,
} from "@/entities/editor"
import { cssColor } from "@dither-kit"
import { ContextMenu, type MenuItem } from "@/shared/ui"

type Node =
  | { t: "group"; group: Group }
  | { t: "artboard"; a: Artboard; depth: number }
  | { t: "layer"; a: Artboard; layer: Layer; depth: number }

const collapsed = reactive(new Set<string>()) // collapsed artboard ids
const isOpen = (id: string) => !collapsed.has(id)
function toggleArtboard(id: string) {
  collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id)
}

// Widget frames (avatar/button/gradient) are single nodes — no chart layers.
const childLayers = (a: Artboard) =>
  a.widget ? [] : layersOf(a.chart, a.id).filter((l) => l.kind !== "root")

const nodes = computed<Node[]>(() => {
  const out: Node[] = []
  const pushArtboard = (a: Artboard, depth: number) => {
    out.push({ t: "artboard", a, depth })
    if (isOpen(a.id))
      for (const l of childLayers(a)) out.push({ t: "layer", a, layer: l, depth: depth + 1 })
  }
  const seen = new Set<string>()
  for (const a of editor.artboards) {
    if (a.groupId) {
      if (seen.has(a.groupId)) continue
      seen.add(a.groupId)
      const g = editor.groups.find((x) => x.id === a.groupId)
      if (!g) { pushArtboard(a, 0); continue }
      out.push({ t: "group", group: g })
      if (!g.collapsed)
        for (const m of editor.artboards.filter((x) => x.groupId === g.id)) pushArtboard(m, 1)
    } else {
      pushArtboard(a, 0)
    }
  }
  return out
})

// --- state helpers ---------------------------------------------------------
const isSel = (id: string) => editor.selectedIds.includes(id)
const members = (g: Group) => editor.artboards.filter((a) => a.groupId === g.id)
const groupHidden = (g: Group) => members(g).length > 0 && members(g).every((a) => a.hidden)
const groupLocked = (g: Group) => members(g).length > 0 && members(g).every((a) => a.locked)

const seriesOf = (a: Artboard, l: Layer) => a.chart.series.find((s) => s.key === l.seriesKey)
function layerVisible(a: Artboard, l: Layer): boolean {
  const c = a.chart
  switch (l.kind) {
    case "grid": return c.grid.on
    case "xAxis": return c.xAxis.on
    case "yAxis": return c.yAxis.on
    case "legend": return c.legend.on
    case "tooltip": return c.tooltip.on
    case "series": return seriesOf(a, l)?.on ?? true
    default: return true
  }
}
function layerLocked(a: Artboard, l: Layer): boolean {
  const c = a.chart
  switch (l.kind) {
    case "grid": return c.grid.locked
    case "xAxis": return c.xAxis.locked
    case "yAxis": return c.yAxis.locked
    case "legend": return c.legend.locked
    case "tooltip": return c.tooltip.locked
    case "series": return seriesOf(a, l)?.locked ?? false
    default: return false
  }
}
const togglable = (l: Layer) => l.kind !== "root" && l.kind !== "pie"
function toggleLayerVis(a: Artboard, l: Layer) {
  if (layerLocked(a, l)) return
  const c = a.chart
  switch (l.kind) {
    case "grid": c.grid.on = !c.grid.on; break
    case "xAxis": c.xAxis.on = !c.xAxis.on; break
    case "yAxis": c.yAxis.on = !c.yAxis.on; break
    case "legend": c.legend.on = !c.legend.on; break
    case "tooltip": c.tooltip.on = !c.tooltip.on; break
    case "series": { const s = seriesOf(a, l); if (s) s.on = !s.on; break }
  }
}
function toggleLayerLock(a: Artboard, l: Layer) {
  const c = a.chart
  switch (l.kind) {
    case "grid": c.grid.locked = !c.grid.locked; break
    case "xAxis": c.xAxis.locked = !c.xAxis.locked; break
    case "yAxis": c.yAxis.locked = !c.yAxis.locked; break
    case "legend": c.legend.locked = !c.legend.locked; break
    case "tooltip": c.tooltip.locked = !c.tooltip.locked; break
    case "series": { const s = seriesOf(a, l); if (s) s.locked = !s.locked; break }
  }
}

// --- selection -------------------------------------------------------------
function clickArtboard(a: Artboard, e: MouseEvent) {
  selectArtboard(a.id, e.metaKey || e.ctrlKey || e.shiftKey)
  collapsed.delete(a.id)
}

// --- rename (frames + groups) ----------------------------------------------
const editingId = ref<string | null>(null)
const editText = ref("")
const renameInput = ref<HTMLInputElement | null>(null)
function startRename(id: string, current: string) {
  editingId.value = id
  editText.value = current
  nextTick(() => renameInput.value?.select())
}
function commitArtboardName(a: Artboard) {
  if (editingId.value !== a.id) return
  const t = editText.value.trim()
  if (t) a.name = t
  editingId.value = null
}
function commitGroupName(g: Group) {
  if (editingId.value !== g.id) return
  const t = editText.value.trim()
  if (t) g.name = t
  editingId.value = null
}

// --- context menu ----------------------------------------------------------
const menu = ref<{ x: number; y: number; items: MenuItem[] } | null>(null)
function open(e: MouseEvent, items: MenuItem[]) {
  menu.value = { x: e.clientX, y: e.clientY, items }
}
function artboardItems(a: Artboard): MenuItem[] {
  return [
    { label: "Rename", onClick: () => startRename(a.id, a.name) },
    { label: "Duplicate", onClick: () => { if (!isSel(a.id)) selectArtboard(a.id); duplicateSelected() } },
    { divider: true },
    { label: "Group selection", onClick: () => { if (!isSel(a.id)) selectArtboard(a.id); groupSelected() } },
    ...(a.groupId ? [{ label: "Ungroup", onClick: () => ungroup(a.groupId!) }] : []),
    { divider: true },
    { label: a.locked ? "Unlock" : "Lock", onClick: () => setArtboardLocked(a.id, !a.locked) },
    { label: a.hidden ? "Show" : "Hide", onClick: () => setArtboardHidden(a.id, !a.hidden) },
    { divider: true },
    { label: "Delete", danger: true, onClick: () => removeArtboard(a.id) },
  ]
}
function groupItems(g: Group): MenuItem[] {
  return [
    { label: "Rename", onClick: () => startRename(g.id, g.name) },
    { label: "Ungroup", onClick: () => ungroup(g.id) },
    { divider: true },
    { label: groupLocked(g) ? "Unlock all" : "Lock all", onClick: () => setGroupLocked(g.id, !groupLocked(g)) },
    { label: groupHidden(g) ? "Show all" : "Hide all", onClick: () => setGroupHidden(g.id, !groupHidden(g)) },
    { divider: true },
    { label: "Delete group", danger: true, onClick: () => deleteGroup(g.id) },
  ]
}
function layerItems(a: Artboard, l: Layer): MenuItem[] {
  const base: MenuItem[] = [
    { label: layerVisible(a, l) ? "Hide" : "Show", disabled: layerLocked(a, l), onClick: () => toggleLayerVis(a, l) },
    { label: layerLocked(a, l) ? "Unlock" : "Lock", onClick: () => toggleLayerLock(a, l) },
  ]
  if (l.kind === "series")
    base.push({ divider: true }, { label: "Delete", danger: true, onClick: () => deleteSeries(l.seriesKey!) })
  return base
}
</script>

<template>
  <div class="flex flex-col gap-px text-[13px]">
    <template v-for="node in nodes" :key="node.t === 'group' ? node.group.id : node.t === 'artboard' ? node.a.id : node.layer.id">
      <!-- GROUP -->
      <div
        v-if="node.t === 'group'"
        class="group/row flex h-7 items-center gap-1 rounded pl-1 pr-1.5 transition-colors"
        :class="members(node.group).some((m) => isSel(m.id)) ? 'bg-accent/10' : 'hover:bg-card'"
        @click="selectGroup(node.group.id)"
        @contextmenu.prevent.stop="open($event, groupItems(node.group))"
      >
        <button type="button" :aria-label="node.group.collapsed ? 'Expand group' : 'Collapse group'" class="flex size-5 shrink-0 items-center justify-center text-muted-foreground/70 hover:text-foreground" @click.stop="node.group.collapsed = !node.group.collapsed">
          <svg viewBox="0 0 24 24" class="size-3 transition-transform" :class="!node.group.collapsed ? 'rotate-90' : ''" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <svg viewBox="0 0 24 24" class="size-3.5 shrink-0 text-muted-foreground/70" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
        <input v-if="editingId === node.group.id" ref="renameInput" v-model="editText" name="group-rename" autocomplete="off" class="min-w-0 flex-1 rounded border border-accent/60 bg-background px-1 py-0.5 text-[13px] text-foreground outline-none" @click.stop @keydown.enter.prevent="commitGroupName(node.group)" @keydown.esc.prevent="editingId = null" @blur="commitGroupName(node.group)" />
        <span v-else class="truncate font-medium text-foreground/90" @dblclick.stop="startRename(node.group.id, node.group.name)">{{ node.group.name }}</span>
        <span class="ml-auto flex items-center gap-0.5">
          <button type="button" :aria-label="groupLocked(node.group) ? 'Unlock group' : 'Lock group'" :aria-pressed="groupLocked(node.group)" class="flex size-6 items-center justify-center rounded hover:bg-background" :class="groupLocked(node.group) ? 'text-accent' : 'text-muted-foreground opacity-0 group-hover/row:opacity-70'" @click.stop="setGroupLocked(node.group.id, !groupLocked(node.group))">
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path v-if="groupLocked(node.group)" d="M8 11V7a4 4 0 0 1 8 0v4" /><path v-else d="M8 11V7a4 4 0 0 1 7-2.6" /></svg>
          </button>
          <button type="button" :aria-label="groupHidden(node.group) ? 'Show group' : 'Hide group'" :aria-pressed="groupHidden(node.group)" class="flex size-6 items-center justify-center rounded hover:bg-background" :class="groupHidden(node.group) ? 'text-muted-foreground' : 'text-muted-foreground opacity-0 group-hover/row:opacity-70'" @click.stop="setGroupHidden(node.group.id, !groupHidden(node.group))">
            <svg v-if="!groupHidden(node.group)" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
            <svg v-else viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l20 20M6.7 6.7A10.5 10.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.3-1.5" /></svg>
          </button>
        </span>
      </div>

      <!-- ARTBOARD -->
      <div
        v-else-if="node.t === 'artboard'"
        class="group/row flex h-7 items-center gap-1 rounded pr-1.5 transition-colors"
        :style="{ paddingLeft: `${4 + node.depth * 16}px` }"
        :class="[isSel(node.a.id) ? 'bg-accent/15' : 'hover:bg-card', node.a.hidden ? 'opacity-45' : '']"
        @click="clickArtboard(node.a, $event)"
        @contextmenu.prevent.stop="open($event, artboardItems(node.a))"
      >
        <button type="button" :aria-label="isOpen(node.a.id) ? 'Collapse layers' : 'Expand layers'" class="flex size-5 shrink-0 items-center justify-center text-muted-foreground/70 hover:text-foreground" @click.stop="toggleArtboard(node.a.id)">
          <svg viewBox="0 0 24 24" class="size-3 transition-transform" :class="isOpen(node.a.id) ? 'rotate-90' : ''" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <span class="grid size-3.5 shrink-0 place-items-center text-[13px] font-semibold leading-none" :class="isSel(node.a.id) ? 'text-accent' : 'text-muted-foreground/60'">#</span>
        <input v-if="editingId === node.a.id" ref="renameInput" v-model="editText" name="artboard-rename" autocomplete="off" class="min-w-0 flex-1 rounded border border-accent/60 bg-background px-1 py-0.5 text-[13px] text-foreground outline-none" @click.stop @keydown.enter.prevent="commitArtboardName(node.a)" @keydown.esc.prevent="editingId = null" @blur="commitArtboardName(node.a)" />
        <span v-else class="truncate" :class="isSel(node.a.id) ? 'font-medium text-foreground' : 'text-foreground/90'" @dblclick.stop="startRename(node.a.id, node.a.name)">{{ node.a.name }}</span>
        <span class="ml-auto flex items-center gap-0.5">
          <button type="button" :aria-label="node.a.locked ? 'Unlock artboard' : 'Lock artboard'" :aria-pressed="node.a.locked" class="flex size-6 items-center justify-center rounded hover:bg-background" :class="node.a.locked ? 'text-accent' : 'text-muted-foreground opacity-0 group-hover/row:opacity-70'" @click.stop="setArtboardLocked(node.a.id, !node.a.locked)">
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path v-if="node.a.locked" d="M8 11V7a4 4 0 0 1 8 0v4" /><path v-else d="M8 11V7a4 4 0 0 1 7-2.6" /></svg>
          </button>
          <button type="button" :aria-label="node.a.hidden ? 'Show artboard' : 'Hide artboard'" :aria-pressed="node.a.hidden" class="flex size-6 items-center justify-center rounded hover:bg-background" :class="node.a.hidden ? 'text-muted-foreground' : 'text-muted-foreground opacity-0 group-hover/row:opacity-70'" @click.stop="setArtboardHidden(node.a.id, !node.a.hidden)">
            <svg v-if="!node.a.hidden" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
            <svg v-else viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l20 20M6.7 6.7A10.5 10.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.3-1.5" /></svg>
          </button>
        </span>
        <span v-if="editingId !== node.a.id" class="shrink-0 text-[11px] capitalize text-muted-foreground/50">{{ node.a.widget?.kind ?? node.a.chart.type }}</span>
      </div>

      <!-- LAYER -->
      <div
        v-else
        class="group/row flex h-7 items-center gap-2 rounded pr-1.5 transition-colors"
        :style="{ paddingLeft: `${8 + node.depth * 16}px` }"
        :class="[
          editor.selectedLayerId === node.layer.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-card',
          !layerVisible(node.a, node.layer) && togglable(node.layer) ? 'opacity-45' : '',
        ]"
        @click="selectLayer(node.layer.id)"
        @contextmenu.prevent.stop="open($event, layerItems(node.a, node.layer))"
      >
        <span class="truncate text-[12px]">{{ node.layer.label }}</span>
        <span v-if="node.layer.kind === 'series' && seriesOf(node.a, node.layer)" class="ml-auto size-2.5 shrink-0 rounded-[2px]" :style="{ backgroundColor: cssColor(seriesOf(node.a, node.layer)!.color) }" />
        <span v-if="togglable(node.layer)" class="flex items-center gap-0.5" :class="node.layer.kind === 'series' ? '' : 'ml-auto'">
          <button type="button" :aria-label="layerLocked(node.a, node.layer) ? 'Unlock layer' : 'Lock layer'" :aria-pressed="layerLocked(node.a, node.layer)" class="flex size-6 items-center justify-center rounded hover:bg-black/10" :class="layerLocked(node.a, node.layer) ? 'opacity-90' : 'opacity-0 group-hover/row:opacity-70'" @click.stop="toggleLayerLock(node.a, node.layer)">
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path v-if="layerLocked(node.a, node.layer)" d="M8 11V7a4 4 0 0 1 8 0v4" /><path v-else d="M8 11V7a4 4 0 0 1 7-2.6" /></svg>
          </button>
          <button type="button" :aria-label="layerVisible(node.a, node.layer) ? 'Hide layer' : 'Show layer'" :aria-pressed="!layerVisible(node.a, node.layer)" class="flex size-6 items-center justify-center rounded hover:bg-black/10" :class="!layerVisible(node.a, node.layer) ? 'opacity-90' : 'opacity-0 group-hover/row:opacity-70'" @click.stop="toggleLayerVis(node.a, node.layer)">
            <svg v-if="layerVisible(node.a, node.layer)" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
            <svg v-else viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l20 20M6.7 6.7A10.5 10.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.3-1.5" /></svg>
          </button>
        </span>
      </div>
    </template>

    <ContextMenu v-if="menu" :x="menu.x" :y="menu.y" :items="menu.items" @close="menu = null" />
  </div>
</template>
