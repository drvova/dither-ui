// The Studio agent protocol: one command vocabulary, three doors.
//
//   1. `window.ditherStudio.run(command)` — for code in the page's main
//      world (the agent panel, devtools, debugger-driven harnesses).
//   2. DOM events — for code in ANY world, including browser-extension
//      agents whose scripts cannot see page globals (sitegeist's
//      `browserjs()` runs in Chrome's USER_SCRIPT world): dispatch
//      `dither-studio:command` on `document` with a JSON STRING detail
//      `{ id, command }`; the page answers with `dither-studio:result`
//      carrying `{ id, ok, data | error }` as a JSON string. Strings cross
//      worlds; objects do not.
//   3. The document mirror — a `<script type="application/json"
//      id="dither-studio-document">` in <head> holding the live document,
//      refreshed on the autosave cadence, readable from any world.
//
// Every command is untrusted input. Documents go through the same
// envelope + field validation imports take (`applyDocument`), component
// props through the registry's `sanitizeComponentProps`, screens and
// charts through `normalizeArtboard`. Nothing here evaluates anything: an
// agent can only produce documents the inspector could have produced.
import { watch } from "vue"
import { directedTime, isDirected, release, seek } from "@dither-kit"
import { type Artboard, type ArtboardKind, createArtboard, normalizeArtboard } from "@/entities/artboard"
import { chartCode, createChart, createSeriesRow, LABEL_KEY } from "@/entities/chart"
import {
  addArtboard,
  addComponentArtboard,
  addReelArtboard,
  addScreenArtboard,
  editor,
  placeGeneration,
  removeArtboard,
  selectArtboard,
  selectMany,
} from "@/entities/editor"
import {
  COMPONENT_REGISTRY,
  componentEntry,
  createCell,
  createClip,
  createRow,
  type ReelClip,
  REEL_TRANSITIONS,
  type ReelTransitionKind,
  sanitizeComponentProps,
  widgetCode,
} from "@/entities/widget"
import { compositionHtml, defaultSeconds, normalizeVideoOptions, playerAssetUrls, reelClips, renderCommand, slugOf, videoFileName } from "@/features/export-video"
import { applyDocument, documentSnapshot, type StudioDocument } from "@/features/persistence"
import { CHART_TYPES, type ChartType, familyOf } from "@/shared/config"
import { evolveArtboard, type EvolveOptions } from "./evolve"

export const PROTOCOL_VERSION = 1
export const COMMAND_EVENT = "dither-studio:command"
export const RESULT_EVENT = "dither-studio:result"
export const MIRROR_ID = "dither-studio-document"
export const SITE = "https://dither-ui.com"

const WIDGET_KINDS = ["avatar", "button", "gradient", "image"] as const

export type ChartData = {
  labels: string[]
  series: { key: string; label?: string; color?: string; values: number[] }[]
}

/** One clip of a reel as a command spells it: a frame, how long it plays, how it comes in. */
export type ReelClipSpec = { id: string; seconds?: number; transition?: { kind?: ReelTransitionKind; seconds?: number; cell?: number; seed?: number } }

export type StudioCommand =
  | { type: "document.get" }
  | { type: "document.set"; document: unknown }
  | { type: "artboard.list" }
  | { type: "artboard.select"; id?: string; ids?: string[] }
  | { type: "artboard.remove"; id: string }
  | { type: "artboard.update"; id: string; patch: Record<string, unknown> }
  | { type: "chart.add"; chart: ChartType; name?: string; data?: ChartData; frame?: { w?: number; h?: number } }
  | { type: "widget.add"; widget: (typeof WIDGET_KINDS)[number]; name?: string; props?: Record<string, unknown> }
  | { type: "component.add"; is: string; name?: string; props?: Record<string, unknown>; slotText?: string; frame?: { w?: number; h?: number } }
  | {
      type: "screen.add"
      name?: string
      rows: { cells: { is: string; props?: Record<string, unknown>; slotText?: string; grow?: boolean }[]; align?: string; justify?: string; gap?: number }[]
      gap?: number
      padding?: number
      frame?: { w?: number; h?: number }
    }
  | { type: "reel.add"; name?: string; clips: (string | ReelClipSpec)[]; frame?: { w?: number; h?: number } }
  | { type: "evolve"; id?: string; count?: number; seed?: number; strength?: number }
  | { type: "code.get"; id: string }
  | { type: "registry.get"; is?: string }
  | { type: "video.export"; id?: string; seconds?: number; fps?: number; theme?: string }
  | { type: "clock.seek"; seconds?: number }
  | { type: "clock.release" }

