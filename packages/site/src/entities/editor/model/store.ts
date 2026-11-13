// The editor store, the Studio's single source of truth. A mutable store
// (`createMutable`), so it reads and writes as the earlier Vue site's `reactive`
// one did: `editor.viewport.x += 4` is a write every reader hears. Solid
// runs its effects as each write lands, where Vue waited for the turn to
// end, so every action that writes more than once is one `batch`: no reader
// sees a selection that names a frame already gone. A frame handed back by
// an insert is the store's own (the proxy), never the object passed in:
// a write to the bare object would reach no reader.
import { batch, createMemo, createRoot } from "solid-js"
import { createMutable } from "solid-js/store"
import { isServer } from "solid-js/web"
import { type Artboard, type ArtboardKind, cloneArtboard, createArtboard } from "@/entities/artboard"
import { type ComponentEntry, createComponent, createScreen, createReel } from "@/entities/widget"
import { type Layer, layersOf, setChartType } from "@/entities/chart"
import type { ChartType } from "@/shared/config"
import { type Box, boundsOf, FRAME_GAP, freeSpot } from "@/entities/editor/model/free"

export type Viewport = { x: number; y: number; zoom: number }
export type Group = { id: string; name: string; collapsed: boolean }

let gc = 0
const gid = () => `grp${Date.now().toString(36)}${(gc++).toString(36)}`

export const editor = createMutable({
  artboards: [createArtboard("area", 0, 0), createArtboard("bar", 600, 0)] as Artboard[],
  groups: [] as Group[],
  selectedIds: [] as string[], // multi-selected artboard ids
  selectedArtboardId: "" as string, // primary (last selected)
  selectedLayerId: "" as string,
  viewport: { x: 96, y: 88, zoom: 1 } as Viewport,
  replayToken: 0,
  dataOpen: false,
  // The workbench is over the canvas (the Studio's Inspect): the canvas's
  // own keys and zoom step aside while it is. Never persisted.
  inspecting: false,
  // The canvas's size on screen (the canvas measures it; the window's is
  // not the canvas's once panels dock beside it), never persisted.
  stage: { w: 1280, h: 720 },
  // Transient snap guides shown while dragging (world coords), never persisted.
  guides: { v: null as number | null, h: null as number | null },
})
selectArtboard(editor.artboards[0].id)

// --- getters ---------------------------------------------------------------
/** A derived value read as `.value`, as the Vue store's `computed` was: a
 * memo that outlives every component (a server render reads it straight). */
function computed<T>(read: () => T): { readonly value: T } {
  const memo = isServer ? read : createRoot(() => createMemo(read))
  return {
    get value() {
      return memo()
    },
  }
}
export const selectedArtboard = computed<Artboard | null>(
  () => editor.artboards.find((a) => a.id === editor.selectedArtboardId) ?? null,
)
export const selectedChart = computed(() => selectedArtboard.value?.chart ?? null)
export const selectedLayers = computed<Layer[]>(() =>
  selectedArtboard.value ? layersOf(selectedArtboard.value.chart, selectedArtboard.value.id) : [],
)
export const artboardIdOf = (layerId: string) => layerId.split(":")[0]
const find = (id: string) => editor.artboards.find((a) => a.id === id)
const membersOf = (groupId: string) => editor.artboards.filter((a) => a.groupId === groupId)

/** The world point at the centre of the canvas as seen. */
function seenCentre() {
  const zoom = editor.viewport.zoom || 1
  return { x: (editor.stage.w / 2 - editor.viewport.x) / zoom, y: (editor.stage.h / 2 - editor.viewport.y) / zoom }
}

/** Where `boxes` can move as one, nearest where they stand, onto canvas no
 * shown frame is on; moves them there (rounded) and pans the view to them
 * when they are not all in it. Every insert and copy lands through it. */
function settle(boxes: Box[]): void {
  const at = boundsOf(boxes)
  const taken = editor.artboards.filter((a) => !a.hidden && !boxes.includes(a))
  const spot = freeSpot(at, taken)
  const dx = Math.round(spot.x) - at.x
  const dy = Math.round(spot.y) - at.y
  for (const b of boxes) {
    b.x = Math.round(b.x + dx)
    b.y = Math.round(b.y + dy)
  }
  const zoom = editor.viewport.zoom || 1
  const v = { x: -editor.viewport.x / zoom, y: -editor.viewport.y / zoom }
  const seen = boundsOf(boxes)
  const inView =
    seen.x >= v.x &&
    seen.y >= v.y &&
    seen.x + seen.w <= v.x + editor.stage.w / zoom &&
    seen.y + seen.h <= v.y + editor.stage.h / zoom
  if (!inView) centreOn(seen)
}

