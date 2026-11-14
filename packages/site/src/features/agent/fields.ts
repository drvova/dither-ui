// What a command's fields become once parsed: the shapes the command table
// (`commands.ts`) reads untrusted input into, each read once where the
// command enters, and the frame summary every answer carries.
import { type Artboard } from "@/entities/artboard"
import { createChart, createSeriesRow, LABEL_KEY } from "@/entities/chart"
import { editor } from "../../entities/editor"
import {
  componentEntry,
  createCell,
  createClip,
  createRow,
  type ReelClip,
  type ReelScore,
  type ReelTransitionKind,
  sanitizeComponentProps,
  sanitizeModel,
  type ScreenRow,
} from "@/entities/widget"
import { type ChartType, familyOf } from "@/shared/config"

export const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
export const find = (id: string) => editor.artboards.find((a) => a.id === id)

/** A compact description of one artboard for listings. */
export function summarize(a: Artboard) {
  const kind = a.widget ? (a.widget.kind === "component" ? a.widget.is : a.widget.kind) : `${a.chart.type} chart`
  return {
    id: a.id,
    name: a.name,
    kind,
    x: a.x,
    y: a.y,
    w: a.w,
    h: a.h,
    hidden: a.hidden,
    locked: a.locked,
    group: a.groupId ?? null,
    selected: editor.selectedIds.includes(a.id),
  }
}

/** A frame name: a string, at most 80 characters. */
export const nameOf = (v: unknown): string | undefined => (typeof v === "string" ? v.slice(0, 80) : undefined)

/** A frame's size as a command asks it: each side a finite number, held to 40-4000px. */
type FrameSize = { w?: number; h?: number }
const side = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(40, Math.min(4000, Math.round(v))) : undefined
export const frameOf = (v: unknown): FrameSize => (isPlain(v) ? { w: side(v.w), h: side(v.h) } : {})
export function applyFrame(a: Artboard, frame: FrameSize) {
  if (frame.w !== undefined) a.w = frame.w
  if (frame.h !== undefined) a.h = frame.h
}

/** A chart's data in the friendly shape, parsed: labels as text, series with
 * a key and their values as numbers (junk is 0). */
type ChartData = {
  labels: string[]
  series: { key: string; label?: string; color?: string; values: number[] }[]
}
export function chartDataOf(v: Record<string, unknown>): ChartData {
  const labels = (Array.isArray(v.labels) ? v.labels : []).map(String)
  const series = (Array.isArray(v.series) ? v.series : []).flatMap((s) =>
    isPlain(s) && typeof s.key === "string" && s.key && Array.isArray(s.values)
      ? [
          {
            key: s.key,
            label: typeof s.label === "string" ? s.label : undefined,
            color: typeof s.color === "string" ? s.color : undefined,
            values: labels.map((_, i) => {
              const n = Number((s.values as unknown[])[i])
              return Number.isFinite(n) ? n : 0
            }),
          },
        ]
      : [],
  )
  return { labels, series }
}

const PALETTE = ["blue", "purple", "green", "orange", "pink", "red", "grey"]

/** Build chart rows + series from parsed `{ labels, series }`. */
export function chartFromData(type: ChartType, data: ChartData) {
  const chart = createChart(type)
  const family = familyOf(type)
  const labelKey = LABEL_KEY[family]
  const series = data.series.map((s) => ({ ...s, key: family === "pie" ? "value" : s.key.replace(/[^\w-]/g, "_") }))
  if (!data.labels.length || !series.length) return chart
  chart.rows = data.labels.map((label, i) => {
    const row: Record<string, string | number> = { [labelKey]: label }
    for (const s of series) row[s.key] = s.values[i]
    return row
  })
  const seen = new Set<string>()
  chart.series = series
    .filter((s) => !seen.has(s.key) && seen.add(s.key))
    .map((s, i) => createSeriesRow(s.key, s.label ?? s.key, s.color ?? PALETTE[i % PALETTE.length]))
  return chart
}

/** A score spec as the model's: `true` or `{ seed }` is on, anything else off. */
export const scoreOf = (v: unknown): ReelScore | null =>
  v === true ? { seed: 1 } : isPlain(v) ? { seed: typeof v.seed === "number" ? v.seed : 1 } : null

