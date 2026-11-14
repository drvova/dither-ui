// The Studio's commands: ONE table. Each row is one command, keyed by its
// `type`: `parse` reads the untrusted input once into the command (or the
// reason it is none; nothing changes before it succeeds), `run` does it
// against the live editor, `doc` is what the registry says of it, `skill`
// its row in the skill's table, and `tool` (when a harness should have it)
// the Studio action that runs it, with the step the composer shows.
// `runCommand` (`protocol.ts`), `registrySchema().commands`, `STUDIO_TOOLS`
// (`tools.ts`), the composer's `STEPS` and the command table of
// `public/agent/SKILL.md` are all read off it; a command added or removed
// here is a type error until its row is whole.
//
// Every command is untrusted input. Documents go through the same
// envelope + field validation imports take (`applyDocument`), component
// props through the registry's `sanitizeComponentProps`, screens and
// charts through `normalizeArtboard`. Nothing here evaluates anything: an
// agent can only produce documents the inspector could have produced.
import { modifyMutable, reconcile } from "solid-js/store"
import { type IconName, release, seek } from "@dither-ui/kit"
import { type Artboard, type ArtboardKind, createArtboard, normalizeArtboard } from "@/entities/artboard"
import { frameCode } from "@/entities/artboard/code"
import {
  actualSize,
  addArtboard,
  addComponentArtboard,
  addReelArtboard,
  addScreenArtboard,
  documentSnapshot,
  duplicateSelected,
  editor,
  fitAll,
  fitSelection,
  groupSelected,
  loadDocument,
  parseDocument,
  placeGeneration,
  removeArtboard,
  replay,
  selectArtboard,
  selectMany,
  ungroup,
  zoomIn,
  zoomOut,
  zoomTo,
} from "../../entities/editor"
import {
  COMPONENT_REGISTRY,
  componentEntry,
  isSimpleWidgetKind,
  modelOf,
  REEL_TRANSITIONS,
  type ReelScore,
  type ReelTransitionKind,
  sanitizeComponentProps,
  sanitizeModel,
  type ScreenRow,
  SIMPLE_WIDGET_KINDS,
  type SimpleWidgetKind,
} from "@/entities/widget"
import {
  compositionHtml,
  defaultSeconds,
  normalizeVideoOptions,
  playerAssetUrls,
  reelClips,
  renderCommand,
  scoreWav,
  slugOf,
  videoFileName,
} from "@/entities/video"
import { CHART_TYPES, type ChartType } from "@/shared/config"
import { bytesToBase64 } from "@/shared/lib/base64"
import { isStyling, type Styling, STYLINGS } from "../../shared/lib/restyle"
import { evolveArtboard } from "@/features/agent/evolve"
import {
  applyFrame,
  chartDataOf,
  chartFromData,
  type ClipSpec,
  clipSpecsOf,
  clipsOf,
  find,
  frameOf,
  isPlain,
  namedIds,
  nameOf,
  scoreOf,
  screenRowsOf,
  summarize,
} from "./fields"
import { inspectFrame } from "./inspect"

export const PROTOCOL_VERSION = 1
const SITE = "https://dither-ui.com"

/** Where `view` can look: every frame, the selection, a zoom step, 100%. */
const VIEW_TO = ["all", "selection", "in", "out", "actual"] as const
type ViewTo = (typeof VIEW_TO)[number]
const VIEW: Record<ViewTo, () => void> = {
  all: fitAll,
  selection: fitSelection,
  in: zoomIn,
  out: zoomOut,
  actual: actualSize,
}
/** A PNG export's pixel ratios. */
const PNG_SCALES = [1, 2, 3, 4] as const

/** One clip of a reel as a command spells it: a frame, how long it plays, how
 * it comes in, and the film over it (camera keys, callouts, a chapter). */
type ReelClipSpec = {
  id: string
  seconds?: number
  transition?: { kind?: ReelTransitionKind; seconds?: number; cell?: number; seed?: number }
  camera?: { t?: number; x?: number; y?: number; zoom?: number; tilt?: number }[]
  callouts?: {
    x?: number
    y?: number
    label: string
    note?: string
    side?: "left" | "right"
    from?: number
    to?: number
  }[]
  chapter?: { line: string; spec?: [string, string][] } | null
}
/** A reel's score as a command spells it: on, or on with a seed. */
type ScoreSpec = boolean | { seed?: number } | null

/** The commands as a caller writes them (the wire shape; every one is parsed
 * again where it enters). */
export type StudioCommand =
  | { type: "document.get" }
  | { type: "document.set"; document: unknown }
  | { type: "artboard.list" }
  | { type: "artboard.select"; id?: string; ids?: string[] }
  | { type: "artboard.remove"; id: string }
  | { type: "artboard.update"; id: string; patch: Record<string, unknown> }
  | {
      type: "chart.add"
      chart: ChartType
      name?: string
      data?: { labels: string[]; series: { key: string; label?: string; color?: string; values: number[] }[] }
      frame?: { w?: number; h?: number }
    }
  | { type: "widget.add"; widget: SimpleWidgetKind; name?: string; props?: Record<string, unknown> }
  | {
      type: "component.add"
      is: string
      name?: string
      props?: Record<string, unknown>
      slotText?: string
      value?: unknown
      frame?: { w?: number; h?: number }
    }
  | {
      type: "screen.add"
      name?: string
      rows: {
        cells: { is: string; props?: Record<string, unknown>; slotText?: string; value?: unknown; grow?: boolean }[]
        align?: string
        justify?: string
        gap?: number
      }[]
      gap?: number
      padding?: number
      frame?: { w?: number; h?: number }
    }
  | {
      type: "reel.add"
      name?: string
      clips: (string | ReelClipSpec)[]
      score?: ScoreSpec
      frame?: { w?: number; h?: number }
    }
  | { type: "evolve"; id?: string; count?: number; seed?: number; strength?: number }
  | { type: "artboard.duplicate"; id?: string; ids?: string[] }
  | { type: "group"; id?: string; ids?: string[]; name?: string }
  | { type: "ungroup"; id: string }
  | { type: "replay" }
  | { type: "view"; to?: ViewTo; zoom?: number; id?: string }
  | { type: "image.export"; id?: string; scale?: number }
  | { type: "inspect"; id?: string }
  | { type: "code.get"; id: string; styling?: Styling }
  | { type: "registry.get"; is?: string; brief?: boolean }
  | { type: "video.export"; id?: string; seconds?: number; fps?: number; theme?: string }
  | { type: "clock.seek"; seconds?: number }
  | { type: "clock.release" }
export type CommandType = StudioCommand["type"]

