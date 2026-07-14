import { computed, reactive } from "vue"
import { type Artboard, cloneArtboard, createArtboard } from "@/entities/artboard"
import { type Layer, layersOf, setChartType } from "@/entities/chart"
import type { ChartType } from "@/shared/config"

export type Viewport = { x: number; y: number; zoom: number }

export const editor = reactive({
  artboards: [
    createArtboard("area", 0, 0),
    createArtboard("bar", 600, 0),
  ] as Artboard[],
  selectedArtboardId: "" as string,
  selectedLayerId: "" as string,
  viewport: { x: 96, y: 88, zoom: 1 } as Viewport,
  replayToken: 0,
})
editor.selectedArtboardId = editor.artboards[0].id
editor.selectedLayerId = `${editor.artboards[0].id}:root`

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

export function selectArtboard(id: string) {
  editor.selectedArtboardId = id
  editor.selectedLayerId = `${id}:root`
}
export function selectLayer(id: string) {
  editor.selectedArtboardId = artboardIdOf(id)
  editor.selectedLayerId = id
}
export function addArtboard(type: ChartType) {
  const right = editor.artboards.reduce((m, a) => Math.max(m, a.x + a.w), 0)
  const a = createArtboard(type, editor.artboards.length ? right + 80 : 0, 0)
  editor.artboards.push(a)
  selectArtboard(a.id)
}
export function duplicateSelected() {
  const src = selectedArtboard.value
  if (!src) return
  const copy = cloneArtboard(src)
  editor.artboards.push(copy)
  selectArtboard(copy.id)
}
export function removeSelected() {
  const id = editor.selectedArtboardId
  editor.artboards = editor.artboards.filter((a) => a.id !== id)
  const first = editor.artboards[0]
  if (first) selectArtboard(first.id)
  else {
    editor.selectedArtboardId = ""
    editor.selectedLayerId = ""
  }
}
export function moveArtboard(id: string, dx: number, dy: number) {
  const a = editor.artboards.find((x) => x.id === id)
  if (!a) return
  a.x += dx
  a.y += dy
}
export function resizeArtboard(id: string, w: number, h: number) {
  const a = editor.artboards.find((x) => x.id === id)
  if (!a) return
  a.w = Math.max(260, Math.round(w))
  a.h = Math.max(200, Math.round(h))
}
export function setSelectedType(type: ChartType) {
  const c = selectedChart.value
  if (!c) return
  setChartType(c, type)
  editor.selectedLayerId = `${editor.selectedArtboardId}:root`
  replay()
}
export function replay() {
  editor.replayToken += 1
}
