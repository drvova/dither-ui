import { onBeforeUnmount, onMounted } from "vue"
import {
  copySelected,
  deselect,
  duplicateSelected,
  editor,
  groupSelected,
  moveArtboard,
  pasteClipboard,
  removeSelected,
  selectedArtboard,
  setArtboardLocked,
  ungroup,
} from "@/entities/editor"
import { redo, undo } from "@/features/history"

type ZoomControls = {
  fit: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return (
    !!el &&
    (el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.isContentEditable)
  )
}

/** Familiar editor keybindings, installed at the canvas level. */
export function useShortcuts(zoom: ZoomControls) {
  function onKey(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey

    if (isTyping(e.target)) {
      if (e.key === "Escape") (e.target as HTMLElement).blur()
      return
    }

    // History
    if (mod && (e.key === "z" || e.key === "Z")) {
      e.preventDefault()
      return e.shiftKey ? redo() : undo()
    }

    // Zoom
    if (mod && (e.key === "=" || e.key === "+")) return e.preventDefault(), zoom.zoomIn()
    if (mod && e.key === "-") return e.preventDefault(), zoom.zoomOut()
    if ((mod && e.key === "0") || (e.shiftKey && e.key === "0"))
      return e.preventDefault(), zoom.resetZoom()
    if (e.shiftKey && e.key === "1") return e.preventDefault(), zoom.fit()

    // Selection
    const id = editor.selectedArtboardId
    const hasSel = id !== ""
    if (e.key === "Escape") return deselect()
    if ((e.key === "Delete" || e.key === "Backspace") && hasSel)
      return e.preventDefault(), removeSelected()
    if (mod && (e.key === "d" || e.key === "D") && hasSel)
      return e.preventDefault(), duplicateSelected()
    if (mod && (e.key === "c" || e.key === "C") && hasSel)
      return e.preventDefault(), copySelected()
    if (mod && (e.key === "v" || e.key === "V"))
      return e.preventDefault(), pasteClipboard()
    if (mod && e.shiftKey && (e.key === "g" || e.key === "G")) {
      e.preventDefault()
      const a = selectedArtboard.value
      if (a?.groupId) ungroup(a.groupId)
      return
    }
    if (mod && (e.key === "g" || e.key === "G") && hasSel)
      return e.preventDefault(), groupSelected()
    if (mod && (e.key === "l" || e.key === "L") && hasSel) {
      e.preventDefault()
      const lock = !(selectedArtboard.value?.locked ?? false)
      for (const sid of editor.selectedIds) setArtboardLocked(sid, lock)
      return
    }

    // Nudge
    if (hasSel && e.key.startsWith("Arrow")) {
      e.preventDefault()
      const s = e.shiftKey ? 10 : 1
      if (e.key === "ArrowLeft") moveArtboard(id, -s, 0)
      else if (e.key === "ArrowRight") moveArtboard(id, s, 0)
      else if (e.key === "ArrowUp") moveArtboard(id, 0, -s)
      else if (e.key === "ArrowDown") moveArtboard(id, 0, s)
    }
  }

  onMounted(() => window.addEventListener("keydown", onKey))
  onBeforeUnmount(() => window.removeEventListener("keydown", onKey))
}
