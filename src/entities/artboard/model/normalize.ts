import { createChart, createSeriesRow } from "@/entities/chart"
import {
  componentEntry,
  createWidget,
  REEL_TRANSITIONS,
  type ReelCallout,
  type ReelCameraKey,
  type ReelChapter,
  sanitizeComponentProps,
} from "@/entities/widget"
import { BLOOMS, CHART_TYPES, type ChartType, STACKS } from "@/shared/config"
import type { Artboard } from "./types"

/**
 * Documents outlive the model AND arrive from untrusted places (imported
 * files, tampered storage). Normalisation is therefore both migration and
 * sanitisation: missing fields fill from factory defaults, wrong-TYPED fields
 * are replaced (not trusted), dangerous keys are scrubbed, and registry
 * component props pass a deny-by-default whitelist before they ever reach a
 * v-bind sink.
 */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

// Own-keys that must never survive into merged/iterated state.
const BAD_KEYS = ["__proto__", "constructor", "prototype"]

/** Recursively delete dangerous own keys (JSON data — no cycles). */
function scrub(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) scrub(item)
    return
  }
  if (!isPlainObject(value)) return
  for (const bad of BAD_KEYS) {
    if (Object.prototype.hasOwnProperty.call(value, bad)) delete value[bad]
  }
  for (const v of Object.values(value)) scrub(v)
}

/** Fill missing keys from defaults AND replace wrong-typed values — a string
 * where a number belongs crashes `.toFixed()` renders just like a missing
 * field does. Matching plain objects recurse; arrays are kept only as arrays. */
function fill(target: Record<string, unknown>, defaults: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(defaults)) {
    if (v === undefined) continue
    const cur = target[k]
    const replace = () => {
      target[k] = JSON.parse(JSON.stringify(v))
    }
    if (cur === undefined) replace()
    else if (isPlainObject(v)) {
      if (isPlainObject(cur)) fill(cur, v)
      else replace()
    } else if (Array.isArray(v)) {
      if (!Array.isArray(cur)) replace()
    } else if (typeof cur !== typeof v) replace()
    else if (typeof cur === "number" && !Number.isFinite(cur)) replace()
  }
}

const validType = (t: unknown): ChartType => (CHART_TYPES.includes(t as ChartType) ? (t as ChartType) : "area")

const oneOf = <T extends string>(v: unknown, options: readonly T[], def: T): T =>
  options.includes(v as T) ? (v as T) : def

const ALIGNS = ["start", "center", "end", "stretch"] as const
const JUSTIFIES = ["start", "center", "end", "between"] as const

