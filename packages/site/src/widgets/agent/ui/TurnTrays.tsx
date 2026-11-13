import { createEffect, createMemo, createSignal, For, Index, Match, on, Show, Switch } from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import type { Queued } from "@/widgets/agent/model/compose"
import Mascot from "@/shared/ui/Mascot"
import type { Changed } from "../model/steps"
import type { Todo } from "../model/thread"
import "./TurnTrays.css"

// The stack over the input, rows on the composer's own surface (one piece
// with the card under it): what to ask next, the turn's plan as to-dos,
// the queue (each message to edit, send now, move up or remove; paused
// after a stop until you send the next), the run (what the harness does, for how long, a quiet Stop)
// and, last and resting on the card, what the turn changed on the canvas
// (Undo all, Keep, each frame to show, undo or keep; a frame just undone
// can be put back).
export type TurnTraysProps = {
  /** Next prompts to offer, one tap each. */
  next: string[]
  todos: Todo[] | null
  queue: Queued[]
  /** The queue waits after a stop until Send next or a new message. */
  paused: boolean
  /** The run, while it lasts; `stuck`: a stop the harness has not answered. */
  run: { doing: string; time: string; stopping: boolean; stuck: boolean } | null
  changes: { frames: Changed[] } | null
  /** The frame just undone, by name, which can go back as the turn left it. */
  putBack?: string | null
  /** Frames still on the canvas (a removed one has nothing to show). */
  shown: (id: string) => boolean
  onAsk?: (text: string) => void
  onStop?: () => void
  onForceStop?: () => void
  onUnqueue?: (id: string) => void
  onEditQueued?: (id: string) => void
  onSendNow?: (id: string) => void
  onMoveUp?: (id: string) => void
  onClearQueue?: () => void
  onResume?: () => void
  onUndo?: () => void
  onKeep?: () => void
  onShow?: (id: string) => void
  onUndoFrame?: (id: string) => void
  onKeepFrame?: (id: string) => void
  onPutBack?: () => void
}

