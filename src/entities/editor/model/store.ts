import { computed, reactive } from "vue"
import { type Artboard, type ArtboardKind, cloneArtboard, createArtboard } from "@/entities/artboard"
import { type Layer, layersOf, setChartType } from "@/entities/chart"
import type { ChartType } from "@/shared/config"

export type Viewport = { x: number; y: number; zoom: number }
export type Group = { id: string; name: string; collapsed: boolean }

let gc = 0
const gid = () => `grp${Date.now().toString(36)}${(gc++).toString(36)}`

export const editor = reactive({
  artboards: [createArtboard("area", 0, 0), createArtboard("bar", 600, 0)] as Artboard[],
  groups: [] as Group[],
  selectedIds: [] as string[], // multi-selected artboard ids
  selectedArtboardId: "" as string, // primary (last selected)
  selectedLayerId: "" as string,
  viewport: { x: 96, y: 88, zoom: 1 } as Viewport,
  replayToken: 0,
  dataOpen: false,
  // Transient snap guides shown while dragging (world coords), never persisted.
  guides: { v: null as number | null, h: null as number | null },
})
selectArtboard(editor.artboards[0].id)

// --- getters ---------------------------------------------------------------
export const selectedArtboard = computed<Artboard | null>(
  () => editor.artboards.find((a) => a.id === editor.selectedArtboardId) ?? null
)
export const selectedChart = computed(() => selectedArtboard.value?.chart ?? null)
export const selectedLayers = computed<Layer[]>(() =>
  selectedArtboard.value
    ? layersOf(selectedArtboard.value.chart, selectedArtboard.value.id)
    : []
)
export const artboardIdOf = (layerId: string) => layerId.split(":")[0]
const find = (id: string) => editor.artboards.find((a) => a.id === id)
const membersOf = (groupId: string) =>
  editor.artboards.filter((a) => a.groupId === groupId)

// --- selection -------------------------------------------------------------
export function selectArtboard(id: string, additive = false) {
  if (additive) {
    const i = editor.selectedIds.indexOf(id)
    if (i >= 0) editor.selectedIds.splice(i, 1)
    else editor.selectedIds.push(id)
  } else {
    editor.selectedIds = [id]
  }
  editor.selectedArtboardId = editor.selectedIds[editor.selectedIds.length - 1] ?? ""
  editor.selectedLayerId = editor.selectedArtboardId ? `${editor.selectedArtboardId}:root` : ""
}
export function selectGroup(groupId: string) {
  const ids = membersOf(groupId).map((a) => a.id)
  editor.selectedIds = ids
  editor.selectedArtboardId = ids[ids.length - 1] ?? ""
  editor.selectedLayerId = editor.selectedArtboardId ? `${editor.selectedArtboardId}:root` : ""
}
export function selectLayer(id: string) {
  const ab = artboardIdOf(id)
  editor.selectedIds = [ab]
  editor.selectedArtboardId = ab
  editor.selectedLayerId = id
}
/** Replace the selection with an explicit id list (marquee / paste). */
export function selectMany(ids: string[]) {
  editor.selectedIds = [...ids]
  editor.selectedArtboardId = ids[ids.length - 1] ?? ""
  editor.selectedLayerId = editor.selectedArtboardId
    ? `${editor.selectedArtboardId}:root`
    : ""
}

// Internal clipboard — a JSON snapshot so paste still works after a delete.
let clipboard: string | null = null
export function copySelected() {
  const sel = editor.artboards.filter((a) => editor.selectedIds.includes(a.id))
  if (sel.length) clipboard = JSON.stringify(sel)
}
export function pasteClipboard() {
  if (!clipboard) return
  const src = JSON.parse(clipboard) as Artboard[]
  const copies = src.map((a) => cloneArtboard(a))
  editor.artboards.push(...copies)
  selectMany(copies.map((c) => c.id))
}

export function deselect() {
  editor.selectedIds = []
  editor.selectedArtboardId = ""
  editor.selectedLayerId = ""
}
const isSelected = (id: string) => editor.selectedIds.includes(id)

