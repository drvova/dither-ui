import { createChart, createSeriesRow } from "@/entities/chart"
import {
  componentEntry,
  createWidget,
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

const validType = (t: unknown): ChartType =>
  CHART_TYPES.includes(t as ChartType) ? (t as ChartType) : "area"

const oneOf = <T extends string>(v: unknown, options: readonly T[], def: T): T =>
  options.includes(v as T) ? (v as T) : def

const ALIGNS = ["start", "center", "end", "stretch"] as const
const JUSTIFIES = ["start", "center", "end", "between"] as const

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
    if (typeof a.chart.bloom === "string")
      a.chart.bloom = oneOf(a.chart.bloom, BLOOMS, "low")
    a.chart.stackType = oneOf(a.chart.stackType, STACKS, "default")
    a.chart.type = validType(a.chart.type)
    for (const s of a.chart.series) {
      fill(
        s as unknown as Record<string, unknown>,
        createSeriesRow(
          typeof s.key === "string" ? s.key : "series",
          typeof s.label === "string" ? s.label : "Series",
          "blue"
        ) as unknown as Record<string, unknown>
      )
    }
  }

  // widget models
  const w = a.widget
  if (isPlainObject(w)) {
    if (w.kind === "avatar" || w.kind === "button" || w.kind === "gradient" || w.kind === "image") {
      fill(
        w as unknown as Record<string, unknown>,
        createWidget(w.kind) as unknown as Record<string, unknown>
      )
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
    } else {
      delete a.widget // unknown widget kind entirely
    }
  }
  return a
}
