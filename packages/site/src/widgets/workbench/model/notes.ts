// The workbench's notes and comment threads (`../bench.ts`): a note written
// on the stage, a thread anchored to the control it is about (re-anchored by
// its Move), replies, resolving and deleting.
import { boxOf, controlOf, labelOf, pathOf, selectorOf } from "@/shared/lib/inspect/measure"
import type { Point } from "@/shared/lib/inspect/geometry"
import { swatch } from "@/widgets/workbench/model/settings"
import type { ToolId } from "@/widgets/workbench/model/tools"
import { uid, type Anchor } from "@/widgets/workbench/model/workspace"
import type { State } from "@/widgets/workbench/model/state"

type NotesDeps = { setTool: (id: ToolId | null) => void }

export function createNotes(s: State, deps: NotesDeps) {
  const {
    o,
    settings,
    overlay,
    tool,
    say,
    ws,
    change,
    setEditing,
    openThread,
    setOpenThread,
    draftThread,
    setDraftThread,
    moving,
    setMoving,
    elementAt,
  } = s
  const { setTool } = deps

  // --- notes and comments ------------------------------------------------------

  function addNote(p: Point) {
    const id = uid("n")
    change((d) => d.notes.push({ id, at: p, text: "", color: swatch(settings.annotate), size: 13 }))
    setEditing(id)
  }

  function commitNote(id: string, text: string) {
    setEditing(null)
    const note = ws().notes.find((n) => n.id === id)
    if (!note || note.text === text) {
      if (note && !text.trim()) change((d) => (d.notes = d.notes.filter((n) => n.id !== id)), false)
      return
    }
    if (!text.trim()) change((d) => (d.notes = d.notes.filter((n) => n.id !== id)), !!note.text)
    else change((d) => (d.notes.find((n) => n.id === id)!.text = text), !!note.text)
  }

  function startThread(e: PointerEvent, p: Point) {
    const hit = elementAt(e.clientX, e.clientY)
    const ov = overlay()
    if (!hit || !ov) return
    const el = controlOf(hit, o.content)
    const box = boxOf(el, ov)
    const anchor: Anchor = {
      path: pathOf(el, o.content),
      selector: `#${o.section} ${selectorOf(el, o.content)}`,
      label: labelOf(el),
      box,
      offset: { x: p.x - box.x, y: p.y - box.y },
    }
    const id = moving()
    if (id) {
      setMoving(null)
      change((w) => {
        const t = w.threads.find((x) => x.id === id)
        if (t) t.anchor = anchor
      })
      setOpenThread(id)
      say(`Comment moved to ${anchor.label}`)
      return
    }
    setDraftThread({ ...anchor, at: p })
    setOpenThread(null)
  }

  /** Point a thread at another element: the next Comment click places it. */
  function moveThread(id: string) {
    setMoving(id)
    setOpenThread(null)
    if (tool() !== "comment") setTool("comment")
    say("Click the element this comment is about")
  }

  function submitThread(text: string) {
    const d = draftThread()
    if (!d || !text.trim()) return
    const { at: _at, ...anchor } = d
    const id = uid("t")
    change((w) =>
      w.threads.push({
        id,
        n: Math.max(0, ...w.threads.map((t) => t.n)) + 1,
        anchor,
        messages: [{ id: uid("c"), text: text.trim(), at: Date.now() }],
        resolved: false,
      }),
    )
    setDraftThread(null)
    setOpenThread(id)
    say("Comment added")
  }

  function reply(id: string, text: string) {
    if (!text.trim()) return
    change((w) =>
      w.threads.find((t) => t.id === id)?.messages.push({ id: uid("c"), text: text.trim(), at: Date.now() }),
    )
  }

  function setResolved(id: string, resolved: boolean) {
    change((w) => {
      const t = w.threads.find((x) => x.id === id)
      if (t) t.resolved = resolved
    })
    say(resolved ? "Thread resolved" : "Thread reopened")
  }

  function removeThread(id: string) {
    change((w) => (w.threads = w.threads.filter((t) => t.id !== id)))
    if (openThread() === id) setOpenThread(null)
    say("Thread deleted")
  }

  function removeMessage(threadId: string, messageId: string) {
    change((w) => {
      const t = w.threads.find((x) => x.id === threadId)
      if (!t) return
      t.messages = t.messages.filter((m) => m.id !== messageId)
      if (!t.messages.length) w.threads = w.threads.filter((x) => x.id !== threadId)
    })
  }

  return { addNote, commitNote, startThread, moveThread, submitThread, reply, setResolved, removeThread, removeMessage }
}

export type Notes = ReturnType<typeof createNotes>
