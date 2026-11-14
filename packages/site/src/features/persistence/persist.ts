import { createMutable } from "solid-js/store"
import { DOCUMENT_KEYS, documentOf, editor, loadDocument, parseDocument, resetHistory, watch } from "@/entities/editor"
import { download } from "@/shared/lib/files"
import { readJson, storage as store, writeJson } from "@/shared/lib/storage"
import { STORAGE_KEYS, STORAGE_PREFIXES } from "@/shared/config/storage"

/**
 * Per-visitor project workspace. Every browser owns its own project list in
 * localStorage — deployed publicly, users are isolated by construction (zero
 * shared state), and on a shared machine each person can keep their own named
 * projects instead of stomping one implicit document.
 *
 * Keys: an index of project metas, one doc blob per project, and the active
 * project id. The legacy single-document key migrates into the first project.
 */

export type ProjectMeta = { id: string; name: string; updatedAt: number }

export const projects = createMutable<ProjectMeta[]>([])
export const activeProjectId = createMutable({ value: "" })

let pc = 0
const uid = () => `p${Date.now().toString(36)}${(pc++).toString(36)}`

const saveIndex = () => writeJson(STORAGE_KEYS.projects, projects)
const touch = (id: string) => {
  const meta = projects.find((p) => p.id === id)
  if (meta) meta.updatedAt = Date.now()
}

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v)

/** The project list as stored, read once: an entry needs a string id; its
 * name and time fall back, and a duplicate id is dropped. */
function parseProjects(v: unknown): ProjectMeta[] {
  const seen = new Set<string>()
  return (Array.isArray(v) ? v : []).filter(isPlain).flatMap((p) => {
    if (typeof p.id !== "string" || !p.id || seen.has(p.id)) return []
    seen.add(p.id)
    const name = typeof p.name === "string" && p.name.trim() ? p.name : "Untitled"
    return [{ id: p.id, name, updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : 0 }]
  })
}

/** Load a stored document (read at this boundary), or make the fresh one
 * (a frame at the canvas's centre); true when it made the fresh one. */
const applyStored = (key: string): boolean => loadDocument(parseDocument(readJson(key)))

let timer: ReturnType<typeof setTimeout> | undefined
/** Write the current editor state to the active project immediately. */
export function flushSave(): void {
  clearTimeout(timer)
  timer = undefined
  if (!activeProjectId.value) return
  writeJson(STORAGE_PREFIXES.document + activeProjectId.value, documentOf())
  touch(activeProjectId.value)
  saveIndex()
}

/** Restore the workspace (run in setup, before first paint). True when the
 * active project had no document and got the fresh one: its frame was
 * placed before the canvas measured itself, so the page frames it once
 * the canvas is mounted (`frame`). */
export function hydrate(): boolean {
  projects.splice(0, projects.length, ...parseProjects(readJson(STORAGE_KEYS.projects)))

  // Migrate the legacy single-document world into the first project.
  if (!projects.length) {
    const legacy = readJson(STORAGE_KEYS.legacyDocument)
    const meta: ProjectMeta = { id: uid(), name: "My project", updatedAt: Date.now() }
    projects.push(meta)
    if (legacy) {
      writeJson(STORAGE_PREFIXES.document + meta.id, legacy)
      store.remove(STORAGE_KEYS.legacyDocument)
    }
    saveIndex()
  }

  const requested = store.get(STORAGE_KEYS.activeProject)
  const active = projects.find((p) => p.id === requested) ?? projects[0]
  activeProjectId.value = active.id
  store.set(STORAGE_KEYS.activeProject, active.id)
  return applyStored(STORAGE_PREFIXES.document + active.id)
}

export function createProject(name: string): void {
  const clean = name.trim() || `Project ${projects.length + 1}`
  flushSave()
  const meta: ProjectMeta = { id: uid(), name: clean, updatedAt: Date.now() }
  projects.push(meta)
  activeProjectId.value = meta.id
  store.set(STORAGE_KEYS.activeProject, meta.id)
  loadDocument(null) // fresh default document
  flushSave()
  resetHistory()
}