export type CommandResult = { ok: true; data: unknown } | { ok: false; error: string }
export type ToolDef = { name: string; description: string; parameters: Record<string, unknown> }
/** A tool call as the composer shows it: its verb once done, the words when
 * the harness asks to run it, its glyph, and whether it edits the canvas. */
export type ToolStep = { verb: string; ask: string; icon: IconName; mutates: boolean }
/** A command as a Studio action: its definition for the harness, arguments
 * it always sends (`preset`, under the harness's own), its step. */
type CommandTool = { def: ToolDef; preset?: Record<string, unknown>; step: ToolStep }

type Raw = Record<string, unknown>
/** Why a command's input is none. */
type Refusal = { refused: string }
type Spec<C> = {
  parse: (raw: Raw) => C | Refusal
  run: (cmd: C) => CommandResult
  doc: string
  skill: string
  tool?: CommandTool
}
/** A row of the table: its parse and run as one call, and what is said of it. */
type CommandRow = {
  exec: (raw: Raw) => CommandResult
  doc: string
  skill: string
  tool?: CommandTool
}

const ok = (data: unknown): CommandResult => ({ ok: true, data })
const fail = (error: string): CommandResult => ({ ok: false, error })
const refuse = (refused: string): Refusal => ({ refused })
const refused = (v: object): v is Refusal => "refused" in v

/** A row: nothing runs until the input parses. */
function command<C extends object>({ parse, run, ...about }: Spec<C>): CommandRow {
  return {
    ...about,
    exec: (raw) => {
      const cmd = parse(raw)
      return refused(cmd) ? fail(cmd.refused) : run(cmd)
    },
  }
}

const none = () => ({})
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: true,
})
const str = (description: string) => ({ type: "string", description })
const num = (description: string) => ({ type: "number", description })
const ids = { type: "array", items: { type: "string" } }
const frameParam = obj({ w: num("width"), h: num("height") })
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
const optionalNumber = (v: unknown) => (finite(v) ? v : undefined)
/** The frame a command names, else the selected one. */
const targetOf = (raw: Raw) => (typeof raw.id === "string" ? raw.id : undefined)
const target = (id: string | undefined) => find(id ?? editor.selectedArtboardId)

/** Select the frames a command names (the selection when it names none);
 * the reason it cannot, or null. */
function selectNamed(named: string[]): string | null {
  const ids = named.length ? named : [...editor.selectedIds]
  const missing = ids.filter((i) => !find(i))
  if (missing.length) return `no artboard ${missing.join(", ")}`
  if (!ids.length) return "select frames or pass { id } or { ids }"
  selectMany(ids)
  return null
}
const selectedSummaries = () => editor.selectedIds.map((i) => summarize(find(i)!))

/* ------------------------------ artboard.update -------------------------- */

/** What `artboard.update` patches on the frame itself. */
const PATCH_KEYS = ["name", "x", "y", "w", "h", "hidden", "locked", "chart", "widget"] as const
/** What a patch's `widget` takes, by what the frame shows; a bespoke
 * widget (avatar, button, gradient, image) takes its own model's fields. */
const WIDGET_TAKES = {
  component: ["props", "value", "slotText"],
  screen: ["rows", "gap", "padding"],
  reel: ["clips", "score"],
} as const

/** A patch's `widget`, parsed: what it sets, by the field it came in. */
type WidgetPatch = {
  sent: Raw
  props?: Raw
  value?: { value: unknown }
  slotText?: string
  rows?: ScreenRow[]
  gap?: number
  padding?: number
  clips?: ClipSpec[]
  score?: { score: ReelScore | null }
}
type FramePatch = {
  name?: string
  x?: number
  y?: number
  w?: number
  h?: number
  hidden?: boolean
  locked?: boolean
  chart?: Raw
  widget?: WidgetPatch
}

function widgetPatchOf(w: Raw): WidgetPatch | Refusal {
  const patch: WidgetPatch = { sent: w }
  if ("props" in w) {
    if (!isPlain(w.props)) return refuse("patch.widget.props must be an object")
    patch.props = w.props
  }
  if ("value" in w) patch.value = { value: w.value }
  if ("slotText" in w) {
    if (typeof w.slotText !== "string") return refuse("patch.widget.slotText must be a string")
    patch.slotText = w.slotText
  }
  if ("rows" in w) {
    if (!Array.isArray(w.rows)) return refuse("patch.widget.rows must be an array of rows")
    patch.rows = screenRowsOf(w.rows).rows
  }
  for (const k of ["gap", "padding"] as const)
    if (k in w) {
      if (!finite(w[k])) return refuse(`patch.widget.${k} must be a number`)
      patch[k] = w[k]
    }
  if ("clips" in w) {
    if (!Array.isArray(w.clips)) return refuse("patch.widget.clips must be an array of clips")
    patch.clips = clipSpecsOf(w.clips)
  }
  if ("score" in w) patch.score = { score: scoreOf(w.score) }
  return patch
}

function framePatchOf(p: Raw): FramePatch | Refusal {
  // A key it does not know fails here, before anything changes: an agent
  // that put a screen's rows beside `widget` is told so, never answered
  // "ok" for a change that did not happen.
  const unknown = Object.keys(p).filter((k) => !PATCH_KEYS.includes(k as never))
  if (unknown.length)
    return refuse(
      `patch does not take ${unknown.join(", ")}; it takes ${PATCH_KEYS.join(", ")}, and what the frame shows (a component's props or value, a screen's rows, a reel's clips) goes under widget`,
    )
  const patch: FramePatch = {}
  if ("name" in p) {
    if (typeof p.name !== "string") return refuse("patch.name must be a string")
    patch.name = nameOf(p.name)
  }
  for (const k of ["x", "y", "w", "h"] as const)
    if (k in p) {
      if (!finite(p[k])) return refuse(`patch.${k} must be a number`)
      patch[k] = Math.round(p[k])
    }
  for (const k of ["hidden", "locked"] as const)
    if (k in p) {
      if (typeof p[k] !== "boolean") return refuse(`patch.${k} must be true or false`)
      patch[k] = p[k]
    }
  if ("chart" in p) {
    if (!isPlain(p.chart)) return refuse("patch.chart must be an object")
    patch.chart = p.chart
  }
  if ("widget" in p) {
    if (!isPlain(p.widget)) return refuse("patch.widget must be an object")
    const widget = widgetPatchOf(p.widget)
    if (refused(widget)) return widget
    patch.widget = widget
  }
  return patch
}

/** A frame's widget with a patch applied: the frame's copy is changed, or
 * the reason the patch does not fit what it shows. */
