// The composer's thread as data: every entry it shows, and every reading of
// it the panel needs (the chat's title, the turn's to-dos, what the turn
// changed, the steps folded into runs). Pure: the panel owns the state,
// these only read it, so each is tested without a DOM.
import type { IconName } from "@dither-kit"
import { type Changed, toolStep } from "./steps"

type Result = { ok: true; data: unknown } | { ok: false; error: string }

export type Entry =
  /** Your message: its turn (the checkpoint it keeps), the frames it
   * carried, and whether they went as pictures. */
  | { kind: "user" | "followup"; text: string; turn?: number; context?: Changed[]; pictured?: boolean }
  | { kind: "assistant" | "system" | "error"; text: string }
  /** The harness's reasoning: open while it streams, then folded under how
   * long it took. */
  | { kind: "thought"; text: string; ms?: number; open?: boolean }
  | {
      kind: "tool"
      name: string
      title?: string
      icon?: IconName
      summary: string
      detail: string
      ok: boolean
      open: boolean
      turn?: number
      changed?: Changed[]
      mutates?: boolean
    }
  | { kind: "activity"; id: string; title: string; status: string; tool?: string }
  | { kind: "plan"; entries: { content: string; status: string }[] }
  | {
      kind: "approval"
      title: string
      options: { id: string; label: string; primary?: boolean }[]
      answered: string | null
      /** What would run: a built tool's code, to read before saying yes. */
      code?: string
    }
  /** The end of a turn: how long the harness worked, and how the turn
   * ended when not on its own (you stopped it, or it failed). */
  | { kind: "worked"; ms: number; end?: "stopped" | "failed" }

export type ToolEntry = Extract<Entry, { kind: "tool" }>
export type Todo = { content: string; status: string }

