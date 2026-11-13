import { DitherIcon } from "dither-kit"
import { createMemo, createSignal, Show } from "solid-js"
import { editor } from "@/entities/editor"
import { askAgent, handoff } from "@/features/agent/handoff"
import "./SelectionAsk.css"

// A small composer at the selection: one frame selected, a line under it
// to ask the agent about that frame. The message goes to the agent panel
// (which opens) with the frame as its context, like one typed there. It
// stays out of the way while a pointer moves frames, while picking, and
// when the frame is off the canvas; it moves above the frame when there is
// no room under it.

const MIN = 240
const MAX = 380
const H = 36
const GAP = 10
/** The canvas's foot its bar stands in (40px tall, 12px up), which the ask
 * keeps clear of. */
const FOOT = 60

export default function SelectionAsk(props: {
  /** A pointer is down on the canvas (a drag, a resize, a marquee). */
  held: boolean
}) {
  const frame = createMemo(() => {
    if (props.held || handoff.picking || editor.inspecting || editor.selectedIds.length !== 1) return null
    const a = editor.artboards.find((x) => x.id === editor.selectedIds[0])
    return a && !a.hidden ? a : null
  })
  const place = createMemo(() => {
    const a = frame()
    if (!a) return null
    const { x, y, zoom } = editor.viewport
    const left = a.x * zoom + x
    const top = a.y * zoom + y
    const bottom = (a.y + a.h) * zoom + y
    const width = Math.min(MAX, Math.max(MIN, a.w * zoom))
    // Under the frame, else above its label, else not at all.
    const at =
      bottom + GAP + H <= editor.stage.h - FOOT ? bottom + GAP : top - 28 - GAP - H >= 0 ? top - 28 - GAP - H : null
    if (at === null || left + width < 0 || left > editor.stage.w) return null
    return { left: Math.min(Math.max(8, left), Math.max(8, editor.stage.w - width - 8)), top: at, width }
  })

  const [text, setText] = createSignal("")
  let field: HTMLInputElement | undefined
  function go() {
    const a = frame()
    if (!a || !text().trim()) return
    askAgent(text(), [a.id])
    setText("")
    field?.blur()
  }

  return (
    <Show when={frame()}>
      {(a) => (
        <Show when={place()}>
          {(at) => (
            <form
              class="selection-ask-scope ask"
              style={{ left: `${at().left}px`, top: `${at().top}px`, width: `${at().width}px` }}
              onSubmit={(e) => {
                e.preventDefault()
                go()
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <DitherIcon class="mark" name="Bot" size={13} strokeWidth={1.5} />
              <input
                ref={(el) => (field = el)}
                value={text()}
                name="selection-ask"
                type="text"
                placeholder={`Ask about ${a().name}`}
                aria-label={`Ask the agent about ${a().name}`}
                autocomplete="off"
                spellcheck={false}
                onInput={(e) => setText(e.currentTarget.value)}
                onKeyDown={(e) => e.key === "Escape" && field?.blur()}
              />
              <button
                type="submit"
                class="go"
                classList={{ "key-chrome": !!text().trim() }}
                disabled={!text().trim()}
                aria-label="Send to the agent"
              >
                <DitherIcon name="ArrowUp" size={12} strokeWidth={2} />
              </button>
            </form>
          )}
        </Show>
      )}
    </Show>
  )
}
