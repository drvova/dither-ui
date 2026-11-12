import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { DitherIcon } from "@dither-kit"
import { type Entry, secondsOf } from "../model/thread"
import Prose from "./Prose"
import "./ThreadEntry.css"

// One entry of the composer's thread, as the panel hands it: your message
// as a bubble (its restore key beside it), the reply as prose with a copy
// key, the harness's reasoning and each step as folds, a permission prompt
// answered in place, the turn's close. The panel owns every state; this
// only draws it and says what was asked.
export type ThreadEntryProps = {
  entry: Entry
  /** The reply streaming now / the thought streaming now. */
  live?: boolean
  /** The reply was just copied. */
  copied?: boolean
  /** The message's checkpoint can be restored. */
  restorable?: boolean
  /** Your message can be edited and sent again from here (no turn running). */
  editable?: boolean
  /** The thread's newest entry while the harness is idle: a turn's close
   * then offers its next move (Continue after a stop, Try again after a
   * failure). */
  latest?: boolean
  /** The permission prompt that takes the number keys. */
  numbered?: boolean
  onRestore?: () => void
  onEdit?: () => void
  onQuote?: () => void
  onCopy?: () => void
  onAnswer?: (id: string) => void
  onToggle?: (open: boolean) => void
  onAgain?: () => void
  onContinue?: () => void
}

type Of<K extends Entry["kind"]> = Extract<Entry, { kind: K }>
/** A long message folds to its first lines until opened. */
const LONG = { lines: 8, chars: 600 }