export type CommandResult = { ok: true; data: unknown } | { ok: false; error: string }

const ok = (data: unknown): CommandResult => ({ ok: true, data })
const fail = (error: string): CommandResult => ({ ok: false, error })
const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const find = (id: string) => editor.artboards.find((a) => a.id === id)

/** A compact description of one artboard for listings. */
export function summarize(a: Artboard) {
  const kind = a.widget ? (a.widget.kind === "component" ? a.widget.is : a.widget.kind) : `${a.chart.type} chart`
  return { id: a.id, name: a.name, kind, x: a.x, y: a.y, w: a.w, h: a.h, hidden: a.hidden, locked: a.locked, selected: editor.selectedIds.includes(a.id) }
}

/** The machine-readable registry: every component the studio can place,
 * with its prop specs, plus the chart and widget kinds and the command
 * vocabulary. Served at /agent/registry.json by the build. */
export function registrySchema() {
  return {
    version: PROTOCOL_VERSION,
    site: SITE,
    skill: `${SITE}/agent/SKILL.md`,
    charts: CHART_TYPES,
    widgets: WIDGET_KINDS,
    components: COMPONENT_REGISTRY.map((e) => ({
      is: e.is,
      label: e.label,
      group: e.group,
      frame: e.frame,
      props: e.props.map((p) => ({ ...p })),
      slotText: e.slotText ?? null,
      vmodel: e.vmodel ? { default: e.vmodel.def } : null,
    })),
    document: {
      artboards: "Artboard[] — { id, name, x, y, w, h, hidden?, locked?, groupId?: null, chart: ChartModel, widget?: WidgetModel }",
      chart: "ChartModel — { type: charts[], rows: DataRow[], series: [{ key, label, color }], seed?, bloom: off|low|high|aura, stackType: default|stacked|percent, cell: 1..4 }",
      rows: { cartesian: "{ month: string, <seriesKey>: number }", pie: "{ name: string, value: number }", radar: "{ axis: string, <seriesKey>: number }" },
      widget: "WidgetModel — { kind: avatar|button|gradient|image } | { kind: component, is, props, slotText } | { kind: screen, rows: [{ cells: [{ is, props, slotText, grow }], align, justify, gap }], gap, padding } | { kind: reel, clips: [{ id, seconds, transition: { kind, seconds, cell, seed } }] }",
      groups: "Group[] — { id, name, collapsed }",
      viewport: "{ x, y, zoom }",
    },
    commands: {
      "document.get": "the live document",
      "document.set": "{ document } — replace the project (validated like a file import; undoable)",
      "artboard.list": "summaries of every frame",
      "artboard.select": "{ id } or { ids }",
      "artboard.remove": "{ id }",
      "artboard.update": "{ id, patch } — merge name/x/y/w/h/hidden/locked, chart fields, widget props, screen rows or reel clips; sanitized",
      "chart.add": "{ chart, name?, data?: { labels, series: [{ key, label?, color?, values }] }, frame? }",
      "widget.add": "{ widget: avatar|button|gradient|image, name?, props? }",
      "component.add": "{ is, name?, props?, slotText?, frame? } — a registry component",
      "screen.add": "{ name?, rows: [{ cells: [{ is, props?, slotText?, grow? }], align?, justify?, gap? }], gap?, padding?, frame? }",
      "reel.add": `{ name?, clips: [id | { id, seconds?, transition?: { kind?: ${REEL_TRANSITIONS.join("|")}, seconds?, cell?, seed? } }], frame? } — frames played in order with ordered-dither transitions (clip 3s, dissolve 0.6s by default); video.export renders the whole cut`,
      evolve: "{ id?, count?, seed?, strength? } — seeded variants placed as a row",
      "code.get": "{ id } — the frame as a Vue SFC",
      "registry.get": "{ is? } — this schema, or one component's entry",
      "video.export": "{ id?, seconds?, fps?: 24|30|60, theme? } — the frame as a HyperFrames composition: index (HTML referencing ./player.js and ./player.css) + the assets' URLs; write the three side by side and `npx hyperframes render`. A reel's seconds default to its length",
      "clock.seek": "{ seconds? } — hold every animation on the canvas at that moment (a stable screenshot from any driver in any browser); without seconds, let time run again",
      "clock.release": "let time run again",
    },
  }
}

