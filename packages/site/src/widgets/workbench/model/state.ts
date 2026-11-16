// The workbench controller's state (`../bench.ts`): what the host passes in,
// the settings, the tool in hand, the undoable workspace and its saving, and
// every signal the overlay renders from. The controller's parts (the
// measuring loop, the selection, notes, pixels, the recorder, the gestures
// and the keys) each take it whole and read and write through it.
import { createEffect, createSignal, on } from "solid-js"
import { createMutable } from "solid-js/store"
import { play } from "@/shared/lib/sound"
import { videoTypes, type Recording } from "@/widgets/workbench/model/capture"
import type { RGBA } from "@/shared/lib/inspect/color"
import type { Box, Point, Segment } from "@/shared/lib/inspect/geometry"
import type { InkPoint } from "@/widgets/workbench/model/ink"
import type { Issue, Reading, TypeReading } from "@/shared/lib/inspect/measure"
import { loadSettings, saveSettings, type Settings } from "@/widgets/workbench/model/settings"
import type { ToggleId, ToolId } from "@/widgets/workbench/model/tools"
import {
  createHistory,
  emptyWorkspace,
  loadWorkspace,
  saveWorkspace,
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
type Mark = { box: Box; kind: Issue["kind"]; note: string }

export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
export const HOVER_TOOLS = new Set<ToolId | null>(["inspect", "xray", "type", "a11y", "comment"])
export const TARGET_TOOLS = new Set<ToolId | null>(["inspect", "xray", "type", "a11y"])
/** The preview whose keys these are: last pointed at or focused. */
let current: symbol | null = null
/** This preview takes the keys. */
export const ownKeys = (me: symbol) => {
  current = me
}
/** Whether the keys are this preview's. */
export const hasKeys = (me: symbol) => current === me
/** This preview lets the keys go, if it held them. */
export const dropKeys = (me: symbol) => {
  if (current === me) current = null
}
/** The workbench's own overlay, left out of every capture and snapshot. */
export const isOverlay = (node: HTMLElement) => node.classList?.contains("wb")

/** The controller's state: the options, the settings, every signal the
 * parts read and write, and the undoable workspace. */
export function createState(o: BenchOptions) {
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
  /** Save now (the workbench closing): the debounced save would be too late. */
  function flush() {
    clearTimeout(saveTimer)
    if (settings.persist) saveWorkspace(o.key, ws())
  }
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

  return {
    o,
    me,
    settings,
    overlay,
    setOverlay,
    tool,
    holdTool,
    group,
    showGroup,
    toggles,
    panel,
    setPanel,
    minimized,
    setMinimized,
    status,
    say,
    ws,
    setWs,
    history,
    revision,
    setRevision,
    change,
    settle,
    undo,
    redo,
    flush,
    clearAll,
    size,
    setSize,
    pointer,
    setPointer,
    hot,
    setHot,
    hovered,
    setHovered,
    pinned,
    setPinned,
    reading,
    setReading,
    ghost,
    setGhost,
    typeReading,
    setTypeReading,
    a11y,
    setA11y,
    aim,
    setAim,
    order,
    setOrder,
    marks,
    setMarks,
    xray,
    setXray,
    alt,
    setAlt,
    altFrom,
    setAltFrom,
    altMeasure,
    setAltMeasure,
    pins,
    setPins,
    guideAxis,
    setGuideAxis,
    guideHover,
    setGuideHover,
    handleHover,
    setHandleHover,
    draft,
    setDraft,
    selection,
    setSelection,
    editing,
    setEditing,
    openThread,
    setOpenThread,
    draftThread,
    setDraftThread,
    moving,
    setMoving,
    samples,
    setSamples,
    capture,
    setCapture,
    capturing,
    setCapturing,
    busy,
    setBusy,
    videoMime,
    setVideoMime,
    loupeZoom,
    setLoupeZoom,
    toStage,
    elementAt,
    /** The pointer's last viewport point (Alt's distances measure to what is under it). */
    client: null as Point | null,
  }
}

export type State = ReturnType<typeof createState>
