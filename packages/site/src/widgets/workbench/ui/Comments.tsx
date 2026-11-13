// Comment threads pinned to live elements: a numbered pin rides its element
// through re-renders (found again by its child path), opens its thread —
// messages, a reply field, resolve / reopen, delete. A new thread starts
// where the Comment tool clicks. Enter posts, Shift+Enter breaks the line,
// Escape closes.
import { createEffect, createMemo, createSignal, on, Show } from "solid-js"
import { ICONS } from "@/widgets/workbench/model/tools"
import { useBench } from "../context"
import Icon from "./Icon"
import Keyed from "./Keyed"
import "./Comments.css"

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000)
  return s < 60
    ? "now"
    : s < 3600
      ? `${Math.round(s / 60)}m`
      : s < 86400
        ? `${Math.round(s / 3600)}h`
        : `${Math.round(s / 86400)}d`
}

export default function Comments() {
  const b = useBench()
  const [text, setText] = createSignal("")
  let field: HTMLTextAreaElement | undefined
  const thread = createMemo(() => b.ws().threads.find((t) => t.id === b.openThread()) ?? null)

  /** Where the popover opens: beside the pin, kept on the stage. */
  const place = createMemo(() => {
    const th = thread()
    const p = th ? b.pins()[th.id] : b.draftThread()?.at
    if (!p) return null
    const w = 264
    const left = Math.min(Math.max(8, p.x + 14), Math.max(8, b.size().w - w - 8))
    return { left: `${left}px`, top: `${p.y + 14}px`, width: `${w}px` }
  })

  createEffect(
    on(
      [b.openThread, b.draftThread],
      () => {
        setText("")
        queueMicrotask(() => field?.focus())
      },
      { defer: true },
    ),
  )

  function send() {
    const th = thread()
    if (!text().trim()) return
    if (b.draftThread()) b.submitThread(text())
    else if (th) b.reply(th.id, text())
    setText("")
  }

  function toggle(id: string) {
    b.setDraftThread(null)
    b.setOpenThread(b.openThread() === id ? null : id)
  }

  function close() {
    b.setOpenThread(null)
    b.setDraftThread(null)
  }

  function key(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    } else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  }

  return (
    <div class="wb-comments comments-scope">
      <Keyed each={b.ws().threads}>
        {(t) => (
          <button
            type="button"
            class={`pin${t().resolved ? " resolved" : ""}${b.openThread() === t().id ? " open" : ""}`}
            style={{
              left: `${b.pins()[t().id]?.x}px`,
              top: `${b.pins()[t().id]?.y}px`,
              display: b.pins()[t().id] ? undefined : "none",
            }}
            aria-label={`Comment ${t().n}${t().resolved ? ", resolved" : ""}: ${t().messages[0]?.text}`}
            aria-expanded={b.openThread() === t().id}
            on:pointerdown={(e) => e.stopPropagation()}
            onClick={() => toggle(t().id)}
          >
            {t().n}
          </button>
        )}
      </Keyed>
      <Show when={b.draftThread()}>
        {(d) => (
          <span class="pin draft" style={{ left: `${d().at.x}px`, top: `${d().at.y}px` }}>
            +
          </span>
        )}
      </Show>
      <Show when={(thread() || b.draftThread()) && place()}>
        {(at) => (
          <div
            class="pop"
            role="dialog"
            aria-label={thread() ? `Comment ${thread()!.n} on ${thread()!.anchor.label}` : "New comment"}
            style={at()}
            on:pointerdown={(e) => e.stopPropagation()}
          >
            <header class="head">
              <span class="micro">
                {thread() ? `#${thread()!.n}` : "New"} on {thread()?.anchor.label ?? b.draftThread()?.label}
              </span>
              <button type="button" class="icon" aria-label="Close" onClick={close}>
                <Icon d={ICONS.close} size={14} />
              </button>
            </header>
            <Show when={thread()}>
              {(th) => (
                <ol class="msgs">
                  <Keyed each={th().messages}>
                    {(m) => (
                      <li class="msg">
                        <p>{m().text}</p>
                        <span class="meta">
                          {ago(m().at)}{" "}
                          <button
                            type="button"
                            class="link"
                            aria-label={`Delete: ${m().text.slice(0, 40)}`}
                            onClick={() => b.removeMessage(th().id, m().id)}
                          >
                            delete
                          </button>
                        </span>
                      </li>
                    )}
                  </Keyed>
                </ol>
              )}
            </Show>
            <textarea
              ref={(el) => (field = el)}
              value={text()}
              class="field"
              rows="2"
              aria-label={thread() ? "Reply" : `Comment on ${b.draftThread()?.label}`}
              placeholder={thread() ? "Reply…" : "What should change here?"}
              onInput={(e) => setText(e.currentTarget.value)}
              on:keydown={key}
            />
            <footer class="foot">
              <Show when={thread()}>
                {(th) => (
                  <>
                    <button type="button" class="act" onClick={() => b.setResolved(th().id, !th().resolved)}>
                      {th().resolved ? "Reopen" : "Resolve"}
                    </button>
                    <button type="button" class="act" onClick={() => b.moveThread(th().id)}>
                      Move
                    </button>
                    <button type="button" class="act" onClick={() => b.removeThread(th().id)}>
                      Delete
                    </button>
                  </>
                )}
              </Show>
              <button type="button" class="act primary" disabled={!text().trim()} onClick={send}>
                {thread() ? "Reply" : "Comment"}
              </button>
            </footer>
          </div>
        )}
      </Show>
    </div>
  )
}