/** Place a new frame at the centre of the canvas as seen (never the
 * document origin), or, when a frame stands there, on the nearest free
 * canvas, panned into view. */
export function placeArtboard(a: Artboard): Artboard {
  const c = seenCentre()
  a.x = Math.round(c.x - a.w / 2)
  a.y = Math.round(c.y - a.h / 2)
  return batch(() => {
    settle([a])
    editor.artboards.push(a)
    selectArtboard(a.id)
    return editor.artboards[editor.artboards.length - 1]
  })
}

/** Pan so a frame (or any box) stands at the centre of the canvas as
 * seen, its zoom kept: for a frame placed before the canvas could measure
 * itself, or placed off the view. */
export function centreOn(a: Box): void {
  const zoom = editor.viewport.zoom || 1
  editor.viewport = {
    x: Math.round(editor.stage.w / 2 - (a.x + a.w / 2) * zoom),
    y: Math.round(editor.stage.h / 2 - (a.y + a.h / 2) * zoom),
    zoom,
  }
}

/** Place a GENERATION — several variants of one parent — as one row centred
 * on the visible canvas (the batch is a single insert: the row's midpoint is
 * where a lone frame would land, the row moved as one onto free canvas) and
 * select all of them. */
export function placeGeneration(boards: Artboard[], gap = FRAME_GAP): Artboard[] {
  if (!boards.length) return boards
  const c = seenCentre()
  const total = boards.reduce((n, b) => n + b.w, 0) + gap * (boards.length - 1)
  let x = c.x - total / 2
  for (const b of boards) {
    b.x = Math.round(x)
    b.y = Math.round(c.y - b.h / 2)
    x += b.w + gap
  }
  return batch(() => {
    settle(boards)
    editor.artboards.push(...boards)
    selectMany(boards.map((b) => b.id))
    return editor.artboards.slice(-boards.length)
  })
}

/** Copies (clones standing where their originals stand) placed as one,
 * beside the originals on free canvas, and selected. */
function placeCopies(copies: Artboard[]): void {
  if (!copies.length) return
  const from = boundsOf(copies)
  for (const c of copies) c.x += from.w + FRAME_GAP
  batch(() => {
    settle(copies)
    editor.artboards.push(...copies)
    editor.selectedIds = copies.map((c) => c.id)
    editor.selectedArtboardId = copies[copies.length - 1].id
    editor.selectedLayerId = `${editor.selectedArtboardId}:root`
  })
}

// --- selection -------------------------------------------------------------
export function selectArtboard(id: string, additive = false) {
  batch(() => {
    if (additive) {
      const i = editor.selectedIds.indexOf(id)
      if (i >= 0) editor.selectedIds.splice(i, 1)
      else editor.selectedIds.push(id)
    } else {
      editor.selectedIds = [id]
    }
    editor.selectedArtboardId = editor.selectedIds[editor.selectedIds.length - 1] ?? ""
    editor.selectedLayerId = editor.selectedArtboardId ? `${editor.selectedArtboardId}:root` : ""
  })
}
export function selectGroup(groupId: string) {
  selectMany(membersOf(groupId).map((a) => a.id))
}
export function selectLayer(id: string) {
  const ab = artboardIdOf(id)
  batch(() => {
    editor.selectedIds = [ab]
    editor.selectedArtboardId = ab
    editor.selectedLayerId = id
  })
}
/** Replace the selection with an explicit id list (marquee / paste). */
export function selectMany(ids: string[]) {
  batch(() => {
    editor.selectedIds = [...ids]
    editor.selectedArtboardId = ids[ids.length - 1] ?? ""
    editor.selectedLayerId = editor.selectedArtboardId ? `${editor.selectedArtboardId}:root` : ""
  })
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
  placeCopies(src.map((a) => cloneArtboard(a)))
}

export function deselect() {
  batch(() => {
    editor.selectedIds = []
    editor.selectedArtboardId = ""
    editor.selectedLayerId = ""
  })
}
const isSelected = (id: string) => editor.selectedIds.includes(id)

// --- artboards -------------------------------------------------------------
export function addArtboard(kind: ArtboardKind) {
  return placeArtboard(createArtboard(kind))
}

/** Add a composed-screen artboard (rows of registry components). */
export function addScreenArtboard() {
  const base = createArtboard("button")
  base.name = "Screen"
  base.w = 380
  base.h = 560
  base.widget = createScreen()
  return placeArtboard(base)
}

/** Add a registry-driven kit component as an artboard. */
export function addComponentArtboard(entry: ComponentEntry) {
  const base = createArtboard("button")
  base.name = entry.label
  base.w = entry.frame.w
  base.h = entry.frame.h
  base.widget = createComponent(entry)
  return placeArtboard(base)
}