const clampNum = (v: unknown, lo: number, hi: number, def: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def

/** Plain text for a film's words: control characters out, trimmed, capped. */
const textOf = (v: unknown, max: number): string =>
  typeof v === "string"
    ? Array.from(v, (ch) => (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 ? " " : ch))
        .join("")
        .trim()
        .slice(0, max)
    : ""

/** At most 16 keys, each inside the frame and a sane zoom and lean, in time order. */
const cameraOf = (v: unknown): ReelCameraKey[] =>
  (Array.isArray(v) ? v : [])
    .filter(isPlainObject)
    .slice(0, 16)
    .map((k) => ({
      t: clampNum(k.t, 0, 1, 0),
      x: clampNum(k.x, 0, 1, 0.5),
      y: clampNum(k.y, 0, 1, 0.5),
      zoom: clampNum(k.zoom, 0.25, 8, 1),
      tilt: clampNum(k.tilt, -30, 30, 0),
    }))
    .sort((a, b) => a.t - b.t)

/** At most 8 callouts with a label, each up inside its clip. */
const calloutsOf = (v: unknown, seconds: number): ReelCallout[] =>
  (Array.isArray(v) ? v : [])
    .filter(isPlainObject)
    .slice(0, 8)
    .map((c) => {
      const from = clampNum(c.from, 0, seconds, 0)
      return {
        x: clampNum(c.x, 0, 1, 0.5),
        y: clampNum(c.y, 0, 1, 0.5),
        label: textOf(c.label, 48),
        note: textOf(c.note, 64),
        side: oneOf(c.side, ["left", "right"] as const, "right"),
        from,
        to: clampNum(c.to, from, seconds, seconds),
      }
    })
    .filter((c) => c.label)

/** A line (none without one) and at most four [figure, words] rows. */
function chapterOf(v: unknown): ReelChapter | null {
  if (!isPlainObject(v)) return null
  const line = textOf(v.line, 80)
  if (!line) return null
  const spec = (Array.isArray(v.spec) ? v.spec : [])
    .filter(Array.isArray)
    .slice(0, 4)
    .map((r): [string, string] => [textOf(r[0], 12), textOf(r[1], 32)])
    .filter(([fig, words]) => fig || words)
  return { line, spec }
}

/** Bring an artboard from any older schema — or an untrusted file — up to the
 * current shape, in place. */
export function normalizeArtboard(a: Artboard): Artboard {
  scrub(a)

  // frame-level fields
  fill(a as unknown as Record<string, unknown>, {
    hidden: false,
    locked: false,
    groupId: null,
  })

  // chart (widget frames keep a stub chart too)
  if (!isPlainObject(a.chart)) a.chart = createChart("area")
  else {
    const defaults = createChart(validType((a.chart as { type?: unknown }).type))
    fill(a.chart as unknown as Record<string, unknown>, {
      ...defaults,
      // arrays fill only when missing/mistyped — never overwrite data
      rows: defaults.rows,
      series: defaults.series,
    })
    // enum fields: a junk string is type-correct but still crashes downstream
    // (e.g. bloom preset lookup) — force onto the allowlists.
    if (typeof a.chart.bloom === "string") a.chart.bloom = oneOf(a.chart.bloom, BLOOMS, "low")
    a.chart.stackType = oneOf(a.chart.stackType, STACKS, "default")
    a.chart.type = validType(a.chart.type)
    for (const s of a.chart.series) {
      fill(
        s as unknown as Record<string, unknown>,
        createSeriesRow(
          typeof s.key === "string" ? s.key : "series",
          typeof s.label === "string" ? s.label : "Series",
          "blue",
        ) as unknown as Record<string, unknown>,
      )
    }
  }

  // widget models
  const w = a.widget
  if (isPlainObject(w)) {
    if (w.kind === "avatar" || w.kind === "button" || w.kind === "gradient" || w.kind === "image") {
      fill(w as unknown as Record<string, unknown>, createWidget(w.kind) as unknown as Record<string, unknown>)
    } else if (w.kind === "component") {
      const entry = componentEntry(typeof w.is === "string" ? w.is : "")
      if (!entry) {
        delete a.widget // unknown component: fall back to the stub chart frame
      } else {
        w.props = sanitizeComponentProps(entry, w.props)
        if (typeof w.slotText !== "string") w.slotText = entry.slotText ?? null
      }
    } else if (w.kind === "screen") {
      fill(w as unknown as Record<string, unknown>, { rows: [], gap: 16, padding: 20 })
      w.rows = (Array.isArray(w.rows) ? w.rows : []).filter(isPlainObject).map((row) => {
        const cells = (Array.isArray(row.cells) ? row.cells : [])
          .filter(isPlainObject)
          .filter((c) => componentEntry(typeof c.is === "string" ? (c.is as string) : "") !== undefined)
          .map((c) => {
            const entry = componentEntry(c.is as string)!
            return {
              id: typeof c.id === "string" ? c.id : `c${Math.random().toString(36).slice(2)}`,
              is: c.is as string,
              props: sanitizeComponentProps(entry, c.props),
              slotText: typeof c.slotText === "string" ? c.slotText : (entry.slotText ?? null),
              model: c.model,
              grow: c.grow === true,
            }
          })
        return {
          id: typeof row.id === "string" ? row.id : `r${Math.random().toString(36).slice(2)}`,
          cells,
          align: oneOf(row.align, ALIGNS, "center"),
          justify: oneOf(row.justify, JUSTIFIES, "start"),
          gap: typeof row.gap === "number" && Number.isFinite(row.gap) ? row.gap : 12,
        }
      }) as typeof w.rows
    } else if (w.kind === "reel") {
      fill(w as unknown as Record<string, unknown>, { clips: [] })
      const score: unknown = w.score
      w.score = isPlainObject(score) ? { seed: Math.round(clampNum(score.seed, 0, 2 ** 31 - 1, 1)) } : null
      w.clips = (Array.isArray(w.clips) ? w.clips : [])
        .filter(isPlainObject)
        .filter((c) => typeof c.id === "string" && c.id !== a.id)
        .map((c) => {
          const seconds = clampNum(c.seconds, 0.1, 600, 3)
          const t: Record<string, unknown> = isPlainObject(c.transition) ? c.transition : {}
          return {
            id: c.id as string,
            seconds,
            transition: {
              kind: oneOf(t.kind, REEL_TRANSITIONS, "dissolve"),
              seconds: clampNum(t.seconds, 0, seconds, 0.6),
              cell: Math.round(clampNum(t.cell, 1, 16, 4)),
              seed: typeof t.seed === "number" && Number.isFinite(t.seed) ? t.seed : null,
            },
            camera: cameraOf(c.camera),
            callouts: calloutsOf(c.callouts, seconds),
            chapter: chapterOf(c.chapter),
          }
        })
    } else {
      delete a.widget // unknown widget kind entirely
    }
  }
  return a
}
