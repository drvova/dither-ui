import { reactive } from "vue"
import { type Artboard, normalizeArtboard } from "@/entities/artboard"
import type { ChartModel } from "@/entities/chart"
import { editor, selectArtboard } from "@/entities/editor"

const KEY = "dither-presets-v1"

export type Preset = { name: string; chart: ChartModel }

const load = (): Preset[] => {
  try {
    const raw = localStorage.getItem(KEY)
    const d = raw ? JSON.parse(raw) : []
    return Array.isArray(d) ? d : []
  } catch {
    return []
  }
}

/** Reactive preset list, persisted to localStorage on every change. */
export const presets = reactive<Preset[]>(load())

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(presets))
  } catch {
    // quota / privacy mode — presets just stay session-local
  }
}

/** Snapshot an artboard's chart under a name (replaces a same-named preset). */
export function savePreset(name: string, artboard: Artboard): void {
  const clean = name.trim()
  if (!clean || artboard.widget) return
  const chart = JSON.parse(JSON.stringify(artboard.chart)) as ChartModel
  const i = presets.findIndex((p) => p.name === clean)
  if (i >= 0) presets[i] = { name: clean, chart }
  else presets.push({ name: clean, chart })
  save()
}

export function removePreset(name: string): void {
  const i = presets.findIndex((p) => p.name === name)
  if (i >= 0) {
    presets.splice(i, 1)
    save()
  }
}

let counter = 0
const uid = () => `ab${Date.now().toString(36)}p${(counter++).toString(36)}`

/** Add a new artboard seeded from a preset's chart. */
export function addArtboardFromPreset(preset: Preset): void {
  const right = editor.artboards.reduce((m, a) => Math.max(m, a.x + a.w), 0)
  const a: Artboard = {
    id: uid(),
    name: preset.name,
    x: editor.artboards.length ? right + 80 : 0,
    y: 0,
    w: 520,
    h: 360,
    hidden: false,
    locked: false,
    groupId: null,
    chart: JSON.parse(JSON.stringify(preset.chart)) as ChartModel,
  }
  // Presets saved by an older schema get missing fields filled from defaults.
  editor.artboards.push(normalizeArtboard(a))
  selectArtboard(a.id)
}