/** Cut frames (by id, in order, no reels) into a reel sized like its first clip. */
export function addReelArtboard(ids: string[]) {
  const clips = ids
    .filter((id, i) => ids.indexOf(id) === i)
    .map(find)
    .filter((a): a is Artboard => !!a && a.widget?.kind !== "reel")
  const base = createArtboard("button")
  base.name = "Reel"
  base.w = clips[0]?.w ?? 480
  base.h = clips[0]?.h ?? 320
  base.widget = createReel(clips.map((a) => a.id))
  return placeArtboard(base)
}

/** Reels only reference frames that still exist. */
function pruneReels() {
  const ids = new Set(editor.artboards.map((a) => a.id))
  batch(() => {
    for (const a of editor.artboards)
      if (a.widget?.kind === "reel") a.widget.clips = a.widget.clips.filter((c) => ids.has(c.id))
  })
}
export function duplicateSelected() {
  placeCopies(
    editor.selectedIds
      .map(find)
      .filter((a): a is Artboard => !!a)
      .map((a) => cloneArtboard(a)),
  )
}
export function removeSelected() {
  const gone = new Set(editor.selectedIds)
  batch(() => {
    editor.artboards = editor.artboards.filter((a) => !gone.has(a.id))
    pruneReels()
    const first = editor.artboards[0]
    if (first) selectArtboard(first.id)
    else deselect()
  })
}
export function removeArtboard(id: string) {
  batch(() => {
    editor.artboards = editor.artboards.filter((a) => a.id !== id)
    pruneReels()
    if (isSelected(id)) {
      const first = editor.artboards[0]
      first ? selectArtboard(first.id) : deselect()
    }
  })
}
export function moveArtboard(id: string, dx: number, dy: number) {
  const a = find(id)
  if (!a || a.locked) return
  batch(() => {
    a.x += dx
    a.y += dy
  })
}
/** Move every selected (unlocked) artboard by the same delta. */
export function moveSelected(dx: number, dy: number) {
  batch(() => {
    for (const id of editor.selectedIds) moveArtboard(id, dx, dy)
  })
}
export function resizeArtboard(id: string, w: number, h: number) {
  const a = find(id)
  if (!a || a.locked) return
  batch(() => {
    a.w = Math.max(260, Math.round(w))
    a.h = Math.max(200, Math.round(h))
  })
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
  batch(() => {
    setChartType(c, type)
    editor.selectedLayerId = `${editor.selectedArtboardId}:root`
    replay()
  })
}

// --- groups ----------------------------------------------------------------
/** Group the selection; the new group, or null with nothing selected. */
export function groupSelected(): Group | null {
  if (editor.selectedIds.length < 1) return null
  const g: Group = { id: gid(), name: `Group ${editor.groups.length + 1}`, collapsed: false }
  return batch(() => {
    editor.groups.push(g)
    for (const id of editor.selectedIds) {
      const a = find(id)
      if (a) a.groupId = g.id
    }
    return editor.groups[editor.groups.length - 1]
  })
}
export function ungroup(groupId: string) {
  batch(() => {
    for (const a of membersOf(groupId)) a.groupId = null
    editor.groups = editor.groups.filter((g) => g.id !== groupId)
  })
}
export function setGroupHidden(groupId: string, v: boolean) {
  batch(() => {
    for (const a of membersOf(groupId)) a.hidden = v
  })
}
export function setGroupLocked(groupId: string, v: boolean) {
  batch(() => {
    for (const a of membersOf(groupId)) a.locked = v
  })
}
export function deleteGroup(groupId: string) {
  const gone = new Set(membersOf(groupId).map((a) => a.id))
  batch(() => {
    editor.artboards = editor.artboards.filter((a) => !gone.has(a.id))
    editor.groups = editor.groups.filter((g) => g.id !== groupId)
    const first = editor.artboards[0]
    first ? selectArtboard(first.id) : deselect()
  })
}

// --- series ----------------------------------------------------------------
/** Delete a series from the frame named, never from whichever is selected:
 * a layer's menu opens on any frame's rows. */
export function deleteSeries(artboardId: string, key: string) {
  const a = editor.artboards.find((x) => x.id === artboardId)
  if (!a || a.widget) return
  batch(() => {
    a.chart.series = a.chart.series.filter((s) => s.key !== key)
    if (editor.selectedLayerId === `${artboardId}:series:${key}`) editor.selectedLayerId = `${artboardId}:root`
  })
}

export function replay() {
  editor.replayToken += 1
}