function applyFrame(a: Artboard, frame?: { w?: number; h?: number }) {
  if (!frame) return
  if (typeof frame.w === "number" && Number.isFinite(frame.w)) a.w = Math.max(40, Math.min(4000, Math.round(frame.w)))
  if (typeof frame.h === "number" && Number.isFinite(frame.h)) a.h = Math.max(40, Math.min(4000, Math.round(frame.h)))
}

/** Build chart rows + series from the friendly `{ labels, series }` shape. */
export function chartFromData(type: ChartType, data: ChartData) {
  const chart = createChart(type)
  const family = familyOf(type)
  const labelKey = LABEL_KEY[family]
  const labels = (Array.isArray(data.labels) ? data.labels : []).map(String)
  const series = (Array.isArray(data.series) ? data.series : [])
    .filter((s) => isPlain(s) && typeof s.key === "string" && s.key && Array.isArray(s.values))
    .map((s) => ({ ...s, key: family === "pie" ? "value" : s.key.replace(/[^\w-]/g, "_") }))
  if (!labels.length || !series.length) return chart
  chart.rows = labels.map((label, i) => {
    const row: Record<string, string | number> = { [labelKey]: label }
    for (const s of series) {
      const v = Number(s.values[i])
      row[s.key] = Number.isFinite(v) ? v : 0
    }
    return row
  })
  const seen = new Set<string>()
  const palette = ["blue", "purple", "green", "orange", "pink", "red", "grey"]
  chart.series = series
    .filter((s) => !seen.has(s.key) && seen.add(s.key))
    .map((s, i) => createSeriesRow(s.key, typeof s.label === "string" ? s.label : s.key, typeof s.color === "string" ? s.color : palette[i % palette.length]))
  return chart
}

/** Clip specs (ids or { id, seconds?, transition? }) as reel clips, each frame once, with the ids a reel cannot hold. */
function buildClips(input: unknown) {
  const clips: ReelClip[] = []
  const missing: string[] = []
  const reels: string[] = []
  for (const raw of Array.isArray(input) ? input : []) {
    const spec = typeof raw === "string" ? { id: raw } : isPlain(raw) && typeof raw.id === "string" ? (raw as ReelClipSpec) : null
    if (!spec) continue
    const frame = find(spec.id)
    if (!frame) missing.push(spec.id)
    else if (frame.widget?.kind === "reel") reels.push(spec.id)
    else if (!clips.some((c) => c.id === spec.id)) {
      const clip = createClip(spec.id, typeof spec.seconds === "number" ? spec.seconds : undefined)
      const t = isPlain(spec.transition) ? spec.transition : {}
      if (typeof t.kind === "string") clip.transition.kind = t.kind as ReelTransitionKind
      if (typeof t.seconds === "number") clip.transition.seconds = t.seconds
      if (typeof t.cell === "number") clip.transition.cell = t.cell
      if (typeof t.seed === "number") clip.transition.seed = t.seed
      clips.push(clip)
    }
  }
  return { clips, missing, reels }
}