/** One clip as a command spells it, parsed: a frame's id, how long it plays,
 * how it comes in; the film over it (camera keys, callouts, a chapter) rides
 * through raw for `normalizeArtboard`, the document's own validator. */
export type ClipSpec = {
  id: string
  seconds?: number
  transition: { kind?: ReelTransitionKind; seconds?: number; cell?: number; seed?: number }
  camera?: unknown[]
  callouts?: unknown[]
  chapter?: unknown
}
const num = (v: unknown) => (typeof v === "number" ? v : undefined)
/** Clip specs (ids or { id, seconds?, transition?, ... }); anything else is dropped. */
export const clipSpecsOf = (v: unknown): ClipSpec[] =>
  (Array.isArray(v) ? v : []).flatMap((raw): ClipSpec[] => {
    if (typeof raw === "string") return [{ id: raw, transition: {} }]
    if (!isPlain(raw) || typeof raw.id !== "string") return []
    const t = isPlain(raw.transition) ? raw.transition : {}
    return [
      {
        id: raw.id,
        seconds: num(raw.seconds),
        transition: {
          kind: typeof t.kind === "string" ? (t.kind as ReelTransitionKind) : undefined,
          seconds: num(t.seconds),
          cell: num(t.cell),
          seed: num(t.seed),
        },
        camera: Array.isArray(raw.camera) ? raw.camera : undefined,
        callouts: Array.isArray(raw.callouts) ? raw.callouts : undefined,
        ...("chapter" in raw && raw.chapter !== undefined ? { chapter: raw.chapter } : {}),
      },
    ]
  })

/** Clip specs as reel clips against the canvas, each frame once, with the
 * ids a reel cannot hold: unknown frames and reels. */
export function clipsOf(specs: ClipSpec[]) {
  const clips: ReelClip[] = []
  const missing: string[] = []
  const reels: string[] = []
  for (const spec of specs) {
    const frame = find(spec.id)
    if (!frame) missing.push(spec.id)
    else if (frame.widget?.kind === "reel") reels.push(spec.id)
    else if (!clips.some((c) => c.id === spec.id)) {
      const clip = createClip(spec.id, spec.seconds)
      const t = spec.transition
      if (t.kind !== undefined) clip.transition.kind = t.kind
      if (t.seconds !== undefined) clip.transition.seconds = t.seconds
      if (t.cell !== undefined) clip.transition.cell = t.cell
      if (t.seed !== undefined) clip.transition.seed = t.seed
      if (spec.camera) clip.camera = spec.camera as never
      if (spec.callouts) clip.callouts = spec.callouts as never
      if ("chapter" in spec) clip.chapter = spec.chapter as never
      clips.push(clip)
    }
  }
  return { clips, missing, reels }
}

/** A screen's rows as a command spells them, built: every cell a registry
 * component with sanitized props and value; the names it could not place. */
export function screenRowsOf(v: unknown): { rows: ScreenRow[]; dropped: string[] } {
  const dropped: string[] = []
  const rows = (Array.isArray(v) ? v : []).filter(isPlain).map((r) => {
    const cells = (Array.isArray(r.cells) ? r.cells : []).filter(isPlain).flatMap((c) => {
      const entry = componentEntry(typeof c.is === "string" ? c.is : "")
      if (!entry) {
        dropped.push(String(c.is))
        return []
      }
      const cell = createCell(entry)
      cell.props = sanitizeComponentProps(entry, { ...cell.props, ...(isPlain(c.props) ? c.props : {}) })
      if (typeof c.slotText === "string") cell.slotText = c.slotText
      if ("value" in c) cell.model = sanitizeModel(entry, c.value)
      cell.grow = c.grow === true
      return [cell]
    })
    const row = createRow(cells)
    if (typeof r.gap === "number") row.gap = r.gap
    if (typeof r.align === "string") row.align = r.align as typeof row.align
    if (typeof r.justify === "string") row.justify = r.justify as typeof row.justify
    return row
  })
  return { rows, dropped }
}

/** The ids a command names (`ids`, else `id`); none means the selection's. */
export const namedIds = (cmd: Record<string, unknown>): string[] =>
  Array.isArray(cmd.ids)
    ? cmd.ids.filter((i): i is string => typeof i === "string")
    : typeof cmd.id === "string"
      ? [cmd.id]
      : []
