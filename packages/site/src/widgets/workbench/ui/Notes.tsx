// Text notes on the stage. Written in place: Enter keeps the note,
// Shift+Enter breaks the line, Escape or leaving the field keeps it too;
// an empty note goes. Double-click a note (Select or any annotate tool)
// to write in it again.
import { createEffect, createSignal, on, Show } from "solid-js"
import { useBench } from "../context"
import Keyed from "./Keyed"
import "./Notes.css"

export default function Notes() {
  const b = useBench()
  let field: HTMLTextAreaElement | undefined
  const [text, setText] = createSignal("")

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
      <Keyed each={b.ws().notes}>
        {(n) => (
          <div
            class={b.isSelected({ kind: "notes", id: n().id }) ? "note on" : "note"}
            data-note={n().id}
            style={{ left: `${n().at.x}px`, top: `${n().at.y}px`, color: n().color, "font-size": `${n().size}px` }}
          >
            <Show when={b.editing() === n().id} fallback={<span>{n().text}</span>}>
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
            </Show>
          </div>
        )}
      </Keyed>
    </div>
  )
}