export default function ThreadEntry(props: ThreadEntryProps) {
  /** The entry read as one of its kinds, or nothing when it is another. */
  const as =
    <K extends Entry["kind"]>(...kinds: K[]) =>
    () =>
      (kinds as string[]).includes(props.entry.kind) ? (props.entry as Extract<Entry, { kind: K }>) : undefined
  const message = as("user", "followup") as () => Of<"user" | "followup"> | undefined
  const said = as("assistant", "system", "error") as () => Of<"assistant" | "system" | "error"> | undefined
  const thought = as("thought")
  const tool = as("tool")
  const activity = as("activity")
  const approval = as("approval")
  const worked = as("worked")

  const long = createMemo(() => {
    const m = message()
    return !!m && (m.text.split("\n").length > LONG.lines || m.text.length > LONG.chars)
  })
  const [unfolded, setUnfolded] = createSignal(false)
  const toggled = (e: Event) => props.onToggle?.((e.target as HTMLDetailsElement).open)

  return (
    <Switch>
      <Match when={message()}>
        {(entry) => (
          <div class="thread-entry-scope msg-row">
            <div class="msg-keys">
              <Show when={props.editable}>
                <button
                  type="button"
                  class="restore"
                  aria-label="Edit from here"
                  title="Edit and send again from here"
                  onClick={() => props.onEdit?.()}
                >
                  <DitherIcon name="Edit" size={12} strokeWidth={1.5} />
                </button>
              </Show>
              <Show when={props.restorable}>
                <button
                  type="button"
                  class="restore"
                  aria-label="Restore checkpoint"
                  title="Restore checkpoint: the canvas as it was before this message"
                  onClick={() => props.onRestore?.()}
                >
                  <DitherIcon name="Undo" size={12} strokeWidth={1.5} />
                </button>
              </Show>
              <button
                type="button"
                class="restore"
                aria-label={props.copied ? "Copied" : "Copy message"}
                title={props.copied ? "Copied" : "Copy message"}
                onClick={() => props.onCopy?.()}
              >
                <DitherIcon name={props.copied ? "Check" : "Copy"} size={12} strokeWidth={1.5} />
              </button>
            </div>
            <div class="msg">
              <Show when={entry().context?.length || entry().attached?.length}>
                <div class="chips">
                  <For each={entry().context}>
                    {(c) => (
                      <span class="ctx first-line" title={entry().pictured ? `${c.name}, sent with a picture` : c.name}>
                        <DitherIcon name={entry().pictured ? "Image" : "Layout"} size={11} strokeWidth={1.5} />
                        <span class="row-label is-wrap">{c.name}</span>
                      </span>
                    )}
                  </For>
                  <For each={entry().attached ?? []}>
                    {(f) => (
                      <span class="ctx first-line" title={`${f.name}, ${f.detail}`}>
                        <DitherIcon
                          name={f.kind === "image" ? "Image" : f.kind === "quote" ? "Bookmark" : "File"}
                          size={11}
                          strokeWidth={1.5}
                        />
                        <span class="row-label is-wrap">{f.name}</span>
                      </span>
                    )}
                  </For>
                </div>
              </Show>
              <p class="msg-text" data-folded={long() && !unfolded() ? "true" : undefined}>
                {entry().text}
              </p>
              <Show when={long()}>
                <button type="button" class="more" aria-expanded={unfolded()} onClick={() => setUnfolded(!unfolded())}>
                  {unfolded() ? "Show less" : "Show more"}
                </button>
              </Show>
            </div>
          </div>
        )}
      </Match>
      <Match when={props.entry.kind === "assistant" && said()}>
        {(entry) => (
          <div class="thread-entry-scope reply">
            <Prose text={entry().text} live={props.live} />
            <Show when={!props.live}>
              <div class="reply-actions">
                <button
                  type="button"
                  class="row-key"
                  aria-label={props.copied ? "Copied" : "Copy reply"}
                  title={props.copied ? "Copied" : "Copy reply"}
                  onClick={() => props.onCopy?.()}
                >
                  <DitherIcon name={props.copied ? "Check" : "Copy"} size={12} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  class="row-key"
                  aria-label="Quote reply"
                  title="Quote this reply in your message (or select a part of it)"
                  onClick={() => props.onQuote?.()}
                >
                  <DitherIcon name="Bookmark" size={12} strokeWidth={1.5} />
                </button>
              </div>
            </Show>
          </div>
        )}
      </Match>
      <Match when={thought()}>
        {(entry) => (
          <details class="thread-entry-scope thought fold" open={entry().open} onToggle={toggled}>
            <summary>
              <Show when={props.live} fallback={<DitherIcon name="Sparkles" size={12} strokeWidth={1.5} />}>
                <span class="spin" aria-hidden="true"></span>
              </Show>
              <span class="row-label">
                {props.live ? "Thinking" : entry().ms ? `Thought for ${secondsOf(entry().ms!)}` : "Thought"}
              </span>
              <DitherIcon class="chev" name="ChevronRight" size={11} strokeWidth={1.5} />
            </summary>
            <p class="thought-text">{entry().text.trim()}</p>
          </details>
        )}
      </Match>
      <Match when={tool()}>
        {(entry) => (
          <details
            class="thread-entry-scope step fold"
            open={entry().open}
            data-ok={String(entry().ok)}
            onToggle={toggled}
          >
            <summary class="first-line" title={entry().summary}>
              <DitherIcon name={entry().icon ?? "Terminal"} size={12} strokeWidth={1.5} />
              <span class="row-label is-wrap">{entry().title || entry().name}</span>
              <DitherIcon class="chev" name="ChevronRight" size={11} strokeWidth={1.5} />
            </summary>
            <pre class="detail">{entry().detail}</pre>
          </details>
        )}
      </Match>
      <Match when={activity()}>
        {(entry) => (
          <div class="thread-entry-scope step activity first-line" data-status={entry().status}>
            <Show
              when={entry().status === "pending" || entry().status === "in_progress"}
              fallback={
                <DitherIcon
                  name={entry().status === "failed" ? "XCircle" : "CheckCircle"}
                  size={12}
                  strokeWidth={1.5}
                />
              }
            >
              <span class="spin" aria-hidden="true"></span>
            </Show>
            <span class="row-label is-wrap">{entry().title}</span>
          </div>
        )}
      </Match>
      <Match when={approval()}>
        {(entry) => (
          <div class="thread-entry-scope approval" data-answered={String(entry().answered !== null)}>
            <p class="approval-title">
              <DitherIcon name="AlertTriangle" size={12} strokeWidth={1.5} />
              {entry().title}
            </p>
            <Show when={entry().code}>
              {(code) => (
                <details class="fold approval-code" open={entry().answered === null}>
                  <summary>
                    <DitherIcon name="Code" size={12} strokeWidth={1.5} />
                    <span class="row-label">Its code, {code().split("\n").length} lines</span>
                    <DitherIcon class="chev" name="ChevronRight" size={11} strokeWidth={1.5} />
                  </summary>
                  <pre class="detail">{code()}</pre>
                </details>
              )}
            </Show>
            <Show when={entry().answered === null} fallback={<p class="note">Answered {entry().answered}</p>}>
              <div class="choices">
                <For each={entry().options}>
                  {(o, n) => (
                    <button
                      type="button"
                      class={`key first-line${o.primary ? " is-primary" : ""}`}
                      aria-keyshortcuts={props.numbered && n() < 9 ? String(n() + 1) : undefined}
                      onClick={() => props.onAnswer?.(o.id)}
                    >
                      <Show when={props.numbered && n() < 9}>
                        <span class="num" aria-hidden="true">
                          {n() + 1}
                        </span>
                      </Show>
                      <span class="row-label is-wrap">{o.label}</span>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        )}
      </Match>
      <Match when={worked()}>
        {(entry) => (
          <div class="thread-entry-scope worked" data-end={entry().end}>
            <p>
              <DitherIcon
                name={entry().end === "stopped" ? "Pause" : entry().end === "failed" ? "AlertCircle" : "Clock"}
                size={11}
                strokeWidth={1.5}
              />
              <span class="row-label">
                {entry().end === "stopped" ? "Stopped after" : entry().end === "failed" ? "Failed after" : "Worked for"}{" "}
                {secondsOf(entry().ms)}
              </span>
            </p>
            <Switch>
              <Match when={props.latest && entry().end === "stopped"}>
                <button type="button" class="key" onClick={() => props.onContinue?.()}>
                  <DitherIcon name="Play" size={11} strokeWidth={1.5} />
                  <span class="row-label">Continue</span>
                </button>
              </Match>
              <Match when={props.latest && entry().end === "failed"}>
                <button type="button" class="key" onClick={() => props.onAgain?.()}>
                  <DitherIcon name="Refresh" size={11} strokeWidth={1.5} />
                  <span class="row-label">Try again</span>
                </button>
              </Match>
            </Switch>
          </div>
        )}
      </Match>
      <Match when={props.entry.kind === "error" && said()}>
        {(entry) => <p class="thread-entry-scope line-error">{entry().text}</p>}
      </Match>
      <Match when={props.entry.kind === "system" && said()}>
        {(entry) => <p class="thread-entry-scope line-system">{entry().text}</p>}
      </Match>
    </Switch>
  )
}
