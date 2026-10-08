// Keyframes in container units — the kit's property animation engine. A
// track is a list of keyframes over seconds (or percentages of a duration);
// every length keeps its CSS units through interpolation: "10cqw" to "30cqw"
// is "20cqw" halfway, "10px" to "50cqw" is a calc() of both, so a DOM or SVG
// layer's transform stays exactly relative to its query container at any
// size, and the same sample resolves to px against a measured box for a
// canvas painter. Clock-free and DOM-free like sequence.ts: a stage owns the
// time, a layer asks for the moment.

import { type EasingInput, resolveEasing } from "./dither-paint"
import type { Easing } from "./timing"

/** A query container's content box, px. */
export type CqBox = { width: number; height: number }
export const LENGTH_UNITS = ["px", "%", "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax", "vw", "vh", "vmin", "vmax", "em", "rem"] as const
export type LengthUnit = (typeof LENGTH_UNITS)[number]
/** A length as a sum of unit terms — what interpolation operates on. */
export type Terms = Partial<Record<LengthUnit, number>>
/** px (a number) or any CSS length, `calc()` sums included. */
export type Length = number | string
/** A named kit easing, bezier points, a seed, or any `Easing` function (`steps(4)` quantizes). */
export type KeyEasing = EasingInput | Easing

const UNITS = new Set<string>(LENGTH_UNITS)
const TOKEN = /([+-])?\s*((?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*([a-z%]*)/gi

/** A length as unit terms: numbers are px, strings any CSS length including a `calc()` sum; unknown units drop. */
export function parseLength(value: Length | null | undefined): Terms {
  if (value === null || value === undefined) return {}
  const terms: Terms = {}
  const add = (unit: LengthUnit, n: number) => {
    if (!Number.isFinite(n)) return
    const v = (terms[unit] ?? 0) + n
    if (v === 0) delete terms[unit]
    else terms[unit] = v
  }
  if (typeof value === "number") {
    add("px", value)
    return terms
  }
  const body = value.trim().replace(/^calc\((.*)\)$/i, "$1")
  TOKEN.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN.exec(body))) {
    const unit = (m[3] || "px").toLowerCase()
    if (UNITS.has(unit)) add(unit as LengthUnit, (m[1] === "-" ? -1 : 1) * parseFloat(m[2]))
  }
  return terms
}

export function lerpTerms(a: Terms, b: Terms, f: number): Terms {
  const out: Terms = {}
  for (const u of LENGTH_UNITS) {
    const av = a[u] ?? 0
    const bv = b[u] ?? 0
    const v = av + (bv - av) * f
    if (v !== 0) out[u] = v
  }
  return out
}

const fmt = (n: number): string => String(Math.round(n * 1000) / 1000)

/** Terms as CSS: one unit prints plain, several print a `calc()`. */
export function termsToCss(t: Terms): string {
  const parts = LENGTH_UNITS.filter((u) => t[u]).map((u) => `${fmt(t[u] as number)}${u}`)
  if (!parts.length) return "0px"
  if (parts.length === 1) return parts[0]
  return `calc(${parts.join(" + ").replace(/\+ -/g, "- ")})`
}

export type LengthEnv = { font?: number; viewport?: CqBox }

/** Terms as px against a box — container units from the box, percentages by `axis`,
 * viewport units from `env.viewport` (else the window), em/rem from `env.font` (else 16). */
export function termsToPx(t: Terms, box: CqBox, axis: "x" | "y" = "x", env: LengthEnv = {}): number {
  const w = box.width
  const h = box.height
  const vw = env.viewport?.width ?? (typeof window !== "undefined" ? window.innerWidth : w)
  const vh = env.viewport?.height ?? (typeof window !== "undefined" ? window.innerHeight : h)
  const font = env.font ?? 16
  return (
    (t.px ?? 0) +
    ((t["%"] ?? 0) / 100) * (axis === "x" ? w : h) +
    (((t.cqw ?? 0) + (t.cqi ?? 0)) * w) / 100 +
    (((t.cqh ?? 0) + (t.cqb ?? 0)) * h) / 100 +
    ((t.cqmin ?? 0) * Math.min(w, h)) / 100 +
    ((t.cqmax ?? 0) * Math.max(w, h)) / 100 +
    ((t.vw ?? 0) * vw) / 100 +
    ((t.vh ?? 0) * vh) / 100 +
    ((t.vmin ?? 0) * Math.min(vw, vh)) / 100 +
    ((t.vmax ?? 0) * Math.max(vw, vh)) / 100 +
    ((t.em ?? 0) + (t.rem ?? 0)) * font
  )
}