export default function TurnTrays(props: TurnTraysProps) {
  const [changesOpen, setChangesOpen] = createSignal(false)
  const done = createMemo(() => props.todos?.filter((t) => t.status === "completed").length ?? 0)
  /** The to-dos stay open while there is work left and fold once all are
   * done, unless the reader opened or closed them. */
  const [todosChosen, setTodosChosen] = createSignal<boolean | null>(null)
  const todosOpen = createMemo(() => todosChosen() ?? done() < (props.todos?.length ?? 0))
  // A new turn's plan starts from the default again.
  const has = createMemo(() => !!props.todos?.length)
  createEffect(on(has, (has) => has || setTodosChosen(null), { defer: true }))

  return (
    <>
      <Show when={props.next.length}>
        <div class="turn-trays-scope part">
          <For each={props.next}>
            {(s) => (
              <button type="button" class="row is-key first-line" title={`Send: ${s}`} onClick={() => props.onAsk?.(s)}>
                <DitherIcon name="Sparkles" size={12} strokeWidth={1.5} />
                <span class="row-text row-label is-wrap">{s}</span>
                <DitherIcon class="go" name="ArrowUp" size={11} strokeWidth={1.5} />
              </button>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.todos?.length ? props.todos : null}>
        {(todos) => (
          <div class="turn-trays-scope part">
            <button type="button" class="head" aria-expanded={todosOpen()} onClick={() => setTodosChosen(!todosOpen())}>
              <DitherIcon name={todosOpen() ? "ChevronDown" : "ChevronRight"} size={12} strokeWidth={1.5} />
              <span class="row-label">
                {todos().length} {todos().length === 1 ? "to-do" : "to-dos"}
              </span>
              <span class="row-label dim">
                {done()} of {todos().length} done
              </span>
            </button>
            <Show when={todosOpen()}>
              <ul class="rows">
                <Index each={todos()}>
                  {(t) => (
                    <li class="row first-line" data-status={t().status}>
                      <Show
                        when={t().status === "completed"}
                        fallback={<span class="circle" aria-hidden="true"></span>}
                      >
                        <DitherIcon name="CheckCircle" size={12} strokeWidth={1.5} />
                      </Show>
                      <span class="row-text row-label is-wrap">{t().content}</span>
                    </li>
                  )}
                </Index>
              </ul>
            </Show>
          </div>
        )}
      </Show>
      <Show when={props.queue.length}>
        <div class="turn-trays-scope part">
          <div class="head is-split">
            <p class="grow is-static">
              <span class="row-label">{props.queue.length} in queue</span>
            </p>
            <Show when={props.paused && !props.run}>
              <button type="button" class="key is-primary" onClick={() => props.onResume?.()}>
                <span class="row-label">Send next</span>
              </button>
            </Show>
            <button type="button" class="key" onClick={() => props.onClearQueue?.()}>
              <span class="row-label">Clear</span>
            </button>
          </div>
          <Show when={props.paused}>
            <p class="row first-line dim">
              <DitherIcon name="Pause" size={12} strokeWidth={1.5} />
              <span class="row-text row-label is-wrap">
                Paused after the stop. Send next, or Enter in an empty field, goes on.
              </span>
            </p>
          </Show>
          <ul class="rows">
            <For each={props.queue}>
              {(q, j) => (
                <li class="row first-line">
                  <span class="circle" aria-hidden="true"></span>
                  <span class="row-text row-label is-wrap" title={q.text}>
                    {q.text || "(no words)"}
                    <Show when={q.attachments.length}>
                      {" "}
                      <span class="dim">
                        with {q.attachments.length} {q.attachments.length === 1 ? "attachment" : "attachments"}
                      </span>
                    </Show>
                  </span>
                  <Show when={j() > 0}>
                    <button
                      type="button"
                      class="row-key"
                      aria-label={`Move up: ${q.text}`}
                      title="Move up"
                      onClick={() => props.onMoveUp?.(q.id)}
                    >
                      <DitherIcon name="ArrowUp" size={11} strokeWidth={1.5} />
                    </button>
                  </Show>
                  <button
                    type="button"
                    class="row-key"
                    aria-label={`Edit: ${q.text}`}
                    title="Edit (alt ↑ takes the last back)"
                    onClick={() => props.onEditQueued?.(q.id)}
                  >
                    <DitherIcon name="Edit" size={11} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    class="row-key is-word"
                    title={props.run ? "Stop the turn and send this next" : "Send this now"}
                    onClick={() => props.onSendNow?.(q.id)}
                  >
                    <span class="row-label">Send now</span>
                  </button>
                  <button
                    type="button"
                    class="row-key"
                    aria-label={`Remove: ${q.text}`}
                    title="Remove"
                    onClick={() => props.onUnqueue?.(q.id)}
                  >
                    <DitherIcon name="Close" size={11} strokeWidth={1.5} />
                  </button>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
      <Switch>
        <Match when={props.run}>
          {(run) => (
            <div class="turn-trays-scope part run">
              {/* the mascot flies while the harness works, in the spinner's 12px slot */}
              <Mascot size={14} pose="fly" class="run-mascot" />
              <span class="row-label run-time">
                {run().doing} for {run().time}
              </span>
              <Show
                when={run().stuck}
                fallback={
                  <button
                    type="button"
                    class="quiet"
                    title="Stop (esc)"
                    disabled={run().stopping}
                    onClick={() => props.onStop?.()}
                  >
                    <span class="row-label">{run().stopping ? "Stopping…" : "Stop"}</span>
                    <Show when={!run().stopping}>
                      <kbd class="row-label">esc</kbd>
                    </Show>
                  </button>
                }
              >
                <button
                  type="button"
                  class="quiet text-destructive"
                  title="The harness is not answering the stop: end its process"
                  onClick={() => props.onForceStop?.()}
                >
                  <span class="row-label">Force stop</span>
                </button>
              </Show>
            </div>
          )}
        </Match>
        <Match when={props.changes}>
          {(changes) => (
            <div class="turn-trays-scope part">
              <Show when={changes().frames.length}>
                <div class="head is-split">
                  <button
                    type="button"
                    class="toggle"
                    aria-expanded={changesOpen()}
                    onClick={() => setChangesOpen(!changesOpen())}
                  >
                    <DitherIcon name={changesOpen() ? "ChevronDown" : "ChevronRight"} size={12} strokeWidth={1.5} />
                    <span class="row-label">
                      {changes().frames.length} {changes().frames.length === 1 ? "frame" : "frames"} changed
                    </span>
                  </button>
                  <button type="button" class="key" onClick={() => props.onUndo?.()}>
                    <span class="row-label">Undo all</span>
                  </button>
                  <button type="button" class="key is-primary" onClick={() => props.onKeep?.()}>
                    <span class="row-label">Keep</span>
                  </button>
                </div>
              </Show>
              <Show when={props.putBack}>
                <p class="row first-line dim" role="status">
                  <DitherIcon name="Undo" size={12} strokeWidth={1.5} />
                  <span class="row-text row-label is-wrap">Undid {props.putBack}</span>
                  <button type="button" class="row-key is-word" onClick={() => props.onPutBack?.()}>
                    <span class="row-label">Put it back</span>
                  </button>
                </p>
              </Show>
              <Show when={changesOpen() && changes().frames.length}>
                <ul class="rows">
                  <For each={changes().frames}>
                    {(f) => (
                      <li class="row first-line">
                        <DitherIcon name="Layout" size={12} strokeWidth={1.5} />
                        <span class="row-text row-label is-wrap">{f.name}</span>
                        <Show when={props.shown(f.id)}>
                          <button
                            type="button"
                            class="row-key is-word"
                            aria-label={`Show ${f.name}`}
                            onClick={() => props.onShow?.(f.id)}
                          >
                            <span class="row-label">Show</span>
                          </button>
                        </Show>
                        <button
                          type="button"
                          class="row-key is-word"
                          aria-label={`Undo ${f.name}`}
                          title={`Undo what the turn did to ${f.name}`}
                          onClick={() => props.onUndoFrame?.(f.id)}
                        >
                          <span class="row-label">Undo</span>
                        </button>
                        <button
                          type="button"
                          class="row-key is-word"
                          aria-label={`Keep ${f.name}`}
                          onClick={() => props.onKeepFrame?.(f.id)}
                        >
                          <span class="row-label">Keep</span>
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </div>
          )}
        </Match>
      </Switch>
    </>
  )
}
