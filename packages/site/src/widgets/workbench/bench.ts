// The workbench controller: one per preview while its Inspect is on. It
// owns the tool in hand, the undoable workspace, what the overlay measures
// every frame, every pointer gesture on the stage, the keyboard (only for
// the preview under the pointer or holding focus), captures and the agent
// hand-off. The components render from it and call into it; it touches the
// DOM only to read the preview and to measure its own overlay.
import { createEffect, createSignal, on } from "solid-js"
import { createMutable } from "solid-js/store"
import { BAYER8, copyText, isDirected, release } from "dither-kit"
import { download } from "@/shared/lib/files"
import { encodeGif } from "@/shared/lib/gif"
import { play } from "@/shared/lib/sound"
import {
  canRecord,
  canShareTab,
  durationOf,
  grabRegion,
  recordRegion,
  renderRegion,
  renderStage,
  trimVideo,
  videoFrames,
  videoTypes,
  type Recording,
} from "@/widgets/workbench/model/capture"
import { formatColor, parseColor, type RGBA } from "@/shared/lib/inspect/color"
import {
  boxFrom,
  distances,
  dock,
  edgesOf,
  intersects,
  snap,
  type Box,
  type Point,
  type Segment,
} from "@/shared/lib/inspect/geometry"
import { boundsOf, erase, hitLine, toSegment, type InkPoint } from "@/widgets/workbench/model/ink"
import {
  audit,
  boxOf,
  controlOf,
  focusOrder,
  interactive,
  labelOf,
  nameOf,
  pathOf,
  readingOf,
  resolvePath,
  roleOf,
  selectorOf,
  statesOf,
  textHolder,
  typeOf,
  walk,
  type Issue,
  type Reading,
  type TypeReading,
} from "@/shared/lib/inspect/measure"
import { loadSettings, saveSettings, swatch, type Settings } from "@/widgets/workbench/model/settings"
import { TOGGLES, TOOLS, toolById, type ToggleId, type ToolId } from "@/widgets/workbench/model/tools"
import {
  createHistory,
  emptyWorkspace,
  feedbackMarkdown,
  loadWorkspace,
  saveWorkspace,
  uid,
  type Anchor,
  type Item,
  type Workspace,
} from "@/widgets/workbench/model/workspace"

export type BenchOptions = {
  /** The preview frame the overlay covers. */
  host: HTMLElement
  /** The preview's root wrapper (what is inspected). */
  content: HTMLElement
  /** The whole card (keys count while focus is anywhere in it). */
  card: HTMLElement
  /** Storage key, `<section>:<n>`. */
  key: string
  section: string
  title: string
  url: string
  /** Turn the workbench off (Escape with nothing left to cancel). */
  exit: () => void
  /** Where the feedback goes when there is an agent to take it (the
   * Studio's panel); without one, K copies it. */
  send?: (markdown: string) => void
}

export type Draft =
  | { kind: "arrow"; from: Point; to: Point }
  | { kind: "stroke"; points: InkPoint[] }
  | { kind: "region"; from: Point; to: Point; for: "shot" | "video" }
  | { kind: "marquee"; from: Point; to: Point; base: Item[] }
  | { kind: "guide"; id: string; before: string }
  | { kind: "move"; last: Point; before: string }
  | { kind: "erase"; before: string }
  | { kind: "scale"; handle: Handle; box: Box; origin: Workspace; before: string }
  | { kind: "rotate"; center: Point; from: number; origin: Workspace; before: string }

/** The selection box's corner handles and its rotate handle above. */
export type Handle = "nw" | "ne" | "sw" | "se" | "rotate"

export type Capture =
  | { kind: "shot"; blob: Blob; url: string }
  | { kind: "recording"; rec: Recording }
  | { kind: "video"; blob: Blob; url: string; duration: number; start: number; end: number }

export type A11yReading = {
  label: string
  box: Box
  role: string
  name: string
  states: string[]
  tabindex: number | null
  /** A control: what the name and target-size floor applies to. */
  control: boolean
}
export type XrayBox = { box: Box; depth: number; layout: boolean }
export type Mark = { box: Box; kind: Issue["kind"]; note: string }

/** The export format that is not a video: a GIF through the kit's dither. */
export const GIF = "image/gif"

/** The preview whose keys these are: last pointed at or focused. */
let current: symbol | null = null
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const HOVER_TOOLS = new Set<ToolId | null>(["inspect", "xray", "type", "a11y", "comment"])
const TARGET_TOOLS = new Set<ToolId | null>(["inspect", "xray", "type", "a11y"])