function patchWidget(next: Artboard, patch: WidgetPatch): string | null {
  const w = next.widget
  if (!w) return `${next.name} is a chart: patch it under chart`
  const own = w as unknown as Raw
  // What a frame is never changes under a patch: another kind is a new frame.
  for (const k of ["kind", "is"] as const)
    if (k in patch.sent && k in own && patch.sent[k] !== own[k])
      return `patch.widget.${k} is ${String(own[k])}: a frame keeps what it is; add a new frame for another`
  const sent = Object.keys(patch.sent).filter((k) => !(k in own && (k === "kind" || k === "is")))
  if (w.kind === "component" || w.kind === "screen" || w.kind === "reel") {
    const takes: readonly string[] = WIDGET_TAKES[w.kind]
    const others = sent.filter((k) => !takes.includes(k))
    if (others.length)
      return `patch.widget does not take ${others.join(", ")} for a ${w.kind}; it takes ${takes.join(", ")}`
  }
  if (w.kind === "component") {
    if (patch.props) w.props = { ...w.props, ...patch.props }
    const entry = componentEntry(w.is)
    if (patch.value && entry) w.model = sanitizeModel(entry, patch.value.value)
    if (patch.slotText !== undefined) w.slotText = patch.slotText
  } else if (w.kind === "screen") {
    if (patch.rows) w.rows = patch.rows
    if (patch.gap !== undefined) w.gap = patch.gap
    if (patch.padding !== undefined) w.padding = patch.padding
  } else if (w.kind === "reel") {
    if (patch.clips) w.clips = clipsOf(patch.clips).clips
    if (patch.score) w.score = patch.score.score
  } else for (const k of sent) own[k] = patch.sent[k]
  return null
}

/* --------------------------------- the table ----------------------------- */

