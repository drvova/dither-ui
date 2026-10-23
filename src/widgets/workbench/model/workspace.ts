// A preview's workspace: what the reader has laid over it — guides and a
// layout grid, arrows, ink, text notes, pinned measurements and comment
// threads anchored to live elements. Plain data (stage px), undoable by
// snapshot, saved per preview in localStorage (sanitized on the way back
// in: storage is untrusted), and written out as Markdown for an agent.
import type { Box, Point } from "./geometry"
import type { InkPoint } from "./ink"

export type Guide = { id: string; axis: "x" | "y"; at: number }
export type Arrow = { id: string; from: Point; to: Point; color: string; width: number }
export type Stroke = { id: string; kind: "ink" | "marker"; color: string; width: number; points: InkPoint[] }
export type Note = { id: string; at: Point; text: string; color: string; size: number }
export type Endpoint = { label: string; box: Box }
export type Measure = { id: string; from: Endpoint; to: Endpoint }
export type Message = { id: string; text: string; at: number }
export type Anchor = { path: number[]; selector: string; label: string; box: Box; offset: Point }
export type Thread = { id: string; n: number; anchor: Anchor; messages: Message[]; resolved: boolean }
export type Grid = {
  columns: number
  gutter: number
  margin: number
  rows: number
  rowGutter: number
  pixel: number
  show: { columns: boolean; rows: boolean; pixel: boolean }
}
export type Workspace = {
  guides: Guide[]
  arrows: Arrow[]
  strokes: Stroke[]
  notes: Note[]
  measures: Measure[]
  threads: Thread[]
  grid: Grid
}

/** The annotation kinds a selection can hold. */
export type Kind = "guides" | "arrows" | "strokes" | "notes" | "measures"
export type Item = { kind: Kind; id: string }

export const emptyGrid = (): Grid => ({
  columns: 12,
  gutter: 16,
  margin: 24,
  rows: 6,
  rowGutter: 16,
  pixel: 8,
  show: { columns: false, rows: false, pixel: false },
})

export const emptyWorkspace = (): Workspace => ({
  guides: [],
  arrows: [],
  strokes: [],
  notes: [],
  measures: [],
  threads: [],
  grid: emptyGrid(),
})

