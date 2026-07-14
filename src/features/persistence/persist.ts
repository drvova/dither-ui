import { watch } from "vue"
import { editor, selectArtboard } from "@/entities/editor"

const KEY = "dither-studio-v7"

/** Restore a saved document (run in setup, before first paint). Corrupt or
 * stale JSON is ignored on purpose — a bad blob must not brick the editor. */
export function hydrate() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const d = JSON.parse(raw)
    if (Array.isArray(d.artboards) && d.artboards.length) {
      editor.artboards = d.artboards
      if (Array.isArray(d.groups)) editor.groups = d.groups
      if (d.viewport) editor.viewport = d.viewport
      selectArtboard(editor.artboards[0].id)
    }
  } catch {
    localStorage.removeItem(KEY)
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