export function switchProject(id: string): void {
  if (id === activeProjectId.value) return
  const meta = projects.find((p) => p.id === id)
  if (!meta) return
  flushSave()
  activeProjectId.value = id
  store.set(STORAGE_KEYS.activeProject, id)
  applyStored(STORAGE_PREFIXES.document + id)
  resetHistory()
}

/** A copy of a project's canvas as a new project beside it, opened. Its
 * chats stay with the original (their checkpoints are that canvas's). */
export function duplicateProject(id: string): void {
  const meta = projects.find((p) => p.id === id)
  if (!meta) return
  flushSave()
  const copy: ProjectMeta = { id: uid(), name: `${meta.name} copy`.slice(0, 80), updatedAt: Date.now() }
  const doc = readJson(STORAGE_PREFIXES.document + id)
  if (doc) writeJson(STORAGE_PREFIXES.document + copy.id, doc)
  projects.splice(projects.indexOf(meta) + 1, 0, copy)
  saveIndex()
  switchProject(copy.id)
}

export function renameProject(id: string, name: string): void {
  const meta = projects.find((p) => p.id === id)
  const clean = name.trim()
  if (!meta || !clean) return
  meta.name = clean
  saveIndex()
}

export function deleteProject(id: string): void {
  const i = projects.findIndex((p) => p.id === id)
  if (i < 0) return
  projects.splice(i, 1)
  store.remove(STORAGE_PREFIXES.document + id)
  if (activeProjectId.value === id) {
    if (projects.length) {
      activeProjectId.value = "" // force the switch through
      switchProject(projects[0].id)
    } else {
      // The last project gone, a new one takes its place under a name of
      // its own, so the delete reads as one.
      activeProjectId.value = ""
      createProject("")
    }
  } else {
    saveIndex()
  }
}

/** What deleting a project takes, as both of its confirms say it. */
export function deleteWarning(id: string): string {
  const name = projects.find((p) => p.id === id)?.name ?? ""
  const last = projects.length === 1 ? " It is your only project, so a new one takes its place." : ""
  return `“${name}”, its frames and its chats will be removed. This cannot be undone.${last}`
}

export const activeProjectName = (): string =>
  projects.find((p) => p.id === activeProjectId.value)?.name ?? "My project"

/** Download the active project as a .json file. */
export function exportDocument(): void {
  const name = activeProjectName()
    .replace(/[^\w-]+/g, "-")
    .toLowerCase()
  download(new Blob([JSON.stringify(documentOf(), null, 2)], { type: "application/json" }), `${name || "project"}.json`)
}

/** Replace the active project with an untrusted document (a file's), read
 * once by `parseDocument`; saved at once, and the undo stack starts over
 * from it. False, with nothing changed, when no frame survives. */
export function applyDocument(d: unknown): boolean {
  const doc = parseDocument(d)
  if (!doc) return false
  loadDocument(doc)
  flushSave()
  resetHistory()
  return true
}

/** Load a project .json file into the active project. Invalid files are ignored. */
export async function importDocument(file: File): Promise<boolean> {
  try {
    return applyDocument(JSON.parse(await file.text()))
  } catch {
    return false
  }
}

let stopWatches: (() => void)[] = []
const scheduleSave = () => {
  clearTimeout(timer)
  timer = setTimeout(flushSave, 400)
}

export function startAutosave(): void {
  stopWatches.forEach((stop) => stop())
  stopWatches = [
    watch(() => DOCUMENT_KEYS.map((k) => editor[k]), scheduleSave, { deep: true }),
    watch(() => [editor.viewport.x, editor.viewport.y, editor.viewport.zoom], scheduleSave),
  ]
}

export function stopAutosave(): void {
  stopWatches.forEach((stop) => stop())
  stopWatches = []
  if (timer) flushSave()
}
