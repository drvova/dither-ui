import { onCleanup, onMount } from "solid-js"
import {
  actualSize,
  copySelected,
  deselect,
  duplicateSelected,
  editor,
  fitAll,
  fitSelection,
  groupSelected,
  moveSelected,
  pasteClipboard,
  removeSelected,
  selectedArtboard,
  setArtboardLocked,
  ungroup,
  zoomIn,
  zoomOut,
} from "../../entities/editor"
import { redo, undo } from "../history"

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
}

/** Familiar editor keybindings, installed at the canvas level. While the
 * workbench inspects the canvas its keys are the ones that count, so these
 * step aside. */
export function useShortcuts() {
  function onKey(e: KeyboardEvent) {
    if (editor.inspecting) return
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
    if (mod && (e.key === "=" || e.key === "+")) return (e.preventDefault(), zoomIn())
    if (mod && e.key === "-") return (e.preventDefault(), zoomOut())
    if ((mod && e.key === "0") || (e.shiftKey && e.key === "0")) return (e.preventDefault(), actualSize())
    if (e.shiftKey && e.key === "1") return (e.preventDefault(), fitAll())
    if (e.shiftKey && e.key === "2") return (e.preventDefault(), fitSelection())

    // Selection
    const id = editor.selectedArtboardId
    const hasSel = id !== ""
    if (e.key === "Escape") return deselect()
    if ((e.key === "Delete" || e.key === "Backspace") && hasSel) return (e.preventDefault(), removeSelected())
    if (mod && (e.key === "d" || e.key === "D") && hasSel) return (e.preventDefault(), duplicateSelected())
    if (mod && (e.key === "c" || e.key === "C") && hasSel) return (e.preventDefault(), copySelected())
    if (mod && (e.key === "v" || e.key === "V")) return (e.preventDefault(), pasteClipboard())
    if (mod && e.shiftKey && (e.key === "g" || e.key === "G")) {
      e.preventDefault()
      const a = selectedArtboard.value
      if (a?.groupId) ungroup(a.groupId)
      return
    }
    if (mod && (e.key === "g" || e.key === "G") && hasSel) return (e.preventDefault(), groupSelected())
    if (mod && (e.key === "l" || e.key === "L") && hasSel) {
      e.preventDefault()
      const lock = !(selectedArtboard.value?.locked ?? false)
      for (const sid of editor.selectedIds) setArtboardLocked(sid, lock)
      return
    }

    // Nudge (with ⌘ held the arrows are the page's: between chats).
    if (hasSel && !mod && e.key.startsWith("Arrow")) {
      e.preventDefault()
      const s = e.shiftKey ? 10 : 1
      if (e.key === "ArrowLeft") moveSelected(-s, 0)
      else if (e.key === "ArrowRight") moveSelected(s, 0)
      else if (e.key === "ArrowUp") moveSelected(0, -s)
      else if (e.key === "ArrowDown") moveSelected(0, s)
    }
  }

  onMount(() => {
    window.addEventListener("keydown", onKey)
    onCleanup(() => window.removeEventListener("keydown", onKey))
  })
}

/** The page's own keys: ⌘I the chat, ⌘K search and ⌘B the sidebar from
 * anywhere on the page, a field's included; ⌘⇧↑ / ⌘⇧↓ the chat before or
 * after, outside a field (in one they select its text). Ctrl for ⌘ off a
 * Mac. */
export type PageKeys = {
  toggleChat: () => void
  search: () => void
  toggleSidebar: () => void
  stepChat: (by: -1 | 1) => void
}

/** The key a page shortcut answers, or null: the one table both the
 * listener and its test read. */
export function pageKeyOf(e: KeyboardEvent): Exclude<keyof PageKeys, "stepChat"> | "chatBefore" | "chatAfter" | null {
  if (!(e.metaKey || e.ctrlKey) || e.altKey) return null
  if (e.shiftKey)
    return isTyping(e.target) ? null : e.key === "ArrowUp" ? "chatBefore" : e.key === "ArrowDown" ? "chatAfter" : null
  const k = e.key.toLowerCase()
  return k === "i" ? "toggleChat" : k === "k" ? "search" : k === "b" ? "toggleSidebar" : null
}

export function usePanelShortcuts(keys: PageKeys) {
  function onKey(e: KeyboardEvent) {
    const key = pageKeyOf(e)
    if (!key) return
    e.preventDefault()
    if (key === "chatBefore") keys.stepChat(-1)
    else if (key === "chatAfter") keys.stepChat(1)
    else keys[key]()
  }
  onMount(() => {
    window.addEventListener("keydown", onKey)
    onCleanup(() => window.removeEventListener("keydown", onKey))
  })
}
