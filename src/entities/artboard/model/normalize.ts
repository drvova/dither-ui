import { createChart, createSeriesRow, defaultEasing, type ChartModel } from "@/entities/chart"
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
import { safeUrl } from "@/shared/lib/routes"
import type { BloomConfig, BloomLevel, TextureConfig, VariantInput } from "@dither-kit"
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

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

const clampNum = (v: unknown, lo: number, hi: number, def: number): number =>
  finite(v) ? Math.min(hi, Math.max(lo, v)) : def

/* The fields a value of several shapes may take: `fill` would reset any
 * shape but the factory default's, so each is parsed whole instead, every
 * shape the editors write kept and its numbers held in range. */

const BLENDS = ["plus-lighter", "screen", "lighten"] as const

/** A glow: a preset name, or a custom config. */
function glowOf(v: unknown, def: BloomLevel): BloomLevel | BloomConfig {
  if (!isPlainObject(v)) return oneOf(v, BLOOMS, def)
  return {
    blur: clampNum(v.blur, 0, 64, 3),
    brightness: clampNum(v.brightness, 0, 5, 1.35),
    opacity: clampNum(v.opacity, 0, 1, 0.7),
    ...(finite(v.saturate) && { saturate: clampNum(v.saturate, 0, 5, 1) }),
    ...(BLENDS.includes(v.blend as never) && { blend: v.blend as BloomConfig["blend"] }),
  }
}

const AREA_VARIANTS = ["gradient", "dotted", "hatched", "solid"] as const
const TEXTURE_UNITS = ["ramp", "density", "offTier", "edge", "alphaFloor", "alphaRange", "intensityLift"] as const

/** A series texture: a preset name, a seed, or a custom texture. */
function variantOf(v: unknown): VariantInput {
  if (finite(v)) return Math.round(v)
  if (!isPlainObject(v)) return oneOf(v, AREA_VARIANTS, "gradient")
  const t: TextureConfig = {}
  for (const k of TEXTURE_UNITS) if (finite(v[k])) t[k] = clampNum(v[k], 0, 2, 0)
  if (finite(v.hatch)) t.hatch = v.hatch < 2 ? 0 : Math.min(32, Math.round(v.hatch))
  if (typeof v.gaps === "boolean") t.gaps = v.gaps
  return t
}

const EASING_NAMES = ["linear", "ease-out", "ease-in-out"] as const

/** An easing: a preset name, a seed, or cubic-bezier points (x in 0-1, as
 * CSS has it; y free for overshoot within reason). */
function easingOf(v: unknown, type: ChartType): ChartModel["easing"] {
  if (finite(v)) return Math.round(v)
  if (Array.isArray(v) && v.length === 4 && v.every(finite))
    return [clampNum(v[0], 0, 1, 0), clampNum(v[1], -2, 3, 0), clampNum(v[2], 0, 1, 1), clampNum(v[3], -2, 3, 1)]
  return oneOf(v, EASING_NAMES, defaultEasing(type) as (typeof EASING_NAMES)[number])
}

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
    const { bloom, easing } = a.chart as { bloom?: unknown; easing?: unknown }
    fill(a.chart as unknown as Record<string, unknown>, {
      ...defaults,
      // arrays fill only when missing/mistyped — never overwrite data
      rows: defaults.rows,
      series: defaults.series,
    })
    // enum fields: a junk string is type-correct but still crashes downstream
    // (e.g. bloom preset lookup) — force onto the allowlists.
    a.chart.type = validType(a.chart.type)
    a.chart.bloom = glowOf(bloom, "low")
    a.chart.easing = easingOf(easing, a.chart.type)
    a.chart.stackType = oneOf(a.chart.stackType, STACKS, "default")
    // The optional seeds are numbers or absent, never a string to splice.
    if (a.chart.seed !== undefined && !finite(a.chart.seed)) delete a.chart.seed
    if (a.chart.effect !== undefined && !finite(a.chart.effect)) delete a.chart.effect
    for (const s of a.chart.series) {
      const variant: unknown = s.variant
      fill(
        s as unknown as Record<string, unknown>,
        createSeriesRow(
          typeof s.key === "string" ? s.key : "series",
          typeof s.label === "string" ? s.label : "Series",
          "blue",
        ) as unknown as Record<string, unknown>,
      )
      s.variant = variantOf(variant)
    }
  }

  // widget models
  const w = a.widget
  if (isPlainObject(w)) {
    if (w.kind === "avatar" || w.kind === "button" || w.kind === "gradient" || w.kind === "image") {
      const bloom: unknown = "bloom" in w ? w.bloom : undefined
      fill(w as unknown as Record<string, unknown>, createWidget(w.kind) as unknown as Record<string, unknown>)
      if (w.kind !== "image") w.bloom = finite(bloom) ? Math.round(bloom) : (glowOf(bloom, "off") as typeof w.bloom)
      // An image's address reaches an <img src>: a script URL never does.
      if (w.kind === "image" && !safeUrl(w.src)) w.src = ""
      if (w.kind === "avatar" && !safeUrl(w.imageSrc)) w.imageSrc = ""
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