const short = (v: unknown, n = 36): string => {
  const s =
    typeof v === "string" ? v : Array.isArray(v) ? `[${v.length}]` : typeof v === "object" && v ? "{…}" : String(v)
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

/** A Studio tool call's arguments in one line (the step's hover title). */
export function describeArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "add_screen":
      return `${short(args.name ?? "screen")}, ${Array.isArray(args.rows) ? args.rows.length : 0} rows`
    case "add_component":
      return `${short(args.is)}${args.name ? `, ${short(args.name)}` : ""}`
    case "add_chart": {
      const d = args.data as { labels?: unknown[] } | undefined
      return `${short(args.chart)}${args.name ? `, ${short(args.name)}` : ""}${d?.labels ? `, ${d.labels.length} points` : ""}`
    }
    case "add_widget":
      return short(args.widget)
    case "update_artboard":
      return `${short(args.id, 14)}: ${Object.keys((args.patch as object) ?? {}).join(", ") || "patch"}`
    case "evolve":
      return `×${args.count ?? 4}${args.strength != null ? `, strength ${args.strength}` : ""}`
    case "get_registry":
      return args.is ? short(args.is) : "all"
    case "export_video":
      return `${args.seconds ?? 6}s at ${args.fps ?? 30} fps`
    default:
      return Object.entries(args)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}=${short(v, 20)}`)
        .join(" ")
  }
}

/** A Studio tool call's result in one line. */
export function describeResult(result: Result): string {
  if (!result.ok) return result.error
  const d = result.data as Record<string, unknown> | unknown[] | null
  if (Array.isArray(d)) return `${d.length} ${d.length === 1 ? "item" : "items"}`
  if (d && typeof d === "object") {
    if (typeof d.code === "string") return `${d.code.split("\n").length} lines`
    if (typeof d.name === "string")
      return `${d.name}${typeof d.kind === "string" ? ` (${d.kind})` : ""}${Array.isArray(d.dropped) && d.dropped.length ? `, dropped ${d.dropped.join(", ")}` : ""}`
    if (Array.isArray(d.components)) return `${d.components.length} components`
    if (Array.isArray(d.artboards)) return `${d.artboards.length} frames`
    if (typeof d.removed === "string") return "removed"
    if (Array.isArray(d.files))
      return d.files
        .map((f) => (typeof f === "object" && f && "path" in f ? String((f as { path: unknown }).path) : String(f)))
        .join(", ")
  }
  return "ok"
}

/** A Studio tool call as the thread's step: in words, its args and result
 * under it (a delivered file shown by its path), open when it failed. */
export function toolEntry(
  name: string,
  args: Record<string, unknown>,
  result: Result,
  turn: number,
  built = false,
): ToolEntry {
  const raw = result.ok ? result.data : null
  const files = raw && typeof raw === "object" ? (raw as { files?: unknown }).files : undefined
  const data = Array.isArray(files)
    ? { ...(raw as object), files: (files as { path?: unknown }[]).map((f) => f?.path ?? f) }
    : raw
  const step = toolStep(name, args, result, built)
  return {
    kind: "tool",
    name,
    title: step.title,
    icon: step.icon,
    ok: result.ok,
    summary: `${describeArgs(name, args)}, ${describeResult(result)}`,
    detail: `${JSON.stringify(args, null, 1)}\n\n${result.ok ? JSON.stringify(data, null, 1).slice(0, 1600) : result.error}`,
    open: !result.ok,
    turn,
    changed: step.changed,
    mutates: step.mutates,
  }
}

/** A length of time as the thread says it: whole seconds, at least one,
 * minutes past sixty. */
export function secondsOf(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

const isMessage = (e: Entry) => e.kind === "user" || e.kind === "followup"

/** The latest turn's plan (since the last message), shown as its to-dos. */
export function todosOf(entries: readonly Entry[]): Todo[] | null {
  for (let i = entries.length - 1; i >= 0 && !isMessage(entries[i]); i--) {
    const e = entries[i]
    if (e.kind === "plan") return e.entries
  }
  return null
}

/** What a turn changed on the canvas: its editing steps that landed and the
 * frames they touched (by id, the latest name kept). Null when nothing. */
export function changesOf(entries: readonly Entry[], turn: number) {
  const steps = entries.filter((e): e is ToolEntry => e.kind === "tool" && e.turn === turn && e.ok && !!e.mutates)
  if (!steps.length) return null
  const frames = new Map<string, Changed>()
  for (const s of steps) for (const f of s.changed ?? []) frames.set(f.id, f)
  return { turn, steps: steps.length, frames: [...frames.values()] }
}

/** A step of the thread: a Studio tool call or one of the harness's own. */
export const isStep = (e: Entry) => e.kind === "tool" || e.kind === "activity"

/** Runs this long or longer fold into one row. */
export const STEP_RUN = 3

const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`)
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** What a run of steps did, in words: the harness's own calls by their ACP
 * kind, the Studio's by whether they changed the canvas, in the order each
 * first came up ("Read 3 files, searched twice, made 2 edits on the
 * canvas"), then how many failed. */
export function runLabel(items: readonly Entry[]): string {
  const counts = new Map<string, number>()
  for (const e of items) {
    const what =
      e.kind === "tool"
        ? e.mutates
          ? "canvas-edit"
          : "canvas-read"
        : e.kind === "activity"
          ? e.tool === "delete" || e.tool === "move"
            ? "edit"
            : (e.tool ?? "other")
          : null
    if (what) counts.set(what, (counts.get(what) ?? 0) + 1)
  }
  const said = [...counts].map(([what, n]) => {
    switch (what) {
      case "read":
        return `read ${plural(n, "file")}`
      case "search":
        return `searched ${times(n)}`
      case "execute":
        return `ran ${plural(n, "command")}`
      case "edit":
        return `edited ${plural(n, "file")}`
      case "fetch":
        return `fetched ${plural(n, "page")}`
      case "think":
        return `thought ${times(n)}`
      case "canvas-edit":
        return `made ${plural(n, "edit")} on the canvas`
      case "canvas-read":
        return `looked at the canvas ${times(n)}`
      default:
        return `took ${plural(n, "other step")}`
    }
  })
  const failed = items.filter(
    (e) => (e.kind === "tool" && !e.ok) || (e.kind === "activity" && e.status === "failed"),
  ).length
  const text = [...said, ...(failed ? [`${failed} failed`] : [])].join(", ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** The messages sent so far, oldest first, a message sent twice in a row
 * once: what Up walks back through. */
export function sentOf(entries: readonly Entry[]): string[] {
  const out: string[] = []
  for (const e of entries)
    if ((e.kind === "user" || e.kind === "followup") && e.text !== out[out.length - 1]) out.push(e.text)
  return out
}

export type Block =
  | { kind: "entry"; at: number; entry: Entry }
  | { kind: "steps"; at: number; items: { at: number; entry: Entry }[]; failed: number; running: boolean }

/** The thread as it is drawn: entries one by one, except a run of
 * `STEP_RUN` or more steps in a row, which folds into one block keyed by
 * where it starts. Plans are never drawn (they ride over the composer). */
export function threadBlocks(entries: readonly Entry[]): Block[] {
  const out: Block[] = []
  let run: { at: number; entry: Entry }[] = []
  const end = () => {
    if (run.length >= STEP_RUN)
      out.push({
        kind: "steps",
        at: run[0].at,
        items: run,
        failed: run.filter(
          ({ entry: e }) => (e.kind === "tool" && !e.ok) || (e.kind === "activity" && e.status === "failed"),
        ).length,
        running: run.some(
          ({ entry: e }) => e.kind === "activity" && (e.status === "pending" || e.status === "in_progress"),
        ),
      })
    else for (const item of run) out.push({ kind: "entry", ...item })
    run = []
  }
  entries.forEach((entry, at) => {
    if (entry.kind === "plan") return
    if (isStep(entry)) return void run.push({ at, entry })
    end()
    out.push({ kind: "entry", at, entry })
  })
  end()
  return out
}
