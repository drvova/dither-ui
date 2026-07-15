import { reactive, watch, type WatchHandle } from "vue"
import { createArtboard, normalizeArtboard } from "@/entities/artboard"
import { editor, selectArtboard } from "@/entities/editor"
import { resetHistory } from "@/features/history"

/**
 * Per-visitor project workspace. Every browser owns its own project list in
 * localStorage — deployed publicly, users are isolated by construction (zero
 * shared state), and on a shared machine each person can keep their own named
 * projects instead of stomping one implicit document.
 *
 * Keys: an index of project metas, one doc blob per project, and the active
 * project id. The legacy single-document key migrates into the first project.
 */
const INDEX_KEY = "dither-studio-projects"
const ACTIVE_KEY = "dither-studio-active"
const DOC_PREFIX = "dither-studio-doc-"
const LEGACY_KEY = "dither-studio-v8"

export type ProjectMeta = { id: string; name: string; updatedAt: number }

type Doc = {
  artboards: unknown[]
  groups?: unknown[]
  viewport?: { x: number; y: number; zoom: number }
}

export const projects = reactive<ProjectMeta[]>([])
export const activeProjectId = reactive({ value: "" })

let pc = 0
const uid = () => `p${Date.now().toString(36)}${(pc++).toString(36)}`

const readJson = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota / privacy mode — keep editing, persistence is best-effort
  }
}

const saveIndex = () => writeJson(INDEX_KEY, projects)
const touch = (id: string) => {
  const meta = projects.find((p) => p.id === id)
  if (meta) meta.updatedAt = Date.now()
}

const snapshotDoc = (): Doc => ({
  artboards: editor.artboards,
  groups: editor.groups,
  viewport: editor.viewport,
})

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

let abFallback = 0
/** Envelope validation for untrusted documents (imports, tampered storage):
 * only plain-object artboards survive, ids are guaranteed strings, groups are
 * shape-checked, and the viewport must be finite numbers. Field-level
 * sanitisation happens in normalizeArtboard. */
function validDoc(d: Doc): {
  artboards: Parameters<typeof normalizeArtboard>[0][]
  groups: typeof editor.groups
  viewport: typeof editor.viewport | null
} | null {
  const artboards = (Array.isArray(d.artboards) ? d.artboards : [])
    .filter(isPlain)
    .map((a) => {
      if (typeof a.id !== "string" || !a.id) a.id = `ab-imported-${abFallback++}`
      if (typeof a.name !== "string") a.name = "Artboard"
      for (const k of ["x", "y", "w", "h"] as const) {
        if (typeof a[k] !== "number" || !Number.isFinite(a[k])) a[k] = k === "w" ? 520 : k === "h" ? 360 : 0
      }
      return a as unknown as Parameters<typeof normalizeArtboard>[0]
    })
  if (!artboards.length) return null
  const groups = (Array.isArray(d.groups) ? d.groups : [])
    .filter(isPlain)
    .filter((g) => typeof g.id === "string" && typeof g.name === "string")
    .map((g) => ({ id: g.id as string, name: g.name as string, collapsed: g.collapsed === true }))
  const v = d.viewport
  const viewport =
    isPlain(v) &&
    [v.x, v.y, v.zoom].every((n) => typeof n === "number" && Number.isFinite(n))
      ? { x: v.x as number, y: v.y as number, zoom: Math.min(3, Math.max(0.2, v.zoom as number)) }
      : null
  return { artboards, groups, viewport }
}

function applyDoc(d: Doc | null): void {
  const valid = d ? validDoc(d) : null
  if (valid) {
    editor.artboards = valid.artboards.map(normalizeArtboard)
    editor.groups = valid.groups
    if (valid.viewport) editor.viewport = valid.viewport
    selectArtboard(editor.artboards[0].id)
  } else {
    editor.artboards = [createArtboard("area", 0, 0)]
    editor.groups = []
    editor.viewport = { x: 96, y: 88, zoom: 1 }
    selectArtboard(editor.artboards[0].id)
  }
  editor.dataOpen = false
}

let timer: ReturnType<typeof setTimeout> | undefined
/** Write the current editor state to the active project immediately. */
export function flushSave(): void {
  clearTimeout(timer)
  timer = undefined
  if (!activeProjectId.value) return
  writeJson(DOC_PREFIX + activeProjectId.value, snapshotDoc())
  touch(activeProjectId.value)
  saveIndex()
}

/** Restore the workspace (run in setup, before first paint). */
export function hydrate(): void {
  const index = readJson<ProjectMeta[]>(INDEX_KEY)
  if (Array.isArray(index)) projects.splice(0, projects.length, ...index)

  // Migrate the legacy single-document world into the first project.
  if (!projects.length) {
    const legacy = readJson<Doc>(LEGACY_KEY)
    const meta: ProjectMeta = { id: uid(), name: "My project", updatedAt: Date.now() }
    projects.push(meta)
    if (legacy) {
      writeJson(DOC_PREFIX + meta.id, legacy)
      localStorage.removeItem(LEGACY_KEY)
    }
    saveIndex()
  }

  const requested = localStorage.getItem(ACTIVE_KEY)
  const active = projects.find((p) => p.id === requested) ?? projects[0]
  activeProjectId.value = active.id
  localStorage.setItem(ACTIVE_KEY, active.id)
  applyDoc(readJson<Doc>(DOC_PREFIX + active.id))
}

export function createProject(name: string): void {
  const clean = name.trim() || `Project ${projects.length + 1}`
  flushSave()
  const meta: ProjectMeta = { id: uid(), name: clean, updatedAt: Date.now() }
  projects.push(meta)
  activeProjectId.value = meta.id
  localStorage.setItem(ACTIVE_KEY, meta.id)
  applyDoc(null) // fresh default document
  flushSave()
  resetHistory()
}

export function switchProject(id: string): void {
  if (id === activeProjectId.value) return
  const meta = projects.find((p) => p.id === id)
  if (!meta) return
  flushSave()
  activeProjectId.value = id
  localStorage.setItem(ACTIVE_KEY, id)
  applyDoc(readJson<Doc>(DOC_PREFIX + id))
  resetHistory()
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
  localStorage.removeItem(DOC_PREFIX + id)
  if (activeProjectId.value === id) {
    if (projects.length) {
      activeProjectId.value = "" // force the switch through
      switchProject(projects[0].id)
    } else {
      activeProjectId.value = ""
      createProject("My project")
    }
  } else {
    saveIndex()
  }
}

export const activeProjectName = (): string =>
  projects.find((p) => p.id === activeProjectId.value)?.name ?? "My project"

/** Download the active project as a .json file. */
export function exportDocument(): void {
  const blob = new Blob([JSON.stringify(snapshotDoc(), null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${activeProjectName().replace(/[^\w-]+/g, "-").toLowerCase() || "project"}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Load a project .json file into the active project. Invalid files are ignored. */
export async function importDocument(file: File): Promise<boolean> {
  try {
    const d = JSON.parse(await file.text()) as Doc
    if (!Array.isArray(d.artboards) || !d.artboards.length) return false
    applyDoc(d)
    flushSave()
    resetHistory()
    return true
  } catch {
    return false
  }
}

let stopWatch: WatchHandle | undefined
export function startAutosave(): void {
  stopWatch?.()
  stopWatch = watch(
    () => [editor.artboards, editor.groups, editor.viewport],
    () => {
      clearTimeout(timer)
      timer = setTimeout(flushSave, 400)
    },
    { deep: true }
  )
}

export function stopAutosave(): void {
  stopWatch?.()
  stopWatch = undefined
  if (timer) flushSave()
}

