// The Studio's document: ONE shape, read by everything that keeps, moves or
// replays it. History snapshots its edited state (`DOCUMENT_KEYS`), a
// project, a file and the agent's mirror carry that state and where the view
// stood (`StudioDocument`), and every document that arrives from outside (a
// file, storage, the agent, the player's page) enters through
// `parseDocument`, the one boundary: nothing past it re-checks. Framework
// free, so the workspace's specs read it as it is.
import { type Artboard, normalizeArtboard } from "@/entities/artboard"

export type Viewport = { x: number; y: number; zoom: number }
export type Group = { id: string; name: string; collapsed: boolean }

/** The document's edited state, key by key: what history snapshots and an
 * undo restores. A new kind of document state is one key here and one field
 * of `DocumentState`, which `parseDocument` must then produce. */
export const DOCUMENT_KEYS = ["artboards", "groups"] as const
export type DocumentKey = (typeof DOCUMENT_KEYS)[number]
export type DocumentState = { artboards: Artboard[]; groups: Group[] }

/** A document as kept and exchanged: the edited state, and the view it was
 * left at (a file or a project has one; a player's or a reel's need not). */
export type StudioDocument = DocumentState & { viewport?: Viewport }

/** The zoom a document's view is held to. */
export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 3

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

let imported = 0
/** A frame's envelope, on a copy: an id (a string, else a fresh one), a
 * name and a finite box. Its fields are normalizeArtboard's. */
function frameOf(a: Record<string, unknown>): Artboard {
  const box = (k: "x" | "y" | "w" | "h") => (finite(a[k]) ? a[k] : k === "w" ? 520 : k === "h" ? 360 : 0)
  return normalizeArtboard({
    ...a,
    id: typeof a.id === "string" && a.id ? a.id : `ab-imported-${imported++}`,
    name: typeof a.name === "string" ? a.name : "Artboard",
    x: box("x"),
    y: box("y"),
    w: box("w"),
    h: box("h"),
  } as unknown as Artboard)
}

/** Read an untrusted document (a file, tampered storage, an agent's, the
 * player's page) into the Studio's shape, or null when no frame survives:
 * only plain-object frames, each normalized whole; groups shape-checked; a
 * view only of finite numbers, its zoom held to the canvas's. The input is
 * never written: it is read from a detached copy (a document is JSON, so
 * the copy is JSON's: what a function or a cycle cannot survive is
 * dropped, or the document refused). */
export function parseDocument(input: unknown): StudioDocument | null {
  let d: unknown
  try {
    d = JSON.parse(JSON.stringify(input) ?? "null")
  } catch {
    return null
  }
  if (!isPlain(d) || !Array.isArray(d.artboards)) return null
  const artboards = d.artboards.filter(isPlain).map(frameOf)
  if (!artboards.length) return null
  const groups = (Array.isArray(d.groups) ? d.groups : [])
    .filter(isPlain)
    .filter((g) => typeof g.id === "string" && typeof g.name === "string")
    .map((g) => ({ id: g.id as string, name: g.name as string, collapsed: g.collapsed === true }))
  const v = d.viewport
  const doc: StudioDocument = { artboards, groups }
  if (isPlain(v) && finite(v.x) && finite(v.y) && finite(v.zoom))
    doc.viewport = { x: v.x, y: v.y, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom)) }
  return doc
}