/** Every command, in the order a harness reads the actions. */
export const COMMANDS = {
  "artboard.list": command({
    parse: none,
    run: () => ok(editor.artboards.map(summarize)),
    doc: "summaries of every frame (id, name, kind, x, y, w, h, hidden, locked, group, selected)",
    skill: "—",
    tool: {
      def: {
        name: "list_artboards",
        description: "List every frame on the canvas with id, name, kind, position and size.",
        parameters: obj({}),
      },
      step: { verb: "Listed the frames", ask: "List the frames on the canvas", icon: "Layers", mutates: false },
    },
  }),
  "registry.get": command({
    parse: (raw) => ({ is: typeof raw.is === "string" ? raw.is : undefined, brief: !!raw.brief }),
    run: (cmd) => {
      const schema = registrySchema()
      if (cmd.is !== undefined) {
        const entry = schema.components.find((c) => c.is === cmd.is)
        return entry ? ok(entry) : fail(`unknown component ${cmd.is}`)
      }
      // Brief: the names to ask about, small enough for a harness to read
      // in one answer (the full specs run past 100 kB).
      return ok(
        cmd.brief
          ? { ...schema, components: schema.components.map(({ is, label, group }) => ({ is, label, group })) }
          : schema,
      )
    },
    doc: "{ is?, brief? } — this schema (brief: each component's name, label and group, no prop specs), or one component's entry",
    skill: "`is?`, `brief?` — the registry (`brief`: names, labels and groups only), or one component",
    tool: {
      def: {
        name: "get_registry",
        description:
          "The component registry. Pass `is` for one component's full prop specs; omit it for the names of every component.",
        parameters: obj({ is: str("registry component name, e.g. DitherTabs") }),
      },
      preset: { brief: true },
      step: { verb: "Read the registry", ask: "Read the component registry", icon: "Book", mutates: false },
    },
  }),
  "screen.add": command({
    parse: (raw) => {
      const built = screenRowsOf(raw.rows)
      if (!built.rows.some((r) => r.cells.length))
        return refuse(
          `screen has no placeable cells${built.dropped.length ? ` (unknown: ${built.dropped.join(", ")})` : ""}`,
        )
      return {
        ...built,
        name: nameOf(raw.name),
        gap: typeof raw.gap === "number" ? raw.gap : undefined,
        padding: typeof raw.padding === "number" ? raw.padding : undefined,
        frame: frameOf(raw.frame),
      }
    },
    run: (cmd) => {
      const a = addScreenArtboard()
      if (cmd.name !== undefined) a.name = cmd.name
      if (a.widget?.kind === "screen") {
        a.widget.rows = cmd.rows
        if (cmd.gap !== undefined) a.widget.gap = cmd.gap
        if (cmd.padding !== undefined) a.widget.padding = cmd.padding
      }
      applyFrame(a, cmd.frame)
      normalizeArtboard(a)
      return ok({ ...summarize(a), dropped: cmd.dropped })
    },
    doc: "{ name?, rows: [{ cells: [{ is, props?, slotText?, value?, grow? }], align?, justify?, gap? }], gap?, padding?, frame? }",
    skill: "`name?`, `rows`, `gap?`, `padding?`, `frame?`",
    tool: {
      def: {
        name: "add_screen",
        description:
          'Add a composed screen: rows of registry components (one nesting level). Each cell: { is, props?, slotText?, value?, grow? }; value is the value it binds (a field\'s text: "" shows its placeholder). Row: { cells, align?, justify?, gap? }.',
        parameters: obj(
          {
            name: str("frame name"),
            rows: {
              type: "array",
              items: obj({ cells: { type: "array", items: obj({ is: str("registry name") }, ["is"]) } }, ["cells"]),
            },
            gap: num("row gap px"),
            padding: num("padding px"),
            frame: frameParam,
          },
          ["rows"],
        ),
      },
      step: { verb: "Added the screen", ask: "Add a screen to the canvas", icon: "Layout", mutates: true },
    },
  }),
  "component.add": command({
    parse: (raw) => {
      const entry = componentEntry(typeof raw.is === "string" ? raw.is : "")
      if (!entry) return refuse(`unknown component ${String(raw.is)} — see registry.get`)
      return {
        entry,
        name: nameOf(raw.name),
        props: isPlain(raw.props) ? raw.props : {},
        slotText: typeof raw.slotText === "string" ? raw.slotText : undefined,
        value: "value" in raw ? { value: raw.value } : undefined,
        frame: frameOf(raw.frame),
      }
    },
    run: (cmd) => {
      const a = addComponentArtboard(cmd.entry)
      if (cmd.name !== undefined) a.name = cmd.name
      if (a.widget?.kind === "component") {
        a.widget.props = sanitizeComponentProps(cmd.entry, { ...a.widget.props, ...cmd.props })
        if (cmd.slotText !== undefined) a.widget.slotText = cmd.slotText
        if (cmd.value) a.widget.model = sanitizeModel(cmd.entry, cmd.value.value)
      }
      applyFrame(a, cmd.frame)
      return ok(summarize(a))
    },
    doc: "{ is, name?, props?, slotText?, value?, frame? } — a registry component; value is the value it binds (a field's text, a toggle's state), checked against its default's kind (an empty string shows a field's placeholder)",
    skill:
      "`is`, `name?`, `props?`, `slotText?`, `value?`, `frame?` — `value` is what a control holds (a field's text, the chips' pick), in the kind its `registry.get` row gives; `\"\"` clears a field",
    tool: {
      def: {
        name: "add_component",
        description: "Add one registry component as its own frame.",
        parameters: obj(
          {
            is: str("registry name"),
            name: str("frame name"),
            props: obj({}),
            slotText: str("visible text for slot components"),
            value: {
              description: "the value it binds (a field's text, a switch's state); \"\" shows a field's placeholder",
            },
            frame: frameParam,
          },
          ["is"],
        ),
      },
      step: { verb: "Added", ask: "Add a component to the canvas", icon: "Box", mutates: true },
    },
  }),
  "chart.add": command({
    parse: (raw) => {
      if (!CHART_TYPES.includes(raw.chart as ChartType)) return refuse(`chart must be one of ${CHART_TYPES.join(", ")}`)
      return {
        chart: raw.chart as ChartType,
        data: isPlain(raw.data) ? chartDataOf(raw.data) : undefined,
        name: nameOf(raw.name),
        frame: frameOf(raw.frame),
      }
    },
    run: (cmd) => {
      const a = createArtboard(cmd.chart)
      if (cmd.data) a.chart = chartFromData(cmd.chart, cmd.data)
      if (cmd.name !== undefined) a.name = cmd.name
      applyFrame(a, cmd.frame)
      normalizeArtboard(a)
      placeGeneration([a], 0)
      return ok(summarize(a))
    },
    doc: "{ chart, name?, data?: { labels, series: [{ key, label?, color?, values }] }, frame? }",
    skill: "`chart`, `name?`, `data?: { labels, series: [{ key, label?, color?, values }] }`, `frame?`",
    tool: {
      def: {
        name: "add_chart",
        description: "Add a chart. data: { labels: string[], series: [{ key, label?, color?, values: number[] }] }.",
        parameters: obj(
          {
            chart: { type: "string", enum: ["area", "line", "bar", "pie", "radar"] },
            name: str("frame name"),
            data: obj({
              labels: { type: "array", items: { type: "string" } },
              series: {
                type: "array",
                items: obj({ key: str("series key"), values: { type: "array", items: { type: "number" } } }, [
                  "key",
                  "values",
                ]),
              },
            }),
            frame: frameParam,
          },
          ["chart"],
        ),
      },
      step: { verb: "Added the chart", ask: "Add a chart to the canvas", icon: "ChartLine", mutates: true },
    },
  }),
  "widget.add": command({
    parse: (raw) => {
      if (typeof raw.widget !== "string" || !isSimpleWidgetKind(raw.widget))
        return refuse(`widget must be one of ${SIMPLE_WIDGET_KINDS.join(", ")}`)
      return { widget: raw.widget, name: nameOf(raw.name), props: isPlain(raw.props) ? raw.props : {} }
    },
    run: (cmd) => {
      const a = addArtboard(cmd.widget as ArtboardKind)
      if (cmd.name !== undefined) a.name = cmd.name
      if (a.widget) Object.assign(a.widget, cmd.props, { kind: a.widget.kind })
      normalizeArtboard(a)
      return ok(summarize(a))
    },
    doc: "{ widget: avatar|button|gradient|image, name?, props? }",
    skill: "`widget` (avatar/button/gradient/image), `name?`, `props?`",
    tool: {
      def: {
        name: "add_widget",
        description:
          "Add a bespoke widget: avatar, button, gradient or image, with optional model props (button: label, color, variant; avatar: name, grid; gradient: from, to, direction; image: src, alt).",
        parameters: obj(
          {
            widget: { type: "string", enum: [...SIMPLE_WIDGET_KINDS] },
            name: str("frame name"),
            props: obj({}),
          },
          ["widget"],
        ),
      },
      step: { verb: "Added", ask: "Add a widget to the canvas", icon: "Sparkles", mutates: true },
    },
  }),
  "reel.add": command({
    parse: (raw) => {
      const clips = clipSpecsOf(raw.clips)
      if (!clips.length) return refuse("clips must name at least one frame: [id | { id, seconds?, transition? }]")
      return { clips, name: nameOf(raw.name), score: scoreOf(raw.score), frame: frameOf(raw.frame) }
    },
    run: (cmd) => {
      const built = clipsOf(cmd.clips)
      if (built.missing.length) return fail(`no artboard ${built.missing.join(", ")}`)
      if (built.reels.length) return fail(`a reel cannot clip a reel (${built.reels.join(", ")})`)
      const a = addReelArtboard(built.clips.map((c) => c.id))
      if (cmd.name !== undefined) a.name = cmd.name
      if (a.widget?.kind === "reel") {
        a.widget.clips = built.clips
        a.widget.score = cmd.score
      }
      applyFrame(a, cmd.frame)
      normalizeArtboard(a)
      return ok({
        ...summarize(a),
        clips: a.widget?.kind === "reel" ? a.widget.clips : [],
        score: a.widget?.kind === "reel" ? a.widget.score : null,
        seconds: defaultSeconds(a),
      })
    },
    doc: `{ name?, clips: [id | { id, seconds?, transition?: { kind?: ${REEL_TRANSITIONS.join("|")}, seconds?, cell?, seed? }, camera?: [{ t: 0-1 of the clip, x, y: the frame point looked at (0-1), zoom: 1 fitted, tilt: degrees }], callouts?: [{ x, y: a frame point (0-1), label, note?, side?: left|right, from?, to?: seconds into the clip }], chapter?: { line, spec?: [[figure, words]] } }], score?: true | { seed }, frame? } — frames played in order with ordered-dither transitions (clip 3s, dissolve 0.6s by default); a film when clips carry camera moves, callouts and chapters (a band under the stage), with a score synthesized from the cut; video.export renders the whole cut with its score`,
    skill: `\`name?\`, \`clips\` (ids, or \`{ id, seconds?, transition?: { kind, seconds?, cell?, seed? }, camera?, callouts?, chapter? }\` — kinds ${REEL_TRANSITIONS.map((k) => `\`${k}\``).join(", ")}; 3s clips in over a 0.6s dissolve by default), \`score?\` (\`true\` or \`{ seed }\`), \`frame?\` — frames played in order with ordered-dither transitions; a film with camera moves, callouts, chapters and a score (see below)`,
    tool: {
      def: {
        name: "add_reel",
        description:
          "Cut frames into a reel: a frame that plays other frames in order with ordered-dither transitions and exports as one video. Clips are ids or { id, seconds?, transition?, camera?, callouts?, chapter? } (3s clips coming in over a 0.6s dissolve by default). Make it a film: camera keys move each clip (t is 0-1 of the clip; x, y the frame point looked at, 0-1; zoom 1 is the frame fitted; tilt in degrees), callouts point at frame points with a label and a note, a chapter sets the band's line and figure-first spec rows from that clip on, and score: true (or { seed }) synthesizes a soundtrack from the cut that the video export carries.",
        parameters: obj(
          {
            name: str("frame name"),
            clips: {
              type: "array",
              items: {
                anyOf: [
                  str("artboard id"),
                  obj(
                    {
                      id: str("artboard id"),
                      seconds: num("clip length in seconds, 0.1–600"),
                      transition: obj({
                        kind: { type: "string", enum: [...REEL_TRANSITIONS] },
                        seconds: num("transition length in seconds"),
                        cell: num("dither cell size in px, 1–16"),
                        seed: num("a seeded dither matrix instead of the Bayer order"),
                      }),
                      camera: {
                        type: "array",
                        description: "camera keys, eased between; none holds the frame fitted",
                        items: obj({
                          t: num("when, 0–1 of the clip"),
                          x: num("the frame point looked at, 0–1 across"),
                          y: num("the frame point looked at, 0–1 down"),
                          zoom: num("1 is the frame fitted, up to 8"),
                          tilt: num("lean about the vertical in degrees, ±30"),
                        }),
                      },
                      callouts: {
                        type: "array",
                        description: "spec callouts on leaders, at most 8",
                        items: obj(
                          {
                            x: num("the frame point, 0–1 across"),
                            y: num("the frame point, 0–1 down"),
                            label: str("the label, up to 48 characters"),
                            note: str("a note under it, up to 64 characters"),
                            side: { type: "string", enum: ["left", "right"] },
                            from: num("seconds into the clip it draws in"),
                            to: num("seconds into the clip it fades by"),
                          },
                          ["label"],
                        ),
                      },
                      chapter: obj(
                        {
                          line: str("the band's line from this clip on, up to 80 characters"),
                          spec: {
                            type: "array",
                            description: "up to 4 [figure, words] rows, the figure first",
                            items: { type: "array", items: { type: "string" } },
                          },
                        },
                        ["line"],
                      ),
                    },
                    ["id"],
                  ),
                ],
              },
            },
            score: {
              anyOf: [{ type: "boolean" }, obj({ seed: num("the score's seed: another seed, another arrangement") })],
            },
            frame: frameParam,
          },
          ["clips"],
        ),
      },
      step: { verb: "Cut the reel", ask: "Cut a reel on the canvas", icon: "Film", mutates: true },
    },
  }),
  "artboard.update": command({
    parse: (raw) => {
      if (typeof raw.id !== "string") return refuse(`no artboard ${String(raw.id)}`)
      if (!isPlain(raw.patch)) return refuse("patch must be an object")
      const patch = framePatchOf(raw.patch)
      return refused(patch) ? patch : { id: raw.id, patch }
    },
    run: ({ id, patch: p }) => {
      const a = find(id)
      if (!a) return fail(`no artboard ${id}`)
      if (p.chart && a.widget) return fail(`${a.name} shows a ${a.widget.kind}: patch it under widget, not chart`)
      // The patch lands on a copy, normalized whole; the frame takes it
      // only then, so a patch that does not fit changes nothing.
      const next = JSON.parse(JSON.stringify(a)) as Artboard
      if (p.name !== undefined) next.name = p.name
      for (const k of ["x", "y", "w", "h"] as const) if (p[k] !== undefined) next[k] = p[k]
      if (p.hidden !== undefined) next.hidden = p.hidden
      if (p.locked !== undefined) next.locked = p.locked
      if (p.chart) Object.assign(next.chart, p.chart)
      if (p.widget) {
        const misfit = patchWidget(next, p.widget)
        if (misfit) return fail(misfit)
      }
      normalizeArtboard(next)
      modifyMutable(a, reconcile(next))
      return ok(summarize(a))
    },
    doc: "{ id, patch } — merge name/x/y/w/h/hidden/locked, `chart` fields, and under `widget`: a component's props or value, a screen's rows, a reel's clips and score; sanitized; a key it does not know fails the call",
    skill:
      "`id`, `patch` (name/x/y/w/h/hidden/locked, `chart` fields, `widget.props`, `widget.value`, `widget.rows` or `widget.clips`; a key it does not know fails the call, nothing changed)",
    tool: {
      def: {
        name: "update_artboard",
        description:
          "Patch a frame: name, x, y, w, h, hidden, locked; `chart` fields (seed, bloom, cell, stackType, series…); what it shows goes under `widget`: { props, value } for a component, { rows } for a screen (every row, each cell with its props and value, as add_screen takes them) or { clips } for a reel. A key it does not know fails the call.",
        parameters: obj({ id: str("artboard id"), patch: obj({ widget: obj({}), chart: obj({}) }) }, ["id", "patch"]),
      },
      step: { verb: "Updated", ask: "Change a frame", icon: "Edit", mutates: true },
    },
  }),
  "artboard.remove": command({
    parse: (raw) => (typeof raw.id === "string" ? { id: raw.id } : refuse(`no artboard ${String(raw.id)}`)),
    run: ({ id }) => {
      if (!find(id)) return fail(`no artboard ${id}`)
      removeArtboard(id)
      return ok({ removed: id })
    },
    doc: "{ id }",
    skill: "`id`",
    tool: {
      def: {
        name: "remove_artboard",
        description: "Delete a frame (undoable in the Studio).",
        parameters: obj({ id: str("artboard id") }, ["id"]),
      },
      step: { verb: "Removed a frame", ask: "Remove a frame", icon: "Trash", mutates: true },
    },
  }),
  "artboard.select": command({
    parse: (raw) => ({ ids: namedIds(raw) }),
    run: ({ ids }) => {
      const known = ids.filter(find)
      if (!known.length) return fail("no such artboard")
      if (known.length === 1) selectArtboard(known[0])
      else selectMany(known)
      return ok(known)
    },
    doc: "{ id } or { ids }",
    skill: "`id` or `ids`",
    tool: {
      def: {
        name: "select",
        description: "Select one frame (id) or several (ids).",
        parameters: obj({ id: str("artboard id"), ids }),
      },
      step: { verb: "Selected", ask: "Select frames on the canvas", icon: "Crosshair", mutates: false },
    },
  }),
  evolve: command({
    parse: (raw) => ({
      id: targetOf(raw),
      opts: {
        count: optionalNumber(raw.count),
        seed: optionalNumber(raw.seed),
        strength: optionalNumber(raw.strength),
      },
    }),
    run: (cmd) => {
      const parent = target(cmd.id)
      if (!parent) return fail("select an artboard or pass { id }")
      return ok(placeGeneration(evolveArtboard(parent, cmd.opts)).map(summarize))
    },
    doc: "{ id?, count?, seed?, strength? } — seeded variants placed as a row",
    skill: "`id?`, `count?` (1–12), `seed?`, `strength?` (0–1) — seeded variants placed as a row",
    tool: {
      def: {
        name: "evolve",
        description:
          "Produce seeded variants of a frame, placed as a row and selected. Use when the user wants options.",
        parameters: obj({
          id: str("parent artboard id; defaults to the selection"),
          count: num("1–12, default 4"),
          seed: num("generation seed"),
          strength: num("0–1 mutation pressure"),
        }),
      },
      step: { verb: "Evolved", ask: "Evolve a frame into variants", icon: "Dice", mutates: true },
    },
  }),
  "artboard.duplicate": command({
    parse: (raw) => ({ ids: namedIds(raw) }),
    run: ({ ids }) => {
      const missing = selectNamed(ids)
      if (missing) return fail(missing)
      duplicateSelected()
      return ok(selectedSummaries())
    },
    doc: "{ id? | ids? } — copies of those frames (the selection by default), selected",
    skill: "`id?` or `ids?` (the selection by default) — copies, selected",
    tool: {
      def: {
        name: "duplicate",
        description: "Duplicate frames (the selection by default); the copies come back selected.",
        parameters: obj({ id: str("artboard id"), ids }),
      },
      step: { verb: "Duplicated", ask: "Duplicate frames", icon: "Copy", mutates: true },
    },
  }),
  group: command({
    parse: (raw) => ({
      ids: namedIds(raw),
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 80) : undefined,
    }),
    run: (cmd) => {
      const missing = selectNamed(cmd.ids)
      if (missing) return fail(missing)
      const g = groupSelected()
      if (!g) return fail("nothing to group")
      if (cmd.name !== undefined) g.name = cmd.name
      return ok(selectedSummaries())
    },
    doc: "{ id? | ids?, name? } — group those frames (the selection by default); each summary carries its group",
    skill: "`id?` or `ids?` (the selection by default), `name?` — each frame's summary carries its `group`",
    tool: {
      def: {
        name: "group",
        description: "Group frames (the selection by default) so they move and hide as one layer group.",
        parameters: obj({ id: str("artboard id"), ids, name: str("group name") }),
      },
      step: { verb: "Grouped", ask: "Group frames", icon: "Group", mutates: true },
    },
  }),
  ungroup: command({
    parse: (raw) => ({ id: typeof raw.id === "string" ? raw.id : "" }),
    run: ({ id }) => {
      const groupId = editor.groups.some((g) => g.id === id) ? id : (find(id)?.groupId ?? null)
      if (!groupId) return fail(`no group ${id}: pass a group's id or a frame of one`)
      const members = editor.artboards.filter((a) => a.groupId === groupId)
      ungroup(groupId)
      return ok(members.map(summarize))
    },
    doc: "{ id } — a group's id, or a frame of the group; the frames it held",
    skill: "`id` — a group's id or a frame of the group",
    tool: {
      def: {
        name: "ungroup",
        description: "Ungroup a group, named by its id or by one of its frames.",
        parameters: obj({ id: str("group id or a frame of the group") }, ["id"]),
      },
      step: { verb: "Ungrouped", ask: "Ungroup frames", icon: "Group", mutates: true },
    },
  }),
  replay: command({
    parse: none,
    run: () => {
      replay()
      return ok({ replayed: editor.artboards.filter((a) => !a.hidden).length })
    },
    doc: "play every frame's entrance again",
    skill: "play every frame's entrance again",
    tool: {
      def: { name: "replay", description: "Play every frame's entrance animation again.", parameters: obj({}) },
      step: { verb: "Replayed the animations", ask: "Replay the animations", icon: "Refresh", mutates: false },
    },
  }),
  view: command({
    parse: (raw): { id: string } | { zoom: number } | { to: ViewTo } | Refusal => {
      if (typeof raw.id === "string") return { id: raw.id }
      if (raw.zoom !== undefined) {
        const zoom = Number(raw.zoom)
        return Number.isFinite(zoom) && zoom > 0 ? { zoom } : refuse("zoom must be a positive number (1 is 100%)")
      }
      const to = raw.to ?? "all"
      return VIEW_TO.includes(to as ViewTo) ? { to: to as ViewTo } : refuse(`to must be one of ${VIEW_TO.join(", ")}`)
    },
    run: (cmd) => {
      if ("id" in cmd) {
        const a = find(cmd.id)
        if (!a) return fail(`no artboard ${cmd.id}`)
        selectArtboard(a.id)
        fitSelection()
      } else if ("zoom" in cmd) zoomTo(cmd.zoom)
      else VIEW[cmd.to]()
      return ok({ ...editor.viewport, inspecting: editor.inspecting })
    },
    doc: `{ to?: ${VIEW_TO.join("|")}, zoom?: 0.2-3, id? } — move the canvas view: fit every frame, the selection or one frame (id), step the zoom or set it`,
    skill: `\`to?\` (${VIEW_TO.map((t) => `\`${t}\``).join(", ")}), \`zoom?\` (0.2–3, 1 is 100%) or \`id?\` (fit that frame) — the canvas view; held at 100% while the user inspects`,
    tool: {
      def: {
        name: "set_view",
        description:
          "Move the canvas view, zoom and fit: to fits every frame (all), the selection, steps in or out, or 100% (actual); id fits one frame; zoom sets it (1 is 100%).",
        parameters: obj({
          to: { type: "string", enum: [...VIEW_TO] },
          id: str("a frame to fit"),
          zoom: num("0.2–3, 1 is 100%"),
        }),
      },
      step: { verb: "Moved the view", ask: "Move the canvas view", icon: "Maximize", mutates: false },
    },
  }),
  inspect: command({
    parse: (raw) => ({ id: targetOf(raw) }),
    run: (cmd) => {
      const a = target(cmd.id)
      if (!a) return fail("select an artboard or pass { id }")
      const reading = inspectFrame(a)
      return reading ? ok(reading) : fail(`${a.name} is not drawn on the canvas (hidden?)`)
    },
    doc: "{ id? } — what the frame reads as on the canvas: its controls in Tab order (role, name, states, box in the frame's px) and what the accessibility floor finds (missing names, fields named only by their placeholder (set the field's `label` prop), targets under 24px, text under AA contrast, images without alt, positive tabindex)",
    skill:
      "`id?` — the frame as drawn: its controls in Tab order (role, name, states, box in the frame's px) and what the accessibility floor finds (missing names, fields named only by their placeholder, targets under 24px, text under AA contrast, images without alt, positive tabindex); check a screen with it before calling it done. A text field (`DitherInput`, `DitherTextarea`, `DitherSelect`, `DitherEmailInput`, `DitherPasswordInput`, `DitherSearchInput`, `DitherPhoneInput`, `DitherCurrencyInput`) takes a `label` prop: its visible label, tied to it (the field inside a `DitherField`), which is what fixes a placeholder-only name",
    tool: {
      def: {
        name: "inspect",
        description:
          "Inspect a frame as drawn: its controls in Tab order (role, accessible name, states, box) and what the accessibility floor finds: missing names, fields named only by their placeholder (give the field its `label` prop: a visible label tied to it), targets under 24px, text under AA contrast, images without alt. Check a screen before calling it done.",
        parameters: obj({ id: str("artboard id; defaults to the selection") }),
      },
      step: { verb: "Inspected", ask: "Inspect a frame", icon: "Inspect", mutates: false },
    },
  }),
  "image.export": command({
    parse: (raw) => {
      const scale = raw.scale ?? 2
      return PNG_SCALES.includes(scale as (typeof PNG_SCALES)[number])
        ? { id: targetOf(raw), scale: scale as (typeof PNG_SCALES)[number] }
        : refuse(`scale must be one of ${PNG_SCALES.join(", ")}`)
    },
    run: (cmd) => {
      const a = target(cmd.id)
      if (!a) return fail("select an artboard or pass { id }")
      return ok({ id: a.id, name: a.name, file: `image/${slugOf(a.name)}.png`, scale: cmd.scale })
    },
    doc: `{ id?, scale?: ${PNG_SCALES.join("|")} } — the frame as a PNG (scale 2 by default), written under the project as image/<name>.png`,
    skill:
      "`id?`, `scale?` (1–4, default 2) — names the PNG's place, `image/<name>.png`; the `export_png` action writes it under your project through the bridge",
    tool: {
      def: {
        name: "export_png",
        description: "Export a frame as a PNG picture, written under the project as image/<name>.png.",
        parameters: obj({
          id: str("artboard id; defaults to the selection"),
          scale: { type: "number", enum: [...PNG_SCALES], description: "pixel ratio, 2 by default" },
        }),
      },
      step: { verb: "Saved a picture of", ask: "Save a frame as a PNG", icon: "Image", mutates: false },
    },
  }),
  "code.get": command({
    parse: (raw) => {
      if (typeof raw.id !== "string") return refuse(`no artboard ${String(raw.id)}`)
      const styling = raw.styling ?? "tailwind"
      return isStyling(styling) ? { id: raw.id, styling } : refuse(`styling must be one of ${STYLINGS.join(", ")}`)
    },
    run: (cmd) => {
      const a = find(cmd.id)
      if (!a) return fail(`no artboard ${cmd.id}`)
      return ok({ id: a.id, styling: cmd.styling, ...frameCode(a, cmd.styling) })
    },
    doc: "{ id, styling? } — the frame as a Solid component, { file, code, sheet }: a .tsx file on the kit's Solid layer; tailwind (default) keeps the utility classes; css (a stylesheet), modules (CSS Modules) or stylex write the same look in that system, the stylesheet it then imports as sheet { file, text } (null otherwise)",
    skill:
      "`id`, `styling?` — the frame as a Solid component, `{ file, code, sheet }`: a `.tsx` file on the kit's Solid layer; `tailwind` (default) keeps the utility classes, `css` (a stylesheet), `modules` (CSS Modules) or `stylex` write the same look in that system while the kit components keep their own styles; `sheet` is the stylesheet the file then imports, `{ file, text }` (null otherwise)",
    tool: {
      def: {
        name: "get_code",
        description:
          "The frame as a Solid component (a .tsx file on the kit's Solid layer), in the styling system asked for: tailwind (default) keeps the utility classes; css, modules (CSS Modules) or stylex write the same look that way while the kit components keep their own styles. css and modules come with the stylesheet the file imports, as sheet.",
        parameters: obj(
          {
            id: str("artboard id"),
            styling: { type: "string", enum: [...STYLINGS], description: "tailwind | css | modules | stylex" },
          },
          ["id"],
        ),
      },
      step: { verb: "Read the code of", ask: "Read the code of a frame", icon: "Code", mutates: false },
    },
  }),
  "document.get": command({
    parse: none,
    run: () => ok(documentSnapshot()),
    doc: "the live document",
    skill: "—",
    tool: {
      def: {
        name: "get_document",
        description: "The whole project document (large; image data is elided). Prefer list_artboards.",
        parameters: obj({}),
      },
      step: { verb: "Read the document", ask: "Read the document", icon: "File", mutates: false },
    },
  }),
  // The document is read whole by `parseDocument`, the one door a file
  // import takes too; it lands as an edit (undoable), saved on autosave's
  // cadence like every other command's.
  "document.set": command({
    parse: (raw) => {
      const document = parseDocument(raw.document)
      return document
        ? { document }
        : refuse("document rejected: needs { artboards: [...] } with at least one artboard")
    },
    run: (cmd) => {
      loadDocument(cmd.document)
      return ok({ artboards: editor.artboards.map(summarize) })
    },
    doc: "{ document } — replace the project (validated like a file import; undoable)",
    skill: "`document` (validated like a file import; undoable)",
  }),
  "clock.seek": command({
    parse: (raw) => {
      if (raw.seconds === undefined || raw.seconds === null) return { seconds: null }
      const seconds = Number(raw.seconds)
      return Number.isFinite(seconds) && seconds >= 0 ? { seconds } : refuse("seconds must be a non-negative number")
    },
    run: ({ seconds }) => {
      if (seconds === null) {
        release()
        return ok({ directed: false })
      }
      seek(seconds * 1000)
      return ok({ directed: true, seconds })
    },
    doc: "{ seconds? } — hold every animation on the canvas at that moment (a stable screenshot from any driver in any browser); without seconds, let time run again",
    skill:
      "`seconds?` — hold every animation on the canvas at that moment, so a screenshot is stable from any driver in any browser; without `seconds` time runs again (`clock.release` does the same)",
    tool: {
      def: {
        name: "seek_clock",
        description:
          "Hold every animation on the canvas at a moment, in seconds, so a screenshot is stable in any browser; call it without seconds to let time run again.",
        parameters: obj({ seconds: num("the moment in seconds; omit to release") }),
      },
      step: { verb: "Held the clock", ask: "Hold the clock at a moment", icon: "Clock", mutates: false },
    },
  }),
  "clock.release": command({
    parse: none,
    run: () => {
      release()
      return ok({ directed: false })
    },
    doc: "let time run again",
    skill: "let time run again",
  }),
  "video.export": command({
    parse: (raw) => {
      const { seconds, fps, theme } = normalizeVideoOptions(raw)
      // Without seconds a frame's video is as long as its own default (null).
      return {
        id: targetOf(raw),
        seconds: raw.seconds === undefined || raw.seconds === null ? null : seconds,
        fps,
        theme,
      }
    },
    run: (cmd) => {
      const a = target(cmd.id)
      if (!a) return fail("select an artboard or pass { id }")
      const seconds = cmd.seconds ?? normalizeVideoOptions({ seconds: defaultSeconds(a) }).seconds
      const options = { seconds, fps: cmd.fps, theme: cmd.theme }
      const wav = scoreWav(a, options.seconds)
      return ok({
        id: a.id,
        name: a.name,
        file: videoFileName(a),
        options,
        index: compositionHtml(
          a,
          options,
          { jsRef: "./player.js", cssRef: "./player.css" },
          reelClips(a),
          wav ? "./score.wav" : undefined,
        ),
        assets: playerAssetUrls(),
        ...(wav ? { score: { path: "score.wav", base64: bytesToBase64(wav) } } : {}),
        render: renderCommand(a),
        note: `index.html + player.js + player.css${wav ? " + score.wav (decode score.base64)" : ""} in one directory: npx hyperframes render <dir> -o ${slugOf(a.name)}.mp4. Same seeds + time → same pixels; simulation backgrounds need --workers 1.`,
      })
    },
    doc: "{ id?, seconds?, fps?: 24|30|60, theme? } — the frame as a HyperFrames composition: index (HTML referencing ./player.js and ./player.css) + the assets' URLs; write the three side by side and `npx hyperframes render`. A reel's seconds default to its length; a reel with a score adds score: { path: score.wav, base64 } for the index's audio track",
    skill:
      "`id?`, `seconds?` (1–600; a reel's default is its length), `fps?` (24/30/60), `theme?` — the frame as a HyperFrames composition: `index` (HTML referencing `./player.js` + `./player.css`) and the `assets` URLs to fetch beside it; a reel with a score adds `score: { path: \"score.wav\", base64 }` for the index's audio track",
    tool: {
      def: {
        name: "export_video",
        description:
          "Export a frame as a HyperFrames composition — one HTML file that `npx hyperframes render` turns into a deterministic MP4 (Node 22 + FFmpeg). It is written under the project as video/<name>/index.html; the result carries the render command. A reel renders as one video of its whole cut.",
        parameters: obj({
          id: str("artboard id; defaults to the selection"),
          seconds: num("length in seconds, 1–600 (default 6; a reel defaults to its length)"),
          fps: { type: "number", enum: [24, 30, 60] },
          theme: { type: "string", enum: ["dark", "light"] },
        }),
      },
      step: { verb: "Exported a video of", ask: "Export a frame as a video", icon: "Video", mutates: false },
    },
  }),
} satisfies Record<CommandType, CommandRow>

