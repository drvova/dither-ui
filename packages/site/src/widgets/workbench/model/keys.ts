// The workbench's keys (`../bench.ts`), only for the preview last pointed at
// or focused and only while the pointer is over it or focus is in its card:
// the tools' and toggles' keys, undo and redo, Alt's distances and Alt+S,
// arrows that walk the tree or nudge, Delete, and Escape's ladder.
import { isTyping } from "@/shared/lib/keys"
import { labelOf, walk } from "@/shared/lib/inspect/measure"
import { TOGGLES, TOOLS, type ToggleId, type ToolId } from "@/widgets/workbench/model/tools"
import { uid } from "@/widgets/workbench/model/workspace"
import { hasKeys, ownKeys, TARGET_TOOLS, type State } from "@/widgets/workbench/model/state"
import type { Selection } from "@/widgets/workbench/model/selection"
import type { Recorder } from "@/widgets/workbench/model/recorder"
import type { Gestures } from "@/widgets/workbench/model/gestures"

type KeyDeps = Pick<Selection, "removeSelection" | "selectAll" | "translate"> &
  Pick<Recorder, "finishRecording"> &
  Pick<Gestures, "leave"> & {
    setTool: (id: ToolId | null) => void
    setGroup: (g: 1 | 2) => void
    toggle: (id: ToggleId) => void
    copyForAgent: () => Promise<void>
  }

export function createKeys(s: State, deps: KeyDeps) {
  const {
    o,
    me,
    settings,
    tool,
    panel,
    setPanel,
    say,
    change,
    undo,
    redo,
    hot,
    setHot,
    hovered,
    pinned,
    setPinned,
    alt,
    setAlt,
    setAltFrom,
    altMeasure,
    setGuideAxis,
    draft,
    setDraft,
    selection,
    setSelection,
    openThread,
    setOpenThread,
    draftThread,
    setDraftThread,
    moving,
    setMoving,
    capture,
  } = s
  const { removeSelection, selectAll, translate, finishRecording, setTool, setGroup, toggle, copyForAgent, leave } =
    deps

  // --- keyboard ----------------------------------------------------------------

  function pinMeasure() {
    const m = altMeasure()
    if (!m) return
    change((w) => {
      if (!settings.multiMeasure) w.measures = []
      w.measures.push({ id: uid("m"), from: { label: m.fromLabel, box: m.from }, to: { label: m.toLabel, box: m.to } })
    })
    say(`Kept the distance from ${m.fromLabel} to ${m.toLabel}`)
  }

  function escape(): boolean {
    if (draft()) setDraft(null)
    else if (moving()) setMoving(null)
    else if (capture()?.kind === "recording") void finishRecording()
    else if (draftThread() || openThread()) {
      setDraftThread(null)
      setOpenThread(null)
    } else if (selection().length) setSelection([])
    else if (pinned()) setPinned(null)
    else if (panel()) setPanel(null)
    else if (tool()) setTool(null)
    else {
      o.exit()
      return true
    }
    return true
  }

  const DIRS: Record<string, "up" | "down" | "prev" | "next"> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "prev",
    ArrowRight: "next",
  }

  function arrowKey(e: KeyboardEvent): boolean {
    const t = tool()
    if (t === "select" && selection().length) {
      const step = e.shiftKey ? 10 : 1
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
      const items = selection()
      change((w) => translate(w, items, dx, dy))
      return true
    }
    if (TARGET_TOOLS.has(t)) {
      const from = pinned() ?? hovered()
      const next = from ? (walk(from, o.content, DIRS[e.key]) ?? from) : o.content.firstElementChild
      setPinned(next)
      if (next) say(`Pinned ${labelOf(next)}`)
      return true
    }
    return false
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!hasKeys(me) || !(hot() || o.card.contains(document.activeElement))) return
    if (e.key === "Alt") {
      if (!alt()) setAltFrom(pinned() ?? hovered())
      setAlt(true)
      return
    }
    if (isTyping(e.target)) return
    const mod = e.metaKey || e.ctrlKey
    const k = e.key.toLowerCase()
    if (mod) {
      if (k === "z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (k === "y") {
        e.preventDefault()
        redo()
      } else if (k === "a" && tool() === "select") {
        e.preventDefault()
        selectAll()
      }
      return
    }
    if (e.altKey) {
      if (e.code === "KeyS") {
        e.preventDefault()
        pinMeasure()
      }
      return
    }
    if (e.key === "Escape") {
      if (escape()) e.preventDefault()
      return
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      if (removeSelection()) e.preventDefault()
      return
    }
    if (e.key in DIRS) {
      if (arrowKey(e)) e.preventDefault()
      return
    }
    if (e.shiftKey && k !== "?") return
    if (tool() === "guides" && (k === "h" || k === "v")) {
      setGuideAxis(k === "h" ? "y" : "x")
      say(k === "h" ? "Horizontal guides" : "Vertical guides")
      return
    }
    if (k === "1" || k === "2") return setGroup(k === "1" ? 1 : 2)
    if (k === "k") return void copyForAgent()
    if (k === ",") {
      setPanel(panel() === "settings" ? null : "settings")
      return
    }
    const t = TOOLS.find((x) => x.key === k)
    if (t) {
      e.preventDefault()
      setTool(t.id)
      return
    }
    const g = TOGGLES.find((x) => x.key === k)
    if (g) {
      e.preventDefault()
      toggle(g.id)
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === "Alt") {
      setAlt(false)
      setAltFrom(null)
    }
  }

  const onBlur = () => {
    setAlt(false)
  }
  const onEnter = () => {
    ownKeys(me)
    setHot(true)
  }
  const onLeave = () => {
    setHot(false)
    leave()
  }
  const onFocusIn = () => {
    ownKeys(me)
  }

  /** The keys and the pointer's coming and going, heard while mounted. */
  function listen() {
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    o.host.addEventListener("pointerenter", onEnter)
    o.host.addEventListener("pointerleave", onLeave)
    o.card.addEventListener("focusin", onFocusIn)
  }
  function unlisten() {
    window.removeEventListener("keydown", onKeyDown)
    window.removeEventListener("keyup", onKeyUp)
    window.removeEventListener("blur", onBlur)
    o.host.removeEventListener("pointerenter", onEnter)
    o.host.removeEventListener("pointerleave", onLeave)
    o.card.removeEventListener("focusin", onFocusIn)
  }

  return { pinMeasure, escape, listen, unlisten }
}
