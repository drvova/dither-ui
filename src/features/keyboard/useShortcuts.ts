import { onBeforeUnmount, onMounted } from "vue"
import {
  deselect,
  duplicateSelected,
  editor,
  moveArtboard,
  removeSelected,
} from "@/entities/editor"

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
