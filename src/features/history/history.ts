import { reactive, watch } from "vue"
import { deselect, editor, selectArtboard } from "@/entities/editor"

/** Snapshot-based undo/redo over the document (artboards + groups).
 * Viewport and selection are deliberately excluded — pan/zoom is not an edit.
 * Mutations are coalesced per 300ms window, so a drag is one history entry. */

const MAX = 50
const undoStack: string[] = []
const redoStack: string[] = []
let last = ""
let timer: ReturnType<typeof setTimeout> | undefined
let muted = false // swallow the watcher echo caused by restore() itself

/** Reactive view over the stacks — what toolbar buttons bind to. A pending
 * debounce window counts as undoable so the button lights up on first edit. */
export const history = reactive({ canUndo: false, canRedo: false })

function sync() {
  history.canUndo = undoStack.length > 0 || timer !== undefined
  history.canRedo = redoStack.length > 0
}

const snap = () =>
  JSON.stringify({ artboards: editor.artboards, groups: editor.groups })

function push() {
  const cur = snap()
  if (cur === last) return
  undoStack.push(last)
  if (undoStack.length > MAX) undoStack.shift()
  redoStack.length = 0
  last = cur
}

function flush() {
  clearTimeout(timer)
  timer = undefined
  push()
  sync()
}

function restore(s: string) {
  const d = JSON.parse(s)
  editor.artboards = d.artboards
  editor.groups = d.groups
  last = s
  clearTimeout(timer)
  timer = undefined
  const keep = editor.artboards.find((a) => a.id === editor.selectedArtboardId)
  const first = keep ?? editor.artboards[0]
  first ? selectArtboard(first.id) : deselect()
  muted = true
  sync()
}

export function undo() {
  flush()
  const prev = undoStack.pop()
  if (prev === undefined) return
  redoStack.push(snap())
  restore(prev)
}

export function redo() {
  flush() // a pending edit invalidates the redo branch
  const next = redoStack.pop()
  if (next === undefined) return
  undoStack.push(snap())
  restore(next)
}

/** Install after hydrate() so the restored document is the history baseline. */
export function startHistory() {
  last = snap()
  watch(
    () => [editor.artboards, editor.groups],
    () => {
      if (muted) {
        muted = false
        return
      }
      clearTimeout(timer)
      timer = setTimeout(flush, 300)
      sync()
    },
    { deep: true }
  )
}