// --- artboards -------------------------------------------------------------
export function addArtboard(kind: ArtboardKind) {
  const right = editor.artboards.reduce((m, a) => Math.max(m, a.x + a.w), 0)
  const a = createArtboard(kind, editor.artboards.length ? right + 80 : 0, 0)
  editor.artboards.push(a)
  selectArtboard(a.id)
}
export function duplicateSelected() {
  const copies = editor.selectedIds
    .map(find)
    .filter((a): a is Artboard => !!a)
    .map((a) => cloneArtboard(a))
  if (!copies.length) return
  editor.artboards.push(...copies)
  editor.selectedIds = copies.map((c) => c.id)
  editor.selectedArtboardId = copies[copies.length - 1].id
  editor.selectedLayerId = `${editor.selectedArtboardId}:root`
}
export function removeSelected() {
  const gone = new Set(editor.selectedIds)
  editor.artboards = editor.artboards.filter((a) => !gone.has(a.id))
  const first = editor.artboards[0]
  if (first) selectArtboard(first.id)
  else deselect()
}
export function removeArtboard(id: string) {
  editor.artboards = editor.artboards.filter((a) => a.id !== id)
  if (isSelected(id)) {
    const first = editor.artboards[0]
    first ? selectArtboard(first.id) : deselect()
  }
}
export function moveArtboard(id: string, dx: number, dy: number) {
  const a = find(id)
  if (!a || a.locked) return
  a.x += dx
  a.y += dy
}
/** Move every selected (unlocked) artboard by the same delta. */
export function moveSelected(dx: number, dy: number) {
  for (const id of editor.selectedIds) moveArtboard(id, dx, dy)
}
export function resizeArtboard(id: string, w: number, h: number) {
  const a = find(id)
  if (!a || a.locked) return
  a.w = Math.max(260, Math.round(w))
  a.h = Math.max(200, Math.round(h))
}
export function setArtboardHidden(id: string, v: boolean) {
  const a = find(id)
  if (a) a.hidden = v
}
export function setArtboardLocked(id: string, v: boolean) {
  const a = find(id)
  if (a) a.locked = v
}
export function setSelectedType(type: ChartType) {
  if (selectedArtboard.value?.widget) return // widget frames have no chart type
  const c = selectedChart.value
  if (!c) return
  setChartType(c, type)
  editor.selectedLayerId = `${editor.selectedArtboardId}:root`
  replay()
}

// --- groups ----------------------------------------------------------------
export function groupSelected() {
  if (editor.selectedIds.length < 1) return
  const g: Group = { id: gid(), name: `Group ${editor.groups.length + 1}`, collapsed: false }
  editor.groups.push(g)
  for (const id of editor.selectedIds) {
    const a = find(id)
    if (a) a.groupId = g.id
  }
}
export function ungroup(groupId: string) {
  for (const a of membersOf(groupId)) a.groupId = null
  editor.groups = editor.groups.filter((g) => g.id !== groupId)
}
export function setGroupHidden(groupId: string, v: boolean) {
  for (const a of membersOf(groupId)) a.hidden = v
}
export function setGroupLocked(groupId: string, v: boolean) {
  for (const a of membersOf(groupId)) a.locked = v
}
export function deleteGroup(groupId: string) {
  const gone = new Set(membersOf(groupId).map((a) => a.id))
  editor.artboards = editor.artboards.filter((a) => !gone.has(a.id))
  editor.groups = editor.groups.filter((g) => g.id !== groupId)
  const first = editor.artboards[0]
  first ? selectArtboard(first.id) : deselect()
}

// --- series ----------------------------------------------------------------
export function deleteSeries(key: string) {
  const c = selectedChart.value
  if (!c) return
  c.series = c.series.filter((s) => s.key !== key)
  if (editor.selectedLayerId.endsWith(`:series:${key}`))
    editor.selectedLayerId = `${editor.selectedArtboardId}:root`
}

export function replay() {
  editor.replayToken += 1
}