export function createBench(o: BenchOptions) {
  const me = Symbol(o.key)
  const settings = createMutable<Settings>(loadSettings())
  createEffect(
    on(
      () => ({ ...settings }),
      (s) => saveSettings(s),
      { defer: true },
    ),
  )

  const [overlay, setOverlay] = createSignal<HTMLElement | null>(null)
  const [tool, holdTool] = createSignal<ToolId | null>("inspect")
  const [group, showGroup] = createSignal<1 | 2>(1)
  const toggles = createMutable<Record<ToggleId, boolean>>({ rulers: true, responsive: false, motion: false })
  const [panel, setPanel] = createSignal<"settings" | null>(null)
  const [minimized, setMinimized] = createSignal(false)
  // A panel or the tray folding open or shut has its own sound, from every
  // path (the tray, a key, Escape, a close button).
  let was: ["settings" | null, boolean] = [panel(), minimized()]
  createEffect(
    on(
      [panel, minimized],
      ([p, m]) => {
        const [wasP, wasM] = was
        was = [p, m]
        play((p && !wasP) || (wasM && !m) ? "unfold" : "fold")
      },
      { defer: true },
    ),
  )
  const [status, setStatus] = createSignal("")
  let statusTimer = 0
  function say(message: string) {
    setStatus(message)
    clearTimeout(statusTimer)
    statusTimer = window.setTimeout(() => setStatus(""), 2800)
  }

  // --- workspace + history ----------------------------------------------------

  const [ws, setWs] = createSignal<Workspace>(settings.persist ? loadWorkspace(o.key) : emptyWorkspace())
  const history = createHistory()
  const [revision, setRevision] = createSignal(0)
  /** Change the workspace; `record` opens an undo step first. */
  function change(mut: (draft: Workspace) => void, record = true) {
    if (record) history.record(ws())
    const draft = clone(ws())
    mut(draft)
    setWs(draft)
    setRevision(revision() + 1)
  }
  /** Close a gesture that opened an undo step: drop it if nothing changed. */
  function settle(before: string) {
    if (JSON.stringify(ws()) === before) history.drop()
    setRevision(revision() + 1)
  }
  function undo() {
    const prev = history.undo(ws())
    if (!prev) return say("Nothing to undo")
    play("tap")
    setWs(prev)
    setSelection([])
    setRevision(revision() + 1)
    say("Undone")
  }
  function redo() {
    const next = history.redo(ws())
    if (!next) return say("Nothing to redo")
    play("tap")
    setWs(next)
    setSelection([])
    setRevision(revision() + 1)
    say("Redone")
  }
  let saveTimer = 0
  createEffect(
    on(
      ws,
      (v) => {
        if (!settings.persist) return
        clearTimeout(saveTimer)
        saveTimer = window.setTimeout(() => saveWorkspace(o.key, v), 250)
      },
      { defer: true },
    ),
  )
  createEffect(
    on(
      () => settings.persist,
      (kept) => saveWorkspace(o.key, kept ? ws() : emptyWorkspace()),
      { defer: true },
    ),
  )
  function clearAll() {
    change((d) => {
      const grid = d.grid
      Object.assign(d, emptyWorkspace(), { grid })
    })
    setSelection([])
    say("Cleared the annotations")
  }

  // --- what the overlay shows -------------------------------------------------

  const [size, setSize] = createSignal({ w: 0, h: 0 })
  const [pointer, setPointer] = createSignal<Point | null>(null)
  const [hot, setHot] = createSignal(false)
  let client: Point | null = null
  const [hovered, setHovered] = createSignal<Element | null>(null)
  const [pinned, setPinned] = createSignal<Element | null>(null)
  const [reading, setReading] = createSignal<Reading | null>(null)
  const [ghost, setGhost] = createSignal<Box | null>(null)
  const [typeReading, setTypeReading] = createSignal<(TypeReading & { label: string; box: Box }) | null>(null)
  const [a11y, setA11y] = createSignal<A11yReading | null>(null)
  /** What a comment would attach to, under the Comment tool. */
  const [aim, setAim] = createSignal<{ box: Box; label: string } | null>(null)
  const [order, setOrder] = createSignal<Box[]>([])
  const [marks, setMarks] = createSignal<Mark[]>([])
  const [xray, setXray] = createSignal<XrayBox[]>([])
  const [alt, setAlt] = createSignal(false)
  const [altFrom, setAltFrom] = createSignal<Element | null>(null)
  const [altMeasure, setAltMeasure] = createSignal<{
    from: Box
    to: Box
    fromLabel: string
    toLabel: string
    segments: Segment[]
  } | null>(null)
  const [pins, setPins] = createSignal<Record<string, Point>>({})
  const [guideAxis, setGuideAxis] = createSignal<"x" | "y">("x")
  const [guideHover, setGuideHover] = createSignal<number | null>(null)
  /** The selection handle under the pointer (Select), for its cursor. */
  const [handleHover, setHandleHover] = createSignal<Handle | null>(null)
  const [draft, setDraft] = createSignal<Draft | null>(null)
  const [selection, setSelection] = createSignal<Item[]>([])
  const [editing, setEditing] = createSignal<string | null>(null)
  const [openThread, setOpenThread] = createSignal<string | null>(null)
  const [draftThread, setDraftThread] = createSignal<(Anchor & { at: Point }) | null>(null)
  /** A thread waiting for the element it should move to. */
  const [moving, setMoving] = createSignal<string | null>(null)
  const [samples, setSamples] = createSignal<RGBA[]>([])
  const [capture, setCapture] = createSignal<Capture | null>(null)
  const [capturing, setCapturing] = createSignal(false)
  const [busy, setBusy] = createSignal(false)
  const [videoMime, setVideoMime] = createSignal(videoTypes()[0]?.mime ?? "")
  const [loupeZoom, setLoupeZoom] = createSignal(10)

  function toStage(e: { clientX: number; clientY: number }, exact = false): Point {
    const r = overlay()!.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    return exact ? { x, y } : { x: Math.round(x), y: Math.round(y) }
  }

  /** The preview element under a viewport point, past the overlay. */
  function elementAt(x: number, y: number): Element | null {
    for (const el of document.elementsFromPoint(x, y)) {
      if (overlay()?.contains(el)) continue
      return el !== o.content && o.content.contains(el) ? el : null
    }
    return null
  }

  function a11yOf(el: Element, frame: Element): A11yReading {
    const tab = (el as HTMLElement).tabIndex
    return {
      label: labelOf(el),
      box: boxOf(el, frame),
      role: roleOf(el) ?? "generic",
      name: nameOf(el),
      states: statesOf(el),
      tabindex: el.hasAttribute("tabindex") || tab >= 0 ? tab : null,
      control: interactive(el),
    }
  }

  function xrayOf(frame: Element): XrayBox[] {
    const out: XrayBox[] = []
    const visit = (el: Element, depth: number) => {
      for (const c of el.children) {
        if (out.length >= 1500) return
        const r = c.getBoundingClientRect()
        if (r.width || r.height)
          out.push({ box: boxOf(c, frame), depth, layout: /flex|grid/.test(getComputedStyle(c).display) })
        if (c.tagName.toLowerCase() !== "svg") visit(c, depth + 1)
      }
    }
    visit(o.content, 0)
    return out
  }

  let raf = 0
  let slow = 0
  function frame(now: number) {
    raf = requestAnimationFrame(frame)
    const ov = overlay()
    if (!ov || capturing()) return
    const w = ov.clientWidth
    const h = ov.clientHeight
    if (w !== size().w || h !== size().h) setSize({ w, h })
    if (pinned() && !pinned()!.isConnected) setPinned(null)
    const t = tool()
    const pin = pinned()
    const over = hovered()
    const target = pin ?? over
    const live = target?.isConnected && TARGET_TOOLS.has(t) ? target : null

    const r = live && (t === "inspect" || t === "xray") ? readingOf(live, ov) : null
    if (!same(r, reading())) setReading(r)
    const g = pin && over && over !== pin && over.isConnected && TARGET_TOOLS.has(t) ? boxOf(over, ov) : null
    if (!same(g, ghost())) setGhost(g)

    const text = live && t === "type" ? textHolder(live, o.content) : null
    const tr = text ? { ...typeOf(text, ov), label: labelOf(text), box: boxOf(text, ov) } : null
    if (!same(tr, typeReading())) setTypeReading(tr)

    const ar = live && t === "a11y" ? a11yOf(live, ov) : null
    if (!same(ar, a11y())) setA11y(ar)

    const aimed = t === "comment" && over?.isConnected ? controlOf(over, o.content) : null
    const am0 = aimed ? { box: boxOf(aimed, ov), label: labelOf(aimed) } : null
    if (!same(am0, aim())) setAim(am0)

    if (now - slow > 300) {
      slow = now
      const xr = t === "xray" ? xrayOf(ov) : []
      if (!same(xr, xray())) setXray(xr)
      const ord = t === "a11y" ? focusOrder(o.content).map((el) => boxOf(el, ov)) : []
      if (!same(ord, order())) setOrder(ord)
      const mk = t === "a11y" ? audit(o.content, ov).map(({ box, kind, note }) => ({ box, kind, note })) : []
      if (!same(mk, marks())) setMarks(mk)
    }

    let am: ReturnType<typeof altMeasure> = null
    if (alt() && client) {
      const from = pin ?? altFrom()
      const to = elementAt(client.x, client.y)
      if (from?.isConnected) {
        const fb = boxOf(from, ov)
        const tb = to && to !== from ? boxOf(to, ov) : { x: 0, y: 0, w, h }
        am = {
          from: fb,
          to: tb,
          fromLabel: labelOf(from),
          toLabel: to && to !== from ? labelOf(to) : "stage",
          segments: distances(fb, tb),
        }
      }
    }
    if (!same(am, altMeasure())) setAltMeasure(am)

    const p: Record<string, Point> = {}
    for (const th of ws().threads) {
      const el = resolvePath(o.content, th.anchor.path)
      const b = el ? boxOf(el, ov) : th.anchor.box
      p[th.id] = { x: b.x + Math.min(th.anchor.offset.x, b.w), y: b.y + Math.min(th.anchor.offset.y, b.h) }
    }
    if (!same(p, pins())) setPins(p)
  }

  // --- tools -----------------------------------------------------------------

  function setTool(id: ToolId | null) {
    const next = tool() === id ? null : id
    if (next !== tool()) play("tap")
    holdTool(next)
    if (next) showGroup(toolById(next).group)
    setDraft(null)
    setHovered(null)
    setGuideHover(null)
    if (next !== "select") setSelection([])
    if (next === "color" && "EyeDropper" in window) void eyeDropper()
    if (next === "color" || next === "loupe") void refreshSnapshot()
  }

  function setGroup(g: 1 | 2) {
    if (g !== group()) play("tap")
    showGroup(g)
    const t = tool()
    if (t && toolById(t).group !== g) setTool(null)
  }

  function toggle(id: ToggleId) {
    toggles[id] = !toggles[id]
    play(toggles[id] ? "on" : "off")
    say(`${TOGGLES.find((t) => t.id === id)!.label} ${toggles[id] ? "on" : "off"}`)
  }

  // --- element boxes for snapping and docking ---------------------------------

  function elementBoxes(): Box[] {
    const ov = overlay()
    if (!ov) return []
    return [...o.content.querySelectorAll("*")]
      .slice(0, 600)
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => boxOf(el, ov))
  }

  function snapGuide(v: number, axis: "x" | "y", skip?: string): number {
    if (!settings.snap) return v
    const boxes = elementBoxes()
    const lines = boxes.flatMap((b) => (axis === "x" ? edgesOf(b).xs : edgesOf(b).ys))
    const guides = ws()
      .guides.filter((g) => g.axis === axis && g.id !== skip)
      .map((g) => g.at)
    return snap(v, [...lines, ...guides, 0, axis === "x" ? size().w : size().h], 5).value
  }

  let dockBoxes: Box[] = []
  function dockAt(p: Point): Point {
    return settings.snap ? (dock(p, dockBoxes, 8) ?? p) : p
  }

  function guideNear(p: Point) {
    return ws().guides.find((g) => Math.abs((g.axis === "x" ? p.x : p.y) - g.at) <= 4) ?? null
  }

  // --- selection --------------------------------------------------------------

  function noteBox(id: string): Box | null {
    const ov = overlay()
    const el = ov?.querySelector(`[data-note="${id}"]`)
    return el && ov ? boxOf(el, ov) : null
  }

  function boundsOfItem(item: Item): Box | null {
    const w = ws()
    switch (item.kind) {
      case "arrows": {
        const a = w.arrows.find((x) => x.id === item.id)
        return a ? boundsOf([a.from, a.to], a.width + 3) : null
      }
      case "strokes": {
        const s = w.strokes.find((x) => x.id === item.id)
        return s
          ? boundsOf(
              s.points.map(([x, y]) => ({ x, y })),
              s.width / 2 + 2,
            )
          : null
      }
      case "notes":
        return noteBox(item.id)
      case "guides": {
        const g = w.guides.find((x) => x.id === item.id)
        if (!g) return null
        return g.axis === "x" ? { x: g.at - 2, y: 0, w: 4, h: size().h } : { x: 0, y: g.at - 2, w: size().w, h: 4 }
      }
      case "measures": {
        const m = w.measures.find((x) => x.id === item.id)
        if (!m) return null
        const pts = distances(m.from.box, m.to.box).flatMap((s) => [
          { x: s.x1, y: s.y1 },
          { x: s.x2, y: s.y2 },
        ])
        return pts.length ? boundsOf(pts, 4) : null
      }
    }
  }

  function itemAt(p: Point): Item | null {
    const w = ws()
    for (const n of [...w.notes].reverse()) {
      const b = noteBox(n.id)
      if (b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { kind: "notes", id: n.id }
    }
    for (const a of [...w.arrows].reverse())
      if (toSegment(p, a.from, a.to) <= a.width + 4) return { kind: "arrows", id: a.id }
    for (const s of [...w.strokes].reverse())
      if (
        hitLine(
          s.points.map(([x, y]) => ({ x, y })),
          p,
          s.width / 2 + 4,
        )
      )
        return { kind: "strokes", id: s.id }
    for (const m of [...w.measures].reverse()) {
      const b = boundsOfItem({ kind: "measures", id: m.id })
      if (b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return { kind: "measures", id: m.id }
    }
    const g = guideNear(p)
    return g ? { kind: "guides", id: g.id } : null
  }

  const isSelected = (item: Item) => selection().some((s) => s.kind === item.kind && s.id === item.id)

  /** What a transform moves: arrows, strokes and notes (guides only move,
   * measurements are where they were measured). */
  const transformable = () =>
    selection().filter((s) => s.kind === "arrows" || s.kind === "strokes" || s.kind === "notes")

  /** The box around the transformable selection, or null. */
  function selectionBox(): Box | null {
    const boxes = transformable()
      .map((item) => boundsOfItem(item))
      .filter((b): b is Box => !!b)
    if (!boxes.length) return null
    const x = Math.min(...boxes.map((b) => b.x))
    const y = Math.min(...boxes.map((b) => b.y))
    return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y }
  }

  function handleAt(p: Point): Handle | null {
    const b = selectionBox()
    if (!b) return null
    const near = (x: number, y: number) => Math.hypot(p.x - x, p.y - y) <= 7
    if (near(b.x + b.w / 2, b.y - 20)) return "rotate"
    if (near(b.x, b.y)) return "nw"
    if (near(b.x + b.w, b.y)) return "ne"
    if (near(b.x, b.y + b.h)) return "sw"
    if (near(b.x + b.w, b.y + b.h)) return "se"
    return null
  }

  /** Map every point of the selected items in `origin` through `f` (and
   * scale note text by `k`) into `d`. */
  function remap(d: Workspace, origin: Workspace, map: (p: Point) => Point, k = 1) {
    const r1 = (v: number) => Math.round(v * 10) / 10
    const f = (p: Point) => {
      const q = map(p)
      return { x: r1(q.x), y: r1(q.y) }
    }
    const items = transformable()
    const has = (kind: Item["kind"], id: string) => items.some((s) => s.kind === kind && s.id === id)
    for (const a of d.arrows) {
      const o0 = origin.arrows.find((x) => x.id === a.id)
      if (o0 && has("arrows", a.id)) {
        a.from = f(o0.from)
        a.to = f(o0.to)
      }
    }
    for (const st of d.strokes) {
      const o0 = origin.strokes.find((x) => x.id === st.id)
      if (o0 && has("strokes", st.id))
        st.points = o0.points.map(([x, y, t, pr]) => {
          const q = f({ x, y })
          return [q.x, q.y, t, pr]
        })
    }
    for (const n of d.notes) {
      const o0 = origin.notes.find((x) => x.id === n.id)
      if (o0 && has("notes", n.id)) {
        n.at = f(o0.at)
        n.size = Math.min(48, Math.max(9, Math.round(o0.size * k)))
      }
    }
  }

  function scaleTo(d: Extract<Draft, { kind: "scale" }>, p: Point, uniform: boolean) {
    const b = d.box
    const ax = d.handle === "nw" || d.handle === "sw" ? b.x + b.w : b.x
    const ay = d.handle === "nw" || d.handle === "ne" ? b.y + b.h : b.y
    const hx = ax === b.x ? b.x + b.w : b.x
    const hy = ay === b.y ? b.y + b.h : b.y
    let sx = (p.x - ax) / (hx - ax || 1)
    let sy = (p.y - ay) / (hy - ay || 1)
    if (uniform) sx = sy = Math.max(Math.abs(sx), Math.abs(sy)) * Math.sign(sx || 1)
    change(
      (w) =>
        remap(
          w,
          d.origin,
          (q) => ({ x: ax + (q.x - ax) * sx, y: ay + (q.y - ay) * sy }),
          Math.max(Math.abs(sx), Math.abs(sy)),
        ),
      false,
    )
  }

  function rotateTo(d: Extract<Draft, { kind: "rotate" }>, p: Point, snapped: boolean) {
    let a = Math.atan2(p.y - d.center.y, p.x - d.center.x) - d.from
    if (snapped) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12)
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const { x: cx, y: cy } = d.center
    change(
      (w) =>
        remap(w, d.origin, (q) => ({
          x: cx + (q.x - cx) * cos - (q.y - cy) * sin,
          y: cy + (q.x - cx) * sin + (q.y - cy) * cos,
        })),
      false,
    )
  }

  function translate(d: Workspace, items: Item[], dx: number, dy: number) {
    const has = (kind: Item["kind"], id: string) => items.some((s) => s.kind === kind && s.id === id)
    for (const a of d.arrows)
      if (has("arrows", a.id)) {
        a.from = { x: a.from.x + dx, y: a.from.y + dy }
        a.to = { x: a.to.x + dx, y: a.to.y + dy }
      }
    for (const s of d.strokes)
      if (has("strokes", s.id)) s.points = s.points.map(([x, y, t, p]) => [x + dx, y + dy, t, p])
    for (const n of d.notes) if (has("notes", n.id)) n.at = { x: n.at.x + dx, y: n.at.y + dy }
    for (const g of d.guides) if (has("guides", g.id)) g.at += g.axis === "x" ? dx : dy
  }

  function removeSelection(): boolean {
    const items = selection()
    if (!items.length) return false
    change((d) => {
      const keep = (kind: Item["kind"]) => (x: { id: string }) => !items.some((s) => s.kind === kind && s.id === x.id)
      d.arrows = d.arrows.filter(keep("arrows"))
      d.strokes = d.strokes.filter(keep("strokes"))
      d.notes = d.notes.filter(keep("notes"))
      d.guides = d.guides.filter(keep("guides"))
      d.measures = d.measures.filter(keep("measures"))
    })
    say(`Deleted ${items.length} annotation${items.length === 1 ? "" : "s"}`)
    setSelection([])
    return true
  }

  function selectAll() {
    const w = ws()
    setSelection([
      ...w.arrows.map((x) => ({ kind: "arrows" as const, id: x.id })),
      ...w.strokes.map((x) => ({ kind: "strokes" as const, id: x.id })),
      ...w.notes.map((x) => ({ kind: "notes" as const, id: x.id })),
      ...w.guides.map((x) => ({ kind: "guides" as const, id: x.id })),
      ...w.measures.map((x) => ({ kind: "measures" as const, id: x.id })),
    ])
    say(`${selection().length} selected`)
  }

  // --- notes and comments ------------------------------------------------------

  function addNote(p: Point) {
    const id = uid("n")
    change((d) => d.notes.push({ id, at: p, text: "", color: swatch(settings.annotate), size: 13 }))
    setEditing(id)
  }

  function commitNote(id: string, text: string) {
    setEditing(null)
    const note = ws().notes.find((n) => n.id === id)
    if (!note || note.text === text) {
      if (note && !text.trim()) change((d) => (d.notes = d.notes.filter((n) => n.id !== id)), false)
      return
    }
    if (!text.trim()) change((d) => (d.notes = d.notes.filter((n) => n.id !== id)), !!note.text)
    else change((d) => (d.notes.find((n) => n.id === id)!.text = text), !!note.text)
  }

  function startThread(e: PointerEvent, p: Point) {
    const hit = elementAt(e.clientX, e.clientY)
    const ov = overlay()
    if (!hit || !ov) return
    const el = controlOf(hit, o.content)
    const box = boxOf(el, ov)
    const anchor: Anchor = {
      path: pathOf(el, o.content),
      selector: `#${o.section} ${selectorOf(el, o.content)}`,
      label: labelOf(el),
      box,
      offset: { x: p.x - box.x, y: p.y - box.y },
    }
    const id = moving()
    if (id) {
      setMoving(null)
      change((w) => {
        const t = w.threads.find((x) => x.id === id)
        if (t) t.anchor = anchor
      })
      setOpenThread(id)
      say(`Comment moved to ${anchor.label}`)
      return
    }
    setDraftThread({ ...anchor, at: p })
    setOpenThread(null)
  }

  /** Point a thread at another element: the next Comment click places it. */
  function moveThread(id: string) {
    setMoving(id)
    setOpenThread(null)
    if (tool() !== "comment") setTool("comment")
    say("Click the element this comment is about")
  }

  function submitThread(text: string) {
    const d = draftThread()
    if (!d || !text.trim()) return
    const { at: _at, ...anchor } = d
    const id = uid("t")
    change((w) =>
      w.threads.push({
        id,
        n: Math.max(0, ...w.threads.map((t) => t.n)) + 1,
        anchor,
        messages: [{ id: uid("c"), text: text.trim(), at: Date.now() }],
        resolved: false,
      }),
    )
    setDraftThread(null)
    setOpenThread(id)
    say("Comment added")
  }

  function reply(id: string, text: string) {
    if (!text.trim()) return
    change((w) =>
      w.threads.find((t) => t.id === id)?.messages.push({ id: uid("c"), text: text.trim(), at: Date.now() }),
    )
  }

  function setResolved(id: string, resolved: boolean) {
    change((w) => {
      const t = w.threads.find((x) => x.id === id)
      if (t) t.resolved = resolved
    })
    say(resolved ? "Thread resolved" : "Thread reopened")
  }

  function removeThread(id: string) {
    change((w) => (w.threads = w.threads.filter((t) => t.id !== id)))
    if (openThread() === id) setOpenThread(null)
    say("Thread deleted")
  }

  function removeMessage(threadId: string, messageId: string) {
    change((w) => {
      const t = w.threads.find((x) => x.id === threadId)
      if (!t) return
      t.messages = t.messages.filter((m) => m.id !== messageId)
      if (!t.messages.length) w.threads = w.threads.filter((x) => x.id !== threadId)
    })
  }

  // --- pixels: the loupe's and the sampler's source ---------------------------

  const [snapshot, setSnapshot] = createSignal<{ canvas: HTMLCanvasElement; scale: number } | null>(null)
  let snapshotAt = 0
  const isOverlay = (node: HTMLElement) => node.classList?.contains("wb")

  async function refreshSnapshot() {
    if (busy()) return
    snapshotAt = performance.now()
    try {
      setSnapshot(await renderStage(o.host, isOverlay))
    } catch {
      setSnapshot(null)
    }
  }

  /** The stage's pixels around a point, the live canvases drawn over the
   * snapshot so animated surfaces read as they are now. */
  function paintPixels(ctx: CanvasRenderingContext2D, center: Point, cols: number, rows: number) {
    const snap = snapshot()
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, cols, rows)
    const bx = o.host.clientLeft
    const by = o.host.clientTop
    const x0 = center.x - Math.floor(cols / 2)
    const y0 = center.y - Math.floor(rows / 2)
    if (snap)
      ctx.drawImage(
        snap.canvas,
        (x0 + bx) * snap.scale,
        (y0 + by) * snap.scale,
        cols * snap.scale,
        rows * snap.scale,
        0,
        0,
        cols,
        rows,
      )
    const ov = overlay()
    if (!ov) return
    for (const c of o.content.querySelectorAll("canvas")) {
      const b = boxOf(c, ov)
      if (!intersects(b, { x: x0, y: y0, w: cols, h: rows }) || !c.width || !c.height) continue
      try {
        ctx.drawImage(c, b.x - x0, b.y - y0, b.w, b.h)
      } catch {
        // A tainted or lost context: the snapshot's pixels stand.
      }
    }
    if (performance.now() - snapshotAt > 1500) void refreshSnapshot()
  }

  const probe = typeof document !== "undefined" ? document.createElement("canvas") : null
  function pixelAt(p: Point): RGBA | null {
    if (!probe) return null
    probe.width = 1
    probe.height = 1
    const ctx = probe.getContext("2d", { willReadFrequently: true })
    if (!ctx) return null
    paintPixels(ctx, p, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return { r, g, b, a: Math.round((a / 255) * 1000) / 1000 }
  }

  async function addSample(c: RGBA) {
    setSamples([c, ...samples().filter((s) => !same(s, c))].slice(0, 8))
    const text = formatColor(c, settings.format)
    const ok = await copyText(text)
    if (ok) play("copy")
    say(ok ? `Copied ${text}` : text)
  }

  async function eyeDropper(): Promise<boolean> {
    const ED = (window as unknown as { EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> } }).EyeDropper
    if (!ED) return false
    try {
      const { sRGBHex } = await new ED().open()
      const c = parseColor(sRGBHex)
      if (c) await addSample(c)
    } catch {
      // Cancelled: the stage sampler stays in hand.
    }
    return true
  }

  // --- captures ----------------------------------------------------------------

  const toHost = (r: Box): Box => ({ x: r.x + o.host.clientLeft, y: r.y + o.host.clientTop, w: r.w, h: r.h })
  const paints = (n: number) =>
    new Promise<void>((res) => {
      const step = (k: number) => (k ? requestAnimationFrame(() => step(k - 1)) : res())
      step(n)
    })

  function drop(c: Capture | null) {
    if (c && "url" in c) URL.revokeObjectURL(c.url)
  }

  async function shoot(region: Box) {
    setBusy(true)
    setCapturing(true)
    await paints(2)
    try {
      const blob =
        settings.stills === "screen" && canShareTab()
          ? await grabRegion(o.host, toHost(region))
          : await renderRegion(o.host, toHost(region), isOverlay)
      drop(capture())
      setCapture({ kind: "shot", blob, url: URL.createObjectURL(blob) })
      say(`Captured ${region.w}×${region.h}`)
    } catch (err) {
      say((err as Error).name === "NotAllowedError" ? "Sharing was declined" : "The capture failed")
    } finally {
      setCapturing(false)
      setBusy(false)
    }
  }

  async function record(region: Box) {
    if (!canRecord()) return say("This browser cannot record a tab")
    setCapturing(true)
    try {
      const rec = await recordRegion(o.host, toHost(region), videoMime(), () => void finishRecording())
      drop(capture())
      setCapture({ kind: "recording", rec })
      say("Recording. Escape or Stop ends it.")
    } catch (err) {
      setCapturing(false)
      say((err as Error).name === "NotAllowedError" ? "Sharing was declined" : "Recording could not start")
    }
  }

  async function finishRecording() {
    const c = capture()
    if (c?.kind !== "recording") return
    const blob = await c.rec.stop()
    if (capture() !== c) return
    setCapturing(false)
    const url = URL.createObjectURL(blob)
    const video = document.createElement("video")
    video.src = url
    await new Promise((r) => (video.onloadedmetadata = r))
    const duration = await durationOf(video)
    setCapture({ kind: "video", blob, url, duration, start: 0, end: duration })
    say(`Recorded ${duration.toFixed(1)} s`)
  }

  async function exportVideo() {
    const c = capture()
    if (c?.kind !== "video") return
    if (videoMime() === GIF) return exportGif(c)
    const type = videoTypes().find((t) => t.mime === videoMime()) ?? videoTypes()[0]
    if (!type) return
    setBusy(true)
    try {
      const trimmed = c.start > 0.05 || c.end < c.duration - 0.05
      const blob =
        trimmed || !c.blob.type.startsWith(type.mime.split(";")[0])
          ? await trimVideo(c.blob, c.start, c.end, type.mime)
          : c.blob
      download(blob, `${o.key.replace(/[^\w-]+/g, "-")}.${type.ext}`)
      say("Video saved")
    } finally {
      setBusy(false)
    }
  }

  /** The cut as a looping GIF, dithered with the kit's matrix. */
  async function exportGif(c: Extract<Capture, { kind: "video" }>) {
    setBusy(true)
    say("Encoding the GIF…")
    try {
      const { frames, width, height, delay } = await videoFrames(c.blob, c.start, c.end)
      await paints(1)
      const bytes = encodeGif(frames, width, height, delay, { matrix: BAYER8 })
      download(new Blob([bytes as BlobPart], { type: "image/gif" }), `${o.key.replace(/[^\w-]+/g, "-")}.gif`)
      say(`GIF saved: ${frames.length} frames, ${(bytes.length / 1024).toFixed(0)} kB`)
    } catch {
      say("The GIF could not be encoded")
    } finally {
      setBusy(false)
    }
  }

  function discardCapture() {
    drop(capture())
    setCapture(null)
  }

  // --- the agent hand-off ---------------------------------------------------------

  async function copyForAgent() {
    const md = feedbackMarkdown(ws(), {
      title: o.title,
      url: o.url,
      stage: size(),
      theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    })
    if (o.send) {
      o.send(md)
      play("copy")
      say("Sent the feedback to the agent")
      return
    }
    const ok = await copyText(md)
    if (ok) play("copy")
    say(ok ? "Copied the feedback for an agent" : "Copy failed")
  }
  /** What K does with the feedback, in words. */
  const feedbackVerb = o.send ? "Send feedback to the agent" : "Copy feedback for an agent"

  // --- pointer -----------------------------------------------------------------

  function down(e: PointerEvent) {
    if (e.button !== 0 || !overlay()) return
    current = me
    const p = toStage(e)
    const t = tool()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    e.preventDefault()
    switch (t) {
      case "inspect":
      case "xray":
      case "type":
      case "a11y": {
        const hit = elementAt(e.clientX, e.clientY)
        setPinned(hit)
        if (hit) say(`Pinned ${labelOf(hit)}`)
        o.host.focus({ preventScroll: true })
        break
      }
      case "color":
      case "loupe": {
        const c = pixelAt(p)
        if (c) void addSample(c)
        break
      }
      case "guides": {
        const before = JSON.stringify(ws())
        history.record(ws())
        const hit = guideNear(p)
        if (hit) setDraft({ kind: "guide", id: hit.id, before })
        else {
          const id = uid("g")
          const axis = guideAxis()
          const at = snapGuide(axis === "x" ? p.x : p.y, axis)
          change((d) => d.guides.push({ id, axis, at }), false)
          setDraft({ kind: "guide", id, before })
        }
        break
      }
      case "select": {
        const handle = handleAt(p)
        if (handle) {
          const box = selectionBox()!
          const before = JSON.stringify(ws())
          history.record(ws())
          const origin = clone(ws())
          const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 }
          setDraft(
            handle === "rotate"
              ? { kind: "rotate", center, from: Math.atan2(p.y - center.y, p.x - center.x), origin, before }
              : { kind: "scale", handle, box, origin, before },
          )
          break
        }
        const hit = itemAt(p)
        if (hit) {
          if (!isSelected(hit)) setSelection(e.shiftKey ? [...selection(), hit] : [hit])
          const before = JSON.stringify(ws())
          history.record(ws())
          setDraft({ kind: "move", last: p, before })
        } else setDraft({ kind: "marquee", from: p, to: p, base: e.shiftKey ? selection() : [] })
        break
      }
      case "arrow":
        dockBoxes = elementBoxes()
        setDraft({ kind: "arrow", from: dockAt(p), to: p })
        break
      case "pen": {
        const q = toStage(e, true)
        setDraft({ kind: "stroke", points: [[q.x, q.y, e.timeStamp, e.pointerType === "pen" ? e.pressure : -1]] })
        break
      }
      case "eraser": {
        const before = JSON.stringify(ws())
        history.record(ws())
        setDraft({ kind: "erase", before })
        eraseAt(p)
        break
      }
      case "text":
        if (!editing()) addNote(p)
        break
      case "comment":
        startThread(e, p)
        break
      case "shot":
      case "video":
        if (capture()?.kind === "recording" || busy()) break
        setDraft({ kind: "region", from: p, to: p, for: t })
        break
    }
  }

  function eraseAt(p: Point) {
    const radius = Math.max(8, settings.inkWidth * 2)
    const hit = ws().strokes.some((s) => s.points.some(([x, y]) => Math.hypot(x - p.x, y - p.y) <= radius))
    if (!hit) return
    change((d) => {
      d.strokes = d.strokes.flatMap((s) => {
        const runs = erase(s.points, p, radius)
        if (runs.length === 1 && runs[0].length === s.points.length) return [s]
        return runs.map((points, i) => ({ ...s, id: i ? uid("s") : s.id, points }))
      })
    }, false)
  }

  const clampStage = (p: Point): Point => ({
    x: Math.min(size().w, Math.max(0, p.x)),
    y: Math.min(size().h, Math.max(0, p.y)),
  })

  function move(e: PointerEvent) {
    if (!overlay()) return
    const p = toStage(e)
    setPointer(p)
    client = { x: e.clientX, y: e.clientY }
    const d = draft()
    const t = tool()
    if (!d) {
      if (HOVER_TOOLS.has(t)) setHovered(elementAt(e.clientX, e.clientY))
      if (t === "guides") setGuideHover(guideNear(p) ? null : snapGuide(guideAxis() === "x" ? p.x : p.y, guideAxis()))
      if (t === "select") setHandleHover(selection().length ? handleAt(p) : null)
      return
    }
    switch (d.kind) {
      case "arrow":
        setDraft({ ...d, to: dockAt(p) })
        break
      case "stroke": {
        const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : []
        const points = [...d.points]
        for (const ev of events.length ? events : [e]) {
          const q = toStage(ev, true)
          points.push([q.x, q.y, ev.timeStamp, ev.pointerType === "pen" ? ev.pressure : -1])
        }
        setDraft({ ...d, points })
        break
      }
      case "region":
        setDraft({ ...d, to: clampStage(p) })
        break
      case "marquee": {
        setDraft({ ...d, to: p })
        const r = boxFrom(d.from, p)
        const all: Item[] = [
          ...ws().arrows.map((x) => ({ kind: "arrows" as const, id: x.id })),
          ...ws().strokes.map((x) => ({ kind: "strokes" as const, id: x.id })),
          ...ws().notes.map((x) => ({ kind: "notes" as const, id: x.id })),
          ...ws().measures.map((x) => ({ kind: "measures" as const, id: x.id })),
        ]
        const hit = all.filter((item) => {
          const b = boundsOfItem(item)
          return b && intersects(b, r)
        })
        setSelection([...d.base, ...hit.filter((h) => !d.base.some((s) => s.kind === h.kind && s.id === h.id))])
        break
      }
      case "guide": {
        const g = ws().guides.find((x) => x.id === d.id)
        if (g) {
          const at = snapGuide(g.axis === "x" ? p.x : p.y, g.axis, g.id)
          change((w) => (w.guides.find((x) => x.id === d.id)!.at = at), false)
        }
        break
      }
      case "move": {
        const dx = p.x - d.last.x
        const dy = p.y - d.last.y
        if (dx || dy) {
          const items = selection()
          change((w) => translate(w, items, dx, dy), false)
          setDraft({ ...d, last: p })
        }
        break
      }
      case "erase":
        eraseAt(p)
        break
      case "scale":
        scaleTo(d, p, e.shiftKey)
        break
      case "rotate":
        rotateTo(d, p, e.shiftKey)
        break
    }
  }

  function up(e: PointerEvent) {
    const d = draft()
    setDraft(null)
    if (!d || !overlay()) return
    const p = toStage(e)
    switch (d.kind) {
      case "arrow":
        if (Math.hypot(d.to.x - d.from.x, d.to.y - d.from.y) > 4)
          change((w) =>
            w.arrows.push({ id: uid("a"), from: d.from, to: d.to, color: swatch(settings.annotate), width: 2 }),
          )
        break
      case "stroke": {
        const marker = settings.pen === "marker"
        change((w) =>
          w.strokes.push({
            id: uid("s"),
            kind: settings.pen,
            color: swatch(marker ? settings.markerSwatch : settings.inkSwatch),
            width: marker ? settings.markerWidth : settings.inkWidth,
            points: d.points.map(([x, y, t, pr]) => [
              Math.round(x * 10) / 10,
              Math.round(y * 10) / 10,
              Math.round(t),
              pr,
            ]),
          }),
        )
        break
      }
      case "region": {
        const r = boxFrom(d.from, d.to)
        const region = r.w < 4 || r.h < 4 ? { x: 0, y: 0, w: size().w, h: size().h } : r
        void (d.for === "shot" ? shoot(region) : record(region))
        break
      }
      case "guide": {
        const out = p.x < -8 || p.y < -8 || p.x > size().w + 8 || p.y > size().h + 8
        if (out) {
          change((w) => (w.guides = w.guides.filter((g) => g.id !== d.id)), false)
          say("Guide removed")
        }
        settle(d.before)
        break
      }
      case "move":
      case "erase":
      case "scale":
      case "rotate":
        settle(d.before)
        break
    }
  }

  /** Double-click a note (any annotate tool, or Select) to write in it again. */
  function editAt(e: MouseEvent) {
    if (!overlay()) return
    const hit = itemAt(toStage(e))
    if (hit?.kind === "notes") setEditing(hit.id)
  }

  /** The loupe zooms with the wheel (2–32 px per pixel). */
  function wheel(e: WheelEvent) {
    if (tool() !== "loupe" && tool() !== "color") return
    e.preventDefault()
    setLoupeZoom(Math.min(32, Math.max(2, Math.round(loupeZoom() * (e.deltaY < 0 ? 1.25 : 0.8)))))
  }

  function leave() {
    if (!draft()) setHovered(null)
    setPointer(null)
    setGuideHover(null)
  }

  /** A guide pulled out of a ruler: the top ruler gives a horizontal
   * guide, the left one a vertical guide; dropped back off the stage, it
   * goes. */
  function pullGuide(e: PointerEvent, axis: "x" | "y") {
    if (e.button !== 0 || !overlay()) return
    e.preventDefault()
    const before = JSON.stringify(ws())
    history.record(ws())
    const id = uid("g")
    const p = toStage(e)
    change((w) => w.guides.push({ id, axis, at: axis === "x" ? p.x : p.y }), false)
    const onMove = (ev: PointerEvent) => {
      const q = toStage(ev)
      const at = snapGuide(axis === "x" ? q.x : q.y, axis, id)
      change((w) => (w.guides.find((g) => g.id === id)!.at = at), false)
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      const q = toStage(ev)
      const at = axis === "x" ? q.x : q.y
      if (at < 0 || at > (axis === "x" ? size().w : size().h))
        change((w) => (w.guides = w.guides.filter((g) => g.id !== id)), false)
      settle(before)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  // --- keyboard ----------------------------------------------------------------

  function pinMeasure() {
    const m = altMeasure()
    if (!m) return
    change((w) => {
      if (!settings.multiMeasure) w.measures = []
      w.measures.push({ id: uid("m"), from: { label: m.fromLabel, box: m.from }, to: { label: m.toLabel, box: m.to } })
    })
    say(`Kept the distance from ${m.fromLabel} to ${m.toLabel}`)
  }

  function escape(): boolean {
    if (draft()) setDraft(null)
    else if (moving()) setMoving(null)
    else if (capture()?.kind === "recording") void finishRecording()
    else if (draftThread() || openThread()) {
      setDraftThread(null)
      setOpenThread(null)
    } else if (selection().length) setSelection([])
    else if (pinned()) setPinned(null)
    else if (panel()) setPanel(null)
    else if (tool()) setTool(null)
    else {
      o.exit()
      return true
    }
    return true
  }

  const DIRS: Record<string, "up" | "down" | "prev" | "next"> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "prev",
    ArrowRight: "next",
  }

  function arrowKey(e: KeyboardEvent): boolean {
    const t = tool()
    if (t === "select" && selection().length) {
      const step = e.shiftKey ? 10 : 1
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
      const items = selection()
      change((w) => translate(w, items, dx, dy))
      return true
    }
    if (TARGET_TOOLS.has(t)) {
      const from = pinned() ?? hovered()
      const next = from ? (walk(from, o.content, DIRS[e.key]) ?? from) : o.content.firstElementChild
      setPinned(next)
      if (next) say(`Pinned ${labelOf(next)}`)
      return true
    }
    return false
  }

  const typing = (t: EventTarget | null) => {
    const el = t as HTMLElement | null
    return (
      !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)
    )
  }

  function onKeyDown(e: KeyboardEvent) {
    if (current !== me || !(hot() || o.card.contains(document.activeElement))) return
    if (e.key === "Alt") {
      if (!alt()) setAltFrom(pinned() ?? hovered())
      setAlt(true)
      return
    }
    if (typing(e.target)) return
    const mod = e.metaKey || e.ctrlKey
    const k = e.key.toLowerCase()
    if (mod) {
      if (k === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === "y") {
        e.preventDefault()
        redo()
      } else if (k === "a" && tool() === "select") {
        e.preventDefault()
        selectAll()
      }
      return
    }
    if (e.altKey) {
      if (e.code === "KeyS") {
        e.preventDefault()
        pinMeasure()
      }
      return
    }
    if (e.key === "Escape") {
      if (escape()) e.preventDefault()
      return
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      if (removeSelection()) e.preventDefault()
      return
    }
    if (e.key in DIRS) {
      if (arrowKey(e)) e.preventDefault()
      return
    }
    if (e.shiftKey && k !== "?") return
    if (tool() === "guides" && (k === "h" || k === "v")) {
      setGuideAxis(k === "h" ? "y" : "x")
      say(k === "h" ? "Horizontal guides" : "Vertical guides")
      return
    }
    if (k === "1" || k === "2") return setGroup(k === "1" ? 1 : 2)
    if (k === "k") return void copyForAgent()
    if (k === ",") {
      setPanel(panel() === "settings" ? null : "settings")
      return
    }
    const t = TOOLS.find((x) => x.key === k)
    if (t) {
      e.preventDefault()
      setTool(t.id)
      return
    }
    const g = TOGGLES.find((x) => x.key === k)
    if (g) {
      e.preventDefault()
      toggle(g.id)
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === "Alt") {
      setAlt(false)
      setAltFrom(null)
    }
  }

  const onBlur = () => {
    setAlt(false)
  }
  const onEnter = () => {
    current = me
    setHot(true)
  }
  const onLeave = () => {
    setHot(false)
    leave()
  }
  const onFocusIn = () => {
    current = me
  }

  // --- lifecycle ----------------------------------------------------------------

  // The frame keeps a lane free on the edge the tray docks to.
  createEffect(() => (o.host.dataset.tray = settings.tray))

  function start() {
    current = me
    raf = requestAnimationFrame(frame)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    o.host.addEventListener("pointerenter", onEnter)
    o.host.addEventListener("pointerleave", onLeave)
    o.card.addEventListener("focusin", onFocusIn)
    if (o.host.matches(":hover")) setHot(true)
  }

  function stop() {
    cancelAnimationFrame(raf)
    clearTimeout(saveTimer)
    if (settings.persist) saveWorkspace(o.key, ws())
    window.removeEventListener("keydown", onKeyDown)
    window.removeEventListener("keyup", onKeyUp)
    window.removeEventListener("blur", onBlur)
    o.host.removeEventListener("pointerenter", onEnter)
    o.host.removeEventListener("pointerleave", onLeave)
    o.card.removeEventListener("focusin", onFocusIn)
    const c = capture()
    if (c?.kind === "recording") void c.rec.stop()
    drop(c)
    if (isDirected()) release()
    delete o.host.dataset.tray
    if (current === me) current = null
  }

  return {
    o,
    settings,
    overlay,
    setOverlay,
    tool,
    group,
    toggles,
    panel,
    setPanel,
    minimized,
    setMinimized,
    status,
    say,
    ws,
    revision,
    history,
    change,
    undo,
    redo,
    clearAll,
    size,
    pointer,
    hot,
    hovered,
    pinned,
    reading,
    ghost,
    typeReading,
    a11y,
    aim,
    order,
    marks,
    xray,
    alt,
    altMeasure,
    pins,
    guideAxis,
    setGuideAxis,
    guideHover,
    handleHover,
    draft,
    selection,
    isSelected,
    boundsOfItem,
    selectionBox,
    handleAt,
    editing,
    commitNote,
    openThread,
    setOpenThread,
    draftThread,
    setDraftThread,
    submitThread,
    moving,
    moveThread,
    reply,
    setResolved,
    removeThread,
    removeMessage,
    samples,
    addSample,
    eyeDropper,
    snapshot,
    paintPixels,
    capture,
    setCapture,
    capturing,
    busy,
    videoMime,
    setVideoMime,
    loupeZoom,
    finishRecording,
    exportVideo,
    discardCapture,
    copyForAgent,
    feedbackVerb,
    setTool,
    setGroup,
    toggle,
    down,
    move,
    up,
    leave,
    editAt,
    wheel,
    pullGuide,
    removeSelection,
    pinMeasure,
    escape,
    start,
    stop,
  }
}

export type Bench = ReturnType<typeof createBench>