let seq = 0
export const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`

export const isEmpty = (ws: Workspace) =>
  !ws.guides.length &&
  !ws.arrows.length &&
  !ws.strokes.length &&
  !ws.notes.length &&
  !ws.measures.length &&
  !ws.threads.length

// --- sanitizing -------------------------------------------------------------

const LIMIT = 500
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const fin = (v: unknown, fallback = 0, lo = -1e5, hi = 1e5) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback
const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "")
const id = (v: unknown, prefix: string) => (typeof v === "string" && /^[\w-]{1,40}$/.test(v) ? v : uid(prefix))
/** Colours a reader can pick: hex, a theme token, or a CSS keyword. */
export const safeColor = (v: unknown, fallback: string) =>
  typeof v === "string" && /^(#[0-9a-f]{3,8}|var\(--[\w-]+\)|[a-z]{3,20})$/i.test(v) ? v : fallback
const arr = <T>(v: unknown, each: (x: unknown) => T | null, max = LIMIT): T[] =>
  Array.isArray(v)
    ? v
        .slice(0, max)
        .map(each)
        .filter((x): x is T => x !== null)
    : []
const point = (v: unknown): Point | null => (isObj(v) ? { x: fin(v.x), y: fin(v.y) } : null)
const box = (v: unknown): Box =>
  isObj(v) ? { x: fin(v.x), y: fin(v.y), w: fin(v.w, 0, 0), h: fin(v.h, 0, 0) } : { x: 0, y: 0, w: 0, h: 0 }
const endpoint = (v: unknown): Endpoint | null => (isObj(v) ? { label: str(v.label, 120), box: box(v.box) } : null)

/** Untrusted JSON → a workspace; anything malformed is dropped or reset. */
export function normalizeWorkspace(raw: unknown): Workspace {
  const ws = emptyWorkspace()
  if (!isObj(raw)) return ws
  ws.guides = arr(raw.guides, (g) =>
    isObj(g) && (g.axis === "x" || g.axis === "y") ? { id: id(g.id, "g"), axis: g.axis, at: fin(g.at) } : null,
  )
  ws.arrows = arr(raw.arrows, (a) => {
    if (!isObj(a)) return null
    const from = point(a.from)
    const to = point(a.to)
    return from && to
      ? {
          id: id(a.id, "a"),
          from,
          to,
          color: safeColor(a.color, "var(--swatch-orange)"),
          width: fin(a.width, 2, 1, 12),
        }
      : null
  })
  ws.strokes = arr(raw.strokes, (s) => {
    if (!isObj(s)) return null
    const points = arr(
      s.points,
      (p) =>
        Array.isArray(p) && p.length === 4
          ? ([fin(p[0]), fin(p[1]), fin(p[2], 0, 0, 1e13), fin(p[3], -1, -1, 1)] as InkPoint)
          : null,
      5000,
    )
    return points.length
      ? {
          id: id(s.id, "s"),
          kind: s.kind === "marker" ? "marker" : "ink",
          color: safeColor(s.color, "var(--swatch-orange)"),
          width: fin(s.width, 3, 1, 48),
          points,
        }
      : null
  })
  ws.notes = arr(raw.notes, (n) => {
    if (!isObj(n)) return null
    const at = point(n.at)
    return at
      ? {
          id: id(n.id, "n"),
          at,
          text: str(n.text),
          color: safeColor(n.color, "var(--foreground)"),
          size: fin(n.size, 13, 9, 48),
        }
      : null
  })
  ws.measures = arr(raw.measures, (m) => {
    if (!isObj(m)) return null
    const from = endpoint(m.from)
    const to = endpoint(m.to)
    return from && to ? { id: id(m.id, "m"), from, to } : null
  })
  ws.threads = arr(raw.threads, (t) => {
    if (!isObj(t) || !isObj(t.anchor)) return null
    const a = t.anchor
    const messages = arr(t.messages, (m) =>
      isObj(m) && str(m.text) ? { id: id(m.id, "c"), text: str(m.text), at: fin(m.at, 0, 0, 1e13) } : null,
    )
    if (!messages.length) return null
    return {
      id: id(t.id, "t"),
      n: Math.round(fin(t.n, 1, 1, 9999)),
      anchor: {
        path: arr(a.path, (i) => (typeof i === "number" && Number.isInteger(i) && i >= 0 && i < 1e4 ? i : null), 64),
        selector: str(a.selector, 400),
        label: str(a.label, 120),
        box: box(a.box),
        offset: point(a.offset) ?? { x: 0, y: 0 },
      },
      messages,
      resolved: t.resolved === true,
    }
  })
  if (isObj(raw.grid)) {
    const g = raw.grid
    const show = isObj(g.show) ? g.show : {}
    ws.grid = {
      columns: Math.round(fin(g.columns, 12, 1, 48)),
      gutter: fin(g.gutter, 16, 0, 200),
      margin: fin(g.margin, 24, 0, 400),
      rows: Math.round(fin(g.rows, 6, 1, 48)),
      rowGutter: fin(g.rowGutter, 16, 0, 200),
      pixel: fin(g.pixel, 8, 2, 128),
      show: { columns: show.columns === true, rows: show.rows === true, pixel: show.pixel === true },
    }
  }
  return ws
}

// --- history ----------------------------------------------------------------

/** Snapshot undo/redo: record the state before each change. */
export function createHistory(limit = 100) {
  const past: string[] = []
  const future: string[] = []
  return {
    record(before: Workspace) {
      past.push(JSON.stringify(before))
      if (past.length > limit) past.shift()
      future.length = 0
    },
    undo(current: Workspace): Workspace | null {
      const prev = past.pop()
      if (!prev) return null
      future.push(JSON.stringify(current))
      return JSON.parse(prev) as Workspace
    },
    redo(current: Workspace): Workspace | null {
      const next = future.pop()
      if (!next) return null
      past.push(JSON.stringify(current))
      return JSON.parse(next) as Workspace
    },
    /** Forget the last record: the gesture it opened changed nothing. */
    drop() {
      past.pop()
    },
    get canUndo() {
      return past.length > 0
    },
    get canRedo() {
      return future.length > 0
    },
  }
}

// --- persistence ------------------------------------------------------------

const PREFIX = "dither-workbench:"

export function loadWorkspace(key: string): Workspace {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? normalizeWorkspace(JSON.parse(raw)) : emptyWorkspace()
  } catch {
    return emptyWorkspace()
  }
}

export function saveWorkspace(key: string, ws: Workspace): void {
  try {
    if (isEmpty(ws) && !Object.values(ws.grid.show).some(Boolean)) localStorage.removeItem(PREFIX + key)
    else localStorage.setItem(PREFIX + key, JSON.stringify(ws))
  } catch {
    // Storage full or blocked: the workspace lives for the visit only.
  }
}

// --- agent hand-off ---------------------------------------------------------

export type FeedbackContext = { title: string; url: string; stage: { w: number; h: number }; theme: string }

const at = (b: Box) => `${b.x},${b.y} ${b.w}×${b.h}`

/** The workspace as Markdown for a coding agent: where, what is commented,
 * what was measured, what was drawn. */
export function feedbackMarkdown(ws: Workspace, ctx: FeedbackContext): string {
  const lines = [
    `# Feedback — ${ctx.title}`,
    "",
    `${ctx.url} · stage ${ctx.stage.w}×${ctx.stage.h} px · ${ctx.theme} theme`,
  ]
  const open = ws.threads.filter((t) => !t.resolved)
  if (ws.threads.length) {
    lines.push("", `## Comments (${open.length} open, ${ws.threads.length - open.length} resolved)`)
    for (const t of [...ws.threads].sort((a, b) => a.n - b.n)) {
      lines.push(
        "",
        `${t.n}. ${t.resolved ? "[resolved] " : ""}${t.anchor.label} — \`${t.anchor.selector}\` at ${at(t.anchor.box)}`,
      )
      t.messages.forEach((m, i) => lines.push(`${i ? "   - reply: " : "   > "}${m.text.replace(/\n/g, " ")}`))
    }
  }
  if (ws.measures.length) {
    lines.push("", "## Measurements")
    for (const m of ws.measures) lines.push(`- ${m.from.label} (${at(m.from.box)}) → ${m.to.label} (${at(m.to.box)})`)
  }
  const guides = ws.guides.length
    ? [
        ...(["x", "y"] as const).map((axis) => {
          const list = ws.guides.filter((g) => g.axis === axis).map((g) => `${Math.round(g.at)}`)
          return list.length ? `${axis === "x" ? "vertical" : "horizontal"} at ${list.join(", ")} px` : ""
        }),
      ].filter(Boolean)
    : []
  const g = ws.grid
  if (g.show.columns) guides.push(`${g.columns} columns, ${g.gutter} px gutter, ${g.margin} px margin`)
  if (g.show.rows) guides.push(`${g.rows} rows, ${g.rowGutter} px gutter`)
  if (g.show.pixel) guides.push(`${g.pixel} px grid`)
  if (guides.length) lines.push("", "## Guides", ...guides.map((s) => `- ${s}`))
  if (ws.notes.length || ws.arrows.length || ws.strokes.length) {
    lines.push("", "## Annotations")
    for (const n of ws.notes)
      lines.push(`- note at ${Math.round(n.at.x)},${Math.round(n.at.y)}: “${n.text.replace(/\n/g, " ")}”`)
    for (const a of ws.arrows)
      lines.push(
        `- arrow ${Math.round(a.from.x)},${Math.round(a.from.y)} → ${Math.round(a.to.x)},${Math.round(a.to.y)}`,
      )
    if (ws.strokes.length) lines.push(`- ${ws.strokes.length} pen stroke${ws.strokes.length === 1 ? "" : "s"}`)
  }
  if (lines.length === 3) lines.push("", "Nothing annotated yet.")
  return lines.join("\n") + "\n"
}
