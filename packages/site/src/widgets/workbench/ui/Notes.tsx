// Text notes on the stage. `NoteShapes` draws them in the overlay's SVG
// layer (a filled box, its lines wrapped as the field wraps them); `Notes`
// is the field a note is written in, in place: Enter keeps the note,
// Shift+Enter breaks the line, Escape or leaving the field keeps it too;
// an empty note goes. Double-click a note (Select or any annotate tool)
// to write in it again. Each note, drawn or in its field, carries
// `data-note` (what the selection measures).
import { createEffect, createMemo, createSignal, Index, on, Show } from "solid-js"
import { NOTE_LEADING, NOTE_PAD, textWidth, wrapLines } from "@/widgets/workbench/model/svg"
import { useBench } from "../context"
import Keyed from "./Keyed"
import "./Notes.css"

export function NoteShapes() {
  const b = useBench()
  const notes = createMemo(() => b.ws().notes.filter((n) => n.id !== b.editing()))
  return (
    <Keyed each={notes()}>
      {(n) => {
        const lines = createMemo(() => wrapLines(n().text, n().size))
        const lead = () => n().size * NOTE_LEADING
        const w = () => Math.max(...lines().map((l) => textWidth(l, n().size))) + NOTE_PAD * 2
        const h = () => lines().length * lead() + 4
        return (
          <g class="note notes-scope" data-note={n().id} style={{ color: n().color }}>
            <rect x={n().at.x + 0.5} y={n().at.y + 0.5} width={w() - 1} height={h() - 1} rx={4} />
            <text font-size={n().size}>
              <Index each={lines()}>
                {(l, i) => (
                  <tspan x={n().at.x + NOTE_PAD} y={n().at.y + 2 + (i + 0.5) * lead()} dominant-baseline="central">
                    {l()}
                  </tspan>
                )}
              </Index>
            </text>
          </g>
        )
      }}
    </Keyed>
  )
}

export default function Notes() {
  const b = useBench()
  let field: HTMLTextAreaElement | undefined
  const [text, setText] = createSignal("")
  const note = createMemo(() => b.ws().notes.find((n) => n.id === b.editing()) ?? null)

  createEffect(
    on(b.editing, (id) => {
      setText(b.ws().notes.find((n) => n.id === id)?.text ?? "")
      queueMicrotask(() => field?.focus())
    }),
  )

  function done(id: string) {
    if (b.editing() === id) b.commitNote(id, text())
  }

  function key(e: KeyboardEvent, id: string) {
    if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
      e.preventDefault()
      e.stopPropagation()
      done(id)
    }
  }

  return (
    <div class="wb-notes notes-scope">
      <Show when={note()}>
        {(n) => (
          <div
            class="note"
            data-note={n().id}
            style={{ left: `${n().at.x}px`, top: `${n().at.y}px`, color: n().color, "font-size": `${n().size}px` }}
          >
            <textarea
              ref={(el) => (field = el)}
              value={text()}
              class="field"
              rows={Math.max(1, text().split("\n").length)}
              cols={Math.max(
                8,
                ...text()
                  .split("\n")
                  .map((l) => l.length + 1),
              )}
              aria-label="Note text"
              placeholder="Write a note"
              onInput={(e) => setText(e.currentTarget.value)}
              on:keydown={(e) => key(e, n().id)}
              onBlur={() => done(n().id)}
            />
          </div>
        )}
      </Show>
    </div>
  )
}