function buildScreen(cmd: Extract<StudioCommand, { type: "screen.add" }>) {
  const dropped: string[] = []
  const rows = (Array.isArray(cmd.rows) ? cmd.rows : []).filter(isPlain).map((r) => {
    const cells = (Array.isArray(r.cells) ? r.cells : []).filter(isPlain).flatMap((c) => {
      const entry = componentEntry(typeof c.is === "string" ? c.is : "")
      if (!entry) {
        dropped.push(String(c.is))
        return []
      }
      const cell = createCell(entry)
      cell.props = sanitizeComponentProps(entry, { ...cell.props, ...(isPlain(c.props) ? c.props : {}) })
      if (typeof c.slotText === "string") cell.slotText = c.slotText
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

/** Execute one command against the live editor. Never throws. */
export function runCommand(input: unknown): CommandResult {
  if (!isPlain(input) || typeof input.type !== "string") return fail("command must be an object with a string `type`")
  const cmd = input as StudioCommand
  try {
    switch (cmd.type) {
      case "document.get":
        return ok(documentSnapshot())
      case "document.set":
        return applyDocument(cmd.document, { keepHistory: true }) ? ok({ artboards: editor.artboards.map(summarize) }) : fail("document rejected: needs { artboards: [...] } with at least one artboard")
      case "artboard.list":
        return ok(editor.artboards.map(summarize))
      case "artboard.select": {
        const ids = Array.isArray(cmd.ids) ? cmd.ids.filter((i): i is string => typeof i === "string") : typeof cmd.id === "string" ? [cmd.id] : []
        const known = ids.filter(find)
        if (!known.length) return fail("no such artboard")
        if (known.length === 1) selectArtboard(known[0])
        else selectMany(known)
        return ok(known)
      }
      case "artboard.remove":
        if (!find(cmd.id)) return fail(`no artboard ${cmd.id}`)
        removeArtboard(cmd.id)
        return ok({ removed: cmd.id })
      case "artboard.update": {
        const a = find(cmd.id)
        if (!a) return fail(`no artboard ${cmd.id}`)
        if (!isPlain(cmd.patch)) return fail("patch must be an object")
        const p = cmd.patch
        if (typeof p.name === "string") a.name = p.name.slice(0, 80)
        for (const k of ["x", "y", "w", "h"] as const) if (typeof p[k] === "number" && Number.isFinite(p[k])) a[k] = Math.round(p[k] as number)
        if (typeof p.hidden === "boolean") a.hidden = p.hidden
        if (typeof p.locked === "boolean") a.locked = p.locked
        if (isPlain(p.chart) && !a.widget) Object.assign(a.chart, p.chart)
        if (isPlain(p.widget) && a.widget) {
          const w = a.widget as unknown as Record<string, unknown>
          const patch = p.widget
          if (a.widget.kind === "component" && isPlain(patch.props)) w.props = { ...(w.props as object), ...patch.props }
          else if (a.widget.kind === "screen" && Array.isArray(patch.rows)) {
            const built = buildScreen({ type: "screen.add", rows: patch.rows as never })
            w.rows = built.rows
          } else if (a.widget.kind === "reel" && Array.isArray(patch.clips)) w.clips = buildClips(patch.clips).clips
          else Object.assign(w, patch)
          if (typeof patch.slotText === "string") w.slotText = patch.slotText
        }
        normalizeArtboard(a)
        return ok(summarize(a))
      }
      case "chart.add": {
        if (!CHART_TYPES.includes(cmd.chart)) return fail(`chart must be one of ${CHART_TYPES.join(", ")}`)
        const a = createArtboard(cmd.chart)
        if (isPlain(cmd.data)) a.chart = chartFromData(cmd.chart, cmd.data as ChartData)
        if (typeof cmd.name === "string") a.name = cmd.name.slice(0, 80)
        applyFrame(a, cmd.frame)
        normalizeArtboard(a)
        placeGeneration([a], 0)
        return ok(summarize(a))
      }
      case "widget.add": {
        if (!WIDGET_KINDS.includes(cmd.widget)) return fail(`widget must be one of ${WIDGET_KINDS.join(", ")}`)
        const a = addArtboard(cmd.widget as ArtboardKind)
        if (typeof cmd.name === "string") a.name = cmd.name.slice(0, 80)
        if (isPlain(cmd.props) && a.widget) Object.assign(a.widget, cmd.props, { kind: a.widget.kind })
        normalizeArtboard(a)
        return ok(summarize(a))
      }
      case "component.add": {
        const entry = componentEntry(typeof cmd.is === "string" ? cmd.is : "")
        if (!entry) return fail(`unknown component ${String(cmd.is)} — see registry.get`)
        const a = addComponentArtboard(entry)
        if (typeof cmd.name === "string") a.name = cmd.name.slice(0, 80)
        if (a.widget?.kind === "component") {
          a.widget.props = sanitizeComponentProps(entry, { ...a.widget.props, ...(isPlain(cmd.props) ? cmd.props : {}) })
          if (typeof cmd.slotText === "string") a.widget.slotText = cmd.slotText
        }
        applyFrame(a, cmd.frame)
        return ok(summarize(a))
      }
      case "screen.add": {
        const built = buildScreen(cmd)
        if (!built.rows.some((r) => r.cells.length)) return fail(`screen has no placeable cells${built.dropped.length ? ` (unknown: ${built.dropped.join(", ")})` : ""}`)
        const a = addScreenArtboard()
        if (typeof cmd.name === "string") a.name = cmd.name.slice(0, 80)
        if (a.widget?.kind === "screen") {
          a.widget.rows = built.rows
          if (typeof cmd.gap === "number") a.widget.gap = cmd.gap
          if (typeof cmd.padding === "number") a.widget.padding = cmd.padding
        }
        applyFrame(a, cmd.frame)
        normalizeArtboard(a)
        return ok({ ...summarize(a), dropped: built.dropped })
      }
      case "reel.add": {
        const built = buildClips(cmd.clips)
        if (built.missing.length) return fail(`no artboard ${built.missing.join(", ")}`)
        if (built.reels.length) return fail(`a reel cannot clip a reel (${built.reels.join(", ")})`)
        if (!built.clips.length) return fail("clips must name at least one frame: [id | { id, seconds?, transition? }]")
        const a = addReelArtboard(built.clips.map((c) => c.id))
        if (typeof cmd.name === "string") a.name = cmd.name.slice(0, 80)
        if (a.widget?.kind === "reel") a.widget.clips = built.clips
        applyFrame(a, cmd.frame)
        normalizeArtboard(a)
        return ok({ ...summarize(a), clips: a.widget?.kind === "reel" ? a.widget.clips : [], seconds: defaultSeconds(a) })
      }
      case "evolve": {
        const id = typeof cmd.id === "string" ? cmd.id : editor.selectedArtboardId
        const parent = find(id)
        if (!parent) return fail("select an artboard or pass { id }")
        const opts: EvolveOptions = { count: cmd.count, seed: cmd.seed, strength: cmd.strength }
        const gen = placeGeneration(evolveArtboard(parent, opts))
        return ok(gen.map(summarize))
      }
      case "code.get": {
        const a = find(cmd.id)
        if (!a) return fail(`no artboard ${cmd.id}`)
        return ok({ id: a.id, code: a.widget ? widgetCode(a.widget, { w: a.w, h: a.h }) : chartCode(a.chart) })
      }
      case "video.export": {
        const a = find(typeof cmd.id === "string" ? cmd.id : editor.selectedArtboardId)
        if (!a) return fail("select an artboard or pass { id }")
        const options = normalizeVideoOptions({ ...cmd, seconds: cmd.seconds ?? defaultSeconds(a) })
        return ok({
          id: a.id,
          name: a.name,
          file: videoFileName(a),
          options,
          index: compositionHtml(a, options, { jsRef: "./player.js", cssRef: "./player.css" }, reelClips(a)),
          assets: playerAssetUrls(),
          render: renderCommand(a),
          note: `index.html + player.js + player.css in one directory: npx hyperframes render <dir> -o ${slugOf(a.name)}.mp4. Same seeds + time → same pixels; simulation backgrounds need --workers 1.`,
        })
      }
      case "clock.seek": {
        if (cmd.seconds === undefined || cmd.seconds === null) {
          release()
          return ok({ directed: false })
        }
        const s = Number(cmd.seconds)
        if (!Number.isFinite(s) || s < 0) return fail("seconds must be a non-negative number")
        seek(s * 1000)
        return ok({ directed: true, seconds: s })
      }
      case "clock.release":
        release()
        return ok({ directed: false })
      case "registry.get": {
        if (typeof cmd.is === "string") {
          const entry = registrySchema().components.find((c) => c.is === cmd.is)
          return entry ? ok(entry) : fail(`unknown component ${cmd.is}`)
        }
        return ok(registrySchema())
      }
      default:
        return fail(`unknown command type ${(cmd as { type: string }).type}`)
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e))
  }
}

/** The kit clock as any driver sees it: seconds in, a held moment out. */
export type StudioClockApi = {
  seek: (seconds: number) => void
  release: () => void
  directed: () => boolean
  /** The held moment in seconds, null while time runs. */
  time: () => number | null
}

export const clockApi = (): StudioClockApi => ({
  seek: (seconds) => seek(Math.max(0, Number(seconds) || 0) * 1000),
  release,
  directed: isDirected,
  time: () => {
    const ms = directedTime()
    return ms === null ? null : ms / 1000
  },
})

export type StudioAgentApi = {
  version: number
  run: (command: unknown) => CommandResult
  registry: () => ReturnType<typeof registrySchema>
  document: () => StudioDocument
  clock: StudioClockApi
}

declare global {
  interface Window {
    ditherStudio?: StudioAgentApi
  }
}

/** Open the three doors on the mounted studio. Returns the closer. */
export function installStudioAgentApi(): () => void {
  const onCommand = (e: Event) => {
    const raw = (e as CustomEvent).detail
    let msg: Record<string, unknown>
    try {
      const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : raw
      msg = isPlain(parsed) ? parsed : {}
    } catch {
      msg = {}
    }
    const command = isPlain(msg.command) ? msg.command : msg
    const result = runCommand(command)
    document.dispatchEvent(new CustomEvent(RESULT_EVENT, { detail: JSON.stringify({ id: msg.id ?? null, ...result }) }))
  }
  document.addEventListener(COMMAND_EVENT, onCommand)

  let mirror = document.getElementById(MIRROR_ID) as HTMLScriptElement | null
  if (!mirror) {
    mirror = document.createElement("script")
    mirror.type = "application/json"
    mirror.id = MIRROR_ID
    document.head.appendChild(mirror)
  }
  mirror.dataset.version = String(PROTOCOL_VERSION)
  const refresh = () => {
    mirror!.textContent = JSON.stringify(documentSnapshot())
  }
  refresh()
  let timer: ReturnType<typeof setTimeout> | undefined
  const stop = watch(
    () => [editor.artboards, editor.groups],
    () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 400)
    },
    { deep: true },
  )

  window.ditherStudio = { version: PROTOCOL_VERSION, run: runCommand, registry: registrySchema, document: documentSnapshot, clock: clockApi() }

  return () => {
    stop()
    clearTimeout(timer)
    document.removeEventListener(COMMAND_EVENT, onCommand)
    mirror?.remove()
    delete window.ditherStudio
  }
}