const ANGLE = /^\s*(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(deg|turn|rad|grad)?\s*$/i

/** An angle in degrees from a number or a CSS angle (deg, turn, rad, grad). */
export function parseAngle(value: Length | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const m = value ? ANGLE.exec(value) : null
  if (!m) return 0
  const n = parseFloat(m[1])
  switch ((m[2] ?? "deg").toLowerCase()) {
    case "turn":
      return n * 360
    case "rad":
      return (n * 180) / Math.PI
    case "grad":
      return n * 0.9
    default:
      return n
  }
}

// ---- tracks ----------------------------------------------------------------------

export type Keyframe = {
  /** Seconds, or a percentage of the duration ("50%"); unset keys spread evenly between their neighbours. */
  at?: number | string
  /** Easing of the segment this key starts. */
  easing?: KeyEasing
  x?: Length
  y?: Length
  rotate?: Length
  skewX?: Length
  skewY?: Length
  scale?: number
  scaleX?: number
  scaleY?: number
  opacity?: number
  /** Any other key: a number, an angle, or a length (its units kept) — read back through the sample. */
  [custom: string]: Length | KeyEasing | undefined
}

export type KeyframeTrack = {
  keyframes: Keyframe[]
  /** Seconds of one cycle; unset, the last key's `at` in seconds, else 1. */
  duration?: number
  /** Seconds before the first key (the first key holds until then). */
  delay?: number
  /** Cycles: a count, or true forever. */
  loop?: number | boolean
  /** Odd cycles run backwards. */
  yoyo?: boolean
  /** Easing between keys (a key's own `easing` wins for the segment it starts). */
  easing?: KeyEasing
}

export type KeyframeSample = {
  state: "before" | "active" | "done"
  /** Cycles completed. */
  cycle: number
  /** 0-1 inside the cycle (yoyo applied). */
  progress: number
  /** Length-valued properties (x, y and custom lengths) as unit terms. */
  lengths: Record<string, Terms>
  /** Number-valued properties: angles in degrees, scales, opacity, custom numbers. */
  numbers: Record<string, number>
}

type Key<V> = { at: number; value: V; easing: Easing }
type Prop = { kind: "length"; keys: Key<Terms>[] } | { kind: "number"; keys: Key<number>[] }
const COMPILED = Symbol("compiled-track")
export type CompiledTrack = { [COMPILED]: true; duration: number; delay: number; loop: number; yoyo: boolean; props: Map<string, Prop> }

const ANGLE_KEYS = new Set(["rotate", "skewX", "skewY"])
const NUMBER_KEYS = new Set(["scale", "scaleX", "scaleY", "opacity"])
const isCompiled = (t: KeyframeTrack | CompiledTrack): t is CompiledTrack => COMPILED in t

const easingOf = (e: KeyEasing | undefined): Easing => (typeof e === "function" ? e : e === undefined ? (p) => p : resolveEasing(e))

/** Resolve the keys' positions, 0-1, and each property's own key list — once per track. */
export function compileTrack(track: KeyframeTrack): CompiledTrack {
  const frames = Array.isArray(track.keyframes) ? track.keyframes : []
  let duration = track.duration && track.duration > 0 ? track.duration : 0
  if (!duration) {
    for (const k of frames) if (typeof k.at === "number" && k.at > duration) duration = k.at
    if (!duration) duration = 1
  }
  const at: (number | undefined)[] = frames.map((k) => {
    if (typeof k.at === "number") return Math.max(0, Math.min(1, k.at / duration))
    if (typeof k.at === "string" && /%\s*$/.test(k.at)) return Math.max(0, Math.min(1, parseFloat(k.at) / 100))
    return undefined
  })
  if (frames.length) {
    at[0] ??= 0
    if (frames.length > 1) at[frames.length - 1] ??= 1
    // CSS's rule: unplaced keys spread evenly between the placed neighbours.
    let i = 0
    while (i < at.length) {
      if (at[i] !== undefined) {
        i++
        continue
      }
      let j = i
      while (j < at.length && at[j] === undefined) j++
      const a = at[i - 1] as number
      const b = at[j] as number
      for (let k = i; k < j; k++) at[k] = a + ((b - a) * (k - i + 1)) / (j - i + 1)
      i = j
    }
  }
  const order = frames.map((_, i) => i).sort((p, q) => (at[p] as number) - (at[q] as number) || p - q)
  const trackEasing = easingOf(track.easing)
  const props = new Map<string, Prop>()
  for (const i of order) {
    const k = frames[i]
    const easing = k.easing === undefined ? trackEasing : easingOf(k.easing)
    for (const name of Object.keys(k)) {
      if (name === "at" || name === "easing") continue
      const raw = k[name]
      if (typeof raw !== "number" && typeof raw !== "string") continue
      const numeric = NUMBER_KEYS.has(name) || ANGLE_KEYS.has(name) || typeof raw === "number" || (ANGLE.test(raw) && /[a-z]/i.test(raw) && !UNITS.has(raw.replace(/[^a-z%]/gi, "").toLowerCase()))
      const pos = at[i] as number
      if (numeric && name !== "x" && name !== "y") {
        const value = ANGLE_KEYS.has(name) || typeof raw === "string" ? parseAngle(raw) : (raw as number)
        const prop = props.get(name) ?? { kind: "number", keys: [] }
        if (prop.kind === "number") {
          prop.keys.push({ at: pos, value: Number.isFinite(value) ? value : 0, easing })
          props.set(name, prop)
        }
      } else {
        const prop = props.get(name) ?? { kind: "length", keys: [] }
        if (prop.kind === "length") {
          prop.keys.push({ at: pos, value: parseLength(raw as Length), easing })
          props.set(name, prop)
        }
      }
    }
  }
  const loop = track.loop === true ? Infinity : typeof track.loop === "number" && track.loop > 0 ? track.loop : 1
  return { [COMPILED]: true, duration, delay: track.delay ?? 0, loop, yoyo: !!track.yoyo, props }
}

function at<V>(keys: Key<V>[], p: number, lerp: (a: V, b: V, f: number) => V): V {
  if (keys.length === 1 || p <= keys[0].at) return keys[0].value
  const last = keys[keys.length - 1]
  if (p >= last.at) return last.value
  let i = 0
  while (i + 1 < keys.length && keys[i + 1].at <= p) i++
  const a = keys[i]
  const b = keys[i + 1]
  const span = b.at - a.at
  return lerp(a.value, b.value, span > 0 ? a.easing((p - a.at) / span) : 1)
}

/** The track at `t` seconds: before its delay the first key holds, past its
 * last cycle the end holds (yoyo settles where an even cycle count lands),
 * `Infinity` is the settled end of any track. */
export function sampleKeyframes(input: KeyframeTrack | CompiledTrack, t: number): KeyframeSample {
  const c = isCompiled(input) ? input : compileTrack(input)
  const u = t - c.delay
  let state: KeyframeSample["state"]
  let cycle = 0
  let p = 0
  if (!(u >= 0)) state = "before"
  else if (u === Infinity) {
    state = "done"
    cycle = c.loop
    p = c.yoyo && (c.loop === Infinity || c.loop % 2 === 0) ? 0 : 1
  } else {
    const cycles = u / c.duration
    if (cycles >= c.loop) {
      state = "done"
      cycle = c.loop
      p = c.yoyo && c.loop % 2 === 0 ? 0 : 1
    } else {
      state = "active"
      cycle = Math.floor(cycles)
      p = cycles - cycle
      if (c.yoyo && cycle % 2 === 1) p = 1 - p
    }
  }
  const lengths: Record<string, Terms> = {}
  const numbers: Record<string, number> = {}
  for (const [name, prop] of c.props) {
    if (prop.kind === "length") lengths[name] = at(prop.keys, p, lerpTerms)
    else numbers[name] = at(prop.keys, p, (a, b, f) => a + (b - a) * f)
  }
  return { state, cycle, progress: p, lengths, numbers }
}

/** Vertical names resolve percentages against the height. */
const vertical = (name: string) => name === "y" || /[yY]$/.test(name) || /height|top|bottom/i.test(name)

/** Every property as a number: lengths in px against `box` (percentages by axis), angles in degrees. */
export function resolveSample(s: KeyframeSample, box: CqBox, env?: LengthEnv): Record<string, number> {
  const out: Record<string, number> = { ...s.numbers }
  for (const [name, terms] of Object.entries(s.lengths)) out[name] = termsToPx(terms, box, vertical(name) ? "y" : "x", env)
  return out
}

/** The sample's CSS transform — units kept (the browser measures the
 * container), or resolved to px when a `box` is given. */
export function keyframeTransform(s: KeyframeSample, box?: CqBox, env?: LengthEnv): string {
  const parts: string[] = []
  const x = s.lengths.x
  const y = s.lengths.y
  if (x || y) {
    const tx = box ? `${fmt(termsToPx(x ?? {}, box, "x", env))}px` : termsToCss(x ?? {})
    const ty = box ? `${fmt(termsToPx(y ?? {}, box, "y", env))}px` : termsToCss(y ?? {})
    parts.push(`translate(${tx}, ${ty})`)
  }
  if (s.numbers.rotate) parts.push(`rotate(${fmt(s.numbers.rotate)}deg)`)
  const sx = s.numbers.scaleX ?? s.numbers.scale
  const sy = s.numbers.scaleY ?? s.numbers.scale
  if (sx !== undefined || sy !== undefined) parts.push(`scale(${fmt(sx ?? 1)}, ${fmt(sy ?? 1)})`)
  if (s.numbers.skewX || s.numbers.skewY) parts.push(`skew(${fmt(s.numbers.skewX ?? 0)}deg, ${fmt(s.numbers.skewY ?? 0)}deg)`)
  return parts.join(" ") || "none"
}