/** The table's rows in order, each with its command's type. */
export const commandRows = (): [CommandType, CommandRow][] => Object.entries(COMMANDS) as [CommandType, CommandRow][]

/** Execute one command against the live editor. Never throws. */
export function runCommand(input: unknown): CommandResult {
  if (!isPlain(input) || typeof input.type !== "string") return fail("command must be an object with a string `type`")
  const row: CommandRow | undefined = Object.prototype.hasOwnProperty.call(COMMANDS, input.type)
    ? COMMANDS[input.type as CommandType]
    : undefined
  if (!row) return fail(`unknown command type ${input.type}`)
  try {
    return row.exec(input)
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e))
  }
}

/** The command table of `public/agent/SKILL.md`, as the table gives it
 * (pinned by `tests/site/agent-commands.spec.ts`). */
export const skillTable = (): string =>
  ["| type | fields |", "| --- | --- |", ...commandRows().map(([type, row]) => `| \`${type}\` | ${row.skill} |`)].join(
    "\n",
  )

/** A component's model as a Solid caller binds it: the prop that carries
 * the value and the callback prop the control calls (`modelValue` with
 * `onUpdateModelValue` unless the registry row names its own). */
function modelRow(e: (typeof COMPONENT_REGISTRY)[number]) {
  const m = modelOf(e)
  return m ? { default: m.default, prop: m.prop, on: m.on } : null
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
    widgets: SIMPLE_WIDGET_KINDS,
    components: COMPONENT_REGISTRY.map((e) => ({
      is: e.is,
      label: e.label,
      group: e.group,
      frame: e.frame,
      props: e.props.map((p) => ({ ...p })),
      slotText: e.slotText ?? null,
      model: modelRow(e),
    })),
    document: {
      artboards:
        "Artboard[] — { id, name, x, y, w, h, hidden?, locked?, groupId?: null, chart: ChartModel, widget?: WidgetModel }",
      chart:
        "ChartModel — { type: charts[], rows: DataRow[], series: [{ key, label, color }], seed?, bloom: off|low|high|aura, stackType: default|stacked|percent, cell: 1..4 }",
      rows: {
        cartesian: "{ month: string, <seriesKey>: number }",
        pie: "{ name: string, value: number }",
        radar: "{ axis: string, <seriesKey>: number }",
      },
      widget:
        "WidgetModel — { kind: avatar|button|gradient|image } | { kind: component, is, props, slotText } | { kind: screen, rows: [{ cells: [{ is, props, slotText, grow }], align, justify, gap }], gap, padding } | { kind: reel, clips: [{ id, seconds, transition: { kind, seconds, cell, seed }, camera: [{ t, x, y, zoom, tilt }], callouts: [{ x, y, label, note, side, from, to }], chapter: { line, spec: [[figure, words]] } | null }], score: { seed } | null }",
      groups: "Group[] — { id, name, collapsed }",
      viewport: "{ x, y, zoom }",
    },
    commands: Object.fromEntries(commandRows().map(([type, row]) => [type, row.doc])) as Record<CommandType, string>,
  }
}
