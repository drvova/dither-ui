import { watch } from "vue"
import { normalizeArtboard } from "@/entities/artboard"
import { editor, selectArtboard } from "@/entities/editor"

const KEY = "dither-studio-v8"

/** Restore a saved document (run in setup, before first paint). Corrupt or
 * stale JSON is ignored on purpose — a bad blob must not brick the editor. */
export function hydrate() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    if (Array.isArray(d.artboards) && d.artboards.length) {
      // Older documents may predate newer model fields — fill from defaults.
      editor.artboards = d.artboards.map(normalizeArtboard)
      if (Array.isArray(d.groups)) editor.groups = d.groups
      if (d.viewport) editor.viewport = d.viewport
      selectArtboard(editor.artboards[0].id)
    }
  } catch {
    localStorage.removeItem(KEY)
  }
}

/** Download the whole document as a project .json file. */
export function exportDocument() {
  const blob = new Blob(
    [JSON.stringify({ artboards: editor.artboards, groups: editor.groups, viewport: editor.viewport }, null, 2)],
    { type: "application/json" }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "dither-studio.json"
  a.click()
  URL.revokeObjectURL(url)
}

/** Load a project .json file into the editor. Invalid files are ignored. */
export async function importDocument(file: File): Promise<boolean> {
  try {
    const d = JSON.parse(await file.text())
    if (!Array.isArray(d.artboards) || !d.artboards.length) return false
    editor.artboards = d.artboards.map(normalizeArtboard)
    editor.groups = Array.isArray(d.groups) ? d.groups : []
    if (d.viewport) editor.viewport = d.viewport
    selectArtboard(editor.artboards[0].id)
    return true
  } catch {
    return false
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
export function startAutosave() {
  watch(
    () => [editor.artboards, editor.groups, editor.viewport],
    () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          localStorage.setItem(
            KEY,
            JSON.stringify({
              artboards: editor.artboards,
              groups: editor.groups,
              viewport: editor.viewport,
            })
          )
        } catch {
          // quota / privacy mode — nothing actionable, keep editing
        }
      }, 400)
    },
    { deep: true }
  )
}
