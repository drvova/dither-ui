import {
  type Accessor,
  createMemo,
  createSignal,
  For,
  type JSX,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import { editor } from "@/entities/editor"
import { type BridgeHello, modelName } from "@/features/agent/acp"
import { handoff, togglePicked } from "@/features/agent/handoff"
import type { AgentConfig, Setting, Usage } from "@/features/agent/tools"
import { modKey } from "@/shared/lib"
import { type Attachment, foldsPaste, intake, pastedText } from "../model/compose"
import {
  answerKey,
  atMatchesOf,
  atQueryOf,
  completion,
  folderOf,
  listboxOf,
  type Queue,
  recall,
  slashMatchesOf,
  slashOpenOf,
  stepped,
  withoutAt,
} from "../model/composer"
import type { Harness } from "../model/session"
import { hintOf, type Slash } from "../model/slash"
import type { Changed } from "../model/steps"
import type { Entry } from "../model/thread"
import { watching } from "../watching"
import Attached from "./Attached"
import ComposerMenus from "./ComposerMenus"
import ContextMeter from "./ContextMeter"

// The composer: the menus over it (`ComposerMenus.tsx`: the commands, the
// frames, the model, the harness, the settings), the trays the panel hands it, the strip of an
// edit under way, the card (the frames and attachments in hand, a line
// about the field, the field, its keys) and the row under it that says where
// it runs. It holds the field and its keys; the message, the session and
// what sending does are the panel's.
export type ComposerApi = { focus: () => void; blur: () => void }

/** The message being written: its words, what it carries, a line about it. */
export type Draft = {
  text: Accessor<string>
  setText: (text: string) => void
  attachments: Accessor<Attachment[]>
  setAttachments: (atts: Attachment[]) => void
  notice: Accessor<string>
  setNotice: (text: string) => void
}
/** Which menu over the composer is open, beside the field's own (`/`, `@`). */
export type Pops = { harness: boolean; settings: boolean; model: boolean }
/** Your earlier message, taken back to change and send again from there. */
export type Editing = { at: number; turn: number; was: string; restore: boolean; restorable: boolean }
type Approval = Extract<Entry, { kind: "approval" }>

export type ComposerProps = {
  draft: Draft
  config: AgentConfig
  pops: Pops
  /** What sending does now, in the field's words. */
  placeholder: string
  busy: boolean
  /** A turn runs or a prompt waits: Esc stops. */
  stoppable: boolean
  touch: boolean
  /** Who answers, and the bridge as it last said hello. */
  agentName: string
  bridgeOpen: boolean
  hello: BridgeHello | null
  connecting: boolean
  harness: Harness
  usage: Usage
  lastTurnMs: number
  commands: Slash[]
  /** The frames handed over with the message. */
  context: Changed[]
  editing: Editing | null
  /** What was sent so far, for Up and Down. */
  sent: string[]
  queue: Queue
  /** The permission prompt that waits, and when it came up. */
  asking: Approval | null
  askedAt: () => number
  /** The thread's top edge: a menu is as tall as the room under it. */
  roomTop: () => number | undefined
  trays: JSX.Element
  ref?: (api: ComposerApi) => void
  refocus: () => void
  onSend: (text?: string, now?: boolean) => void
  onAnswer: (entry: Approval, id: string) => void
  onResume: () => void
  /** Alt+Up: the last queued message back into the field. */
  onUnqueue: () => void
  onStop: () => void
  onCancelEdit: () => void
  onEditing: (ed: Editing) => void
  /** Ctrl+O: every step of the thread open, or every one closed. */
  onToggleSteps: () => void
  onDropContext: (id: string) => void
  onConnect: () => void
  onStart: (choice: string | { command: string }) => void
  onStopHarness: () => void
  onModel: (id: string) => void
  onSetting: (s: Setting, id: string) => void
  onMode: (id: string) => void
}

/** After this turn's writes have landed. */
const nextTick = (then: () => void) => queueMicrotask(then)
/* The field grows with what is typed, up to a cap, then scrolls. */
const FIELD_MAX = 176

export default function Composer(props: ComposerProps) {
  const draft = props.draft
  let box: HTMLTextAreaElement | undefined
  props.ref?.({ focus: () => box?.focus(), blur: () => box?.blur() })

  function fit() {
    const el = box
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, FIELD_MAX)}px`
  }
  watching(draft.text, () => nextTick(fit))

  /* Up walks back through what was sent (read off the thread, so it survives
   * a reload), only from an empty field; editing a recalled message makes it
   * a draft again; Down past the newest empties the field. */
  let cursor = -1
  watching(draft.text, (text) => {
    if (cursor !== -1 && text !== props.sent[cursor]) cursor = -1
  })

  /** iPad Safari ends a composition and then delivers its Enter as a key of
   * its own: an Enter this soon after a composition ended is the
   * composition's. */
  let composedAt = 0
  /** When a key was last typed in the field: a digit answers a prompt only
   * once you paused (`answerKey`). */
  let typedAt = 0
  /** The field's words come in once a composition has ended, never while
   * it runs. */
  const onCompositionEnd = (e: CompositionEvent) => {
    composedAt = Date.now()
    draft.setText((e.currentTarget as HTMLTextAreaElement).value)
  }
  const onInput = (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
    if (!e.isComposing) draft.setText(e.currentTarget.value)
  }

  /** Esc puts the command menu away until the field changes. */
  const [slashDismissed, setSlashDismissed] = createSignal(false)
  watching(draft.text, () => setSlashDismissed(false))
  const slashOpen = createMemo(() => slashOpenOf(draft.text(), slashDismissed()))
  const slashMatches = createMemo(() => slashMatchesOf(draft.text(), props.commands))
  const [slashIndex, setSlashIndex] = createSignal(0)
  watching(slashMatches, () => setSlashIndex(0))
  /** A command picked and waiting for what it takes: what that is, in words. */
  const slashHint = createMemo(() => hintOf(draft.text(), props.commands))

  /* The @ picker: typed at a word's start, or opened from the card's @ key. */
  const atQuery = createMemo(() => atQueryOf(draft.text()))
  const [atForced, setAtForced] = createSignal(false)
  const atOpen = createMemo(() => atForced() || atQuery() !== null)
  const atMatches = createMemo(() => atMatchesOf(atQuery(), editor.artboards, props.context))
  const [atIndex, setAtIndex] = createSignal(0)
  watching(atMatches, () => setAtIndex(0))
  function pickAt(id: string) {
    if (!handoff.picked.includes(id)) togglePicked(id)
    if (atQuery() !== null) draft.setText(withoutAt(draft.text()))
    setAtForced(false)
    box?.focus()
  }
  function pickSlash(c: Slash) {
    draft.setText(completion(c))
    box?.focus()
  }

  /* A menu over the composer (commands, frames, the harness, the model, the
     bridge) is as tall as the room above the composer: measured whenever one
     opens and when the panel resizes, so it never runs past the thread's top
     (the composer stands mid-panel in an empty chat). */
  let composerEl: HTMLDivElement | undefined
  const [room, setRoom] = createSignal("16rem")
  function measureRoom() {
    const top = props.roomTop()
    const at = composerEl?.getBoundingClientRect().top
    if (top === undefined || at === undefined) return
    setRoom(`${Math.max(96, Math.floor(at - top - 10))}px`)
  }
  watching(
    () => [slashOpen(), atOpen(), props.pops.harness, props.pops.settings, props.pops.model].join(),
    () => nextTick(measureRoom),
  )

  /** The open listbox and its highlighted option, which the field announces
   * (`aria-activedescendant`) and keeps in view while the arrows move it. */
  const listbox = createMemo(() =>
    listboxOf({
      slash: slashOpen() && slashMatches().length ? slashIndex() : null,
      at: atOpen() && atMatches().length ? atIndex() : null,
    }),
  )
  watching(
    () => listbox()?.active,
    (id) => id && nextTick(() => document.getElementById(id)?.scrollIntoView?.({ block: "nearest" })),
  )

  /* What comes in by paste or drop. A long text folds into a chip (the
   * field stays a field); Cmd/Ctrl+Shift+V pastes it as typed text. Files:
   * pictures and text files; anything else says why not. */
  let rawPasteUntil = 0
  async function takeFiles(files: File[]) {
    for (const f of files) {
      const got = await intake(f, draft.attachments())
      if (typeof got === "string") draft.setNotice(got)
      else draft.setAttachments([...draft.attachments(), got])
    }
  }
  function onPaste(e: ClipboardEvent) {
    const files = [...(e.clipboardData?.files ?? [])]
    if (files.length) {
      e.preventDefault()
      void takeFiles(files)
      return
    }
    const text = e.clipboardData?.getData("text/plain") ?? ""
    if (Date.now() < rawPasteUntil || !foldsPaste(text)) return
    e.preventDefault()
    draft.setAttachments([...draft.attachments(), pastedText(text, draft.attachments())])
  }
  const [dropping, setDropping] = createSignal(false)
  function onDrop(e: DragEvent) {
    setDropping(false)
    const files = [...(e.dataTransfer?.files ?? [])]
    if (!files.length) return
    e.preventDefault()
    void takeFiles(files)
    props.refocus()
  }
  const unattach = (id: string) => draft.setAttachments(draft.attachments().filter((a) => a.id !== id))
  /** A folded text back into the field, as typed text. */
  function unfold(id: string) {
    const a = draft.attachments().find((x) => x.id === id)
    if (a?.kind !== "text") return
    unattach(id)
    draft.setText(draft.text() ? `${draft.text()}\n${a.text}` : a.text)
    props.refocus()
  }

  function onKey(e: KeyboardEvent) {
    // A key that ends an IME composition (Japanese, Chinese, Korean) is the
    // composition's, never a send.
    if (e.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" && (e.repeat || Date.now() - composedAt < 500)) return
    const typedBefore = typedAt
    typedAt = Date.now()
    // An open permission prompt takes 1 to 9 from an empty field, unless it
    // came up under your typing: then only once you have paused (so a digit
    // meant for the message never answers it).
    const asking = props.asking
    const option =
      asking &&
      answerKey(
        asking.options,
        { key: e.key, meta: e.metaKey || e.ctrlKey || e.altKey, empty: !draft.text() },
        { asked: props.askedAt(), typedBefore, typed: typedAt },
      )
    if (asking && option) {
      e.preventDefault()
      props.onAnswer(asking, option.id)
      return
    }
    if (atOpen() && atMatches().length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setAtIndex(stepped(atIndex(), atMatches().length, e.key === "ArrowDown"))
        return
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault()
        pickAt(atMatches()[atIndex()].id)
        return
      }
    }
    if (atForced() && e.key === "Escape") {
      setAtForced(false)
      return
    }
    if (slashOpen() && slashMatches().length) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setSlashIndex(stepped(slashIndex(), slashMatches().length, e.key === "ArrowDown"))
        return
      }
      if (e.key === "Escape") {
        setSlashDismissed(true)
        return
      }
      if (
        e.key === "Tab" ||
        (e.key === "Enter" && !e.shiftKey && `/${slashMatches()[slashIndex()].name}` !== draft.text())
      ) {
        e.preventDefault()
        draft.setText(completion(slashMatches()[slashIndex()]))
        return
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "v" || e.key === "V" || e.code === "KeyV")) {
      rawPasteUntil = Date.now() + 1000
      return
    }
    if (e.key === "Enter" && !e.shiftKey && !props.touch) {
      e.preventDefault()
      // An empty field on a paused queue: Enter goes on with it.
      if (!draft.text().trim() && !draft.attachments().length && props.queue.paused && props.queue.items.length)
        return props.onResume()
      props.onSend(undefined, props.busy && (e.metaKey || e.ctrlKey))
      return
    }
    if (e.key === "ArrowUp" && e.altKey) {
      e.preventDefault()
      props.onUnqueue()
      return
    }
    if (e.key === "Escape") {
      if (handoff.picking) {
        handoff.picking = false
        return
      }
      if (props.pops.harness || props.pops.settings || props.pops.model) {
        props.pops.harness = false
        props.pops.settings = false
        props.pops.model = false
        return
      }
      if (props.stoppable) {
        e.preventDefault()
        props.onStop()
      } else if (props.editing) props.onCancelEdit()
      else box?.blur()
      return
    }
    if (e.ctrlKey && (e.key === "o" || e.key === "O")) {
      e.preventDefault()
      props.onToggleSteps()
      return
    }
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey) {
      const r = recall(cursor, props.sent, draft.text(), e.key)
      if (!r) return
      e.preventDefault()
      cursor = r.cursor
      draft.setText(r.text)
    }
  }

  const agent = () => props.hello?.agent ?? null
  async function togglePicker() {
    props.pops.harness = !props.pops.harness
    props.pops.settings = false
    props.pops.model = false
    if (props.pops.harness && !props.bridgeOpen) props.onConnect()
  }
  const modes = () => props.harness.modes
  const mode = () => props.harness.mode

  onMount(() => {
    window.addEventListener("resize", measureRoom)
    fit()
    onCleanup(() => window.removeEventListener("resize", measureRoom))
  })

  return (
    <div ref={(el) => (composerEl = el)} class="composer" style={{ "--room": room() }}>
      <ComposerMenus
        config={props.config}
        pops={props.pops}
        agentName={props.agentName}
        hello={props.hello}
        connecting={props.connecting}
        harness={props.harness}
        usage={props.usage}
        lastTurnMs={props.lastTurnMs}
        onStart={props.onStart}
        onStopHarness={props.onStopHarness}
        onModel={props.onModel}
        onSetting={props.onSetting}
        slash={!!(slashOpen() && slashMatches().length)}
        slashMatches={slashMatches()}
        slashIndex={slashIndex()}
        onSlash={pickSlash}
        at={atOpen()}
        atMatches={atMatches()}
        atIndex={atIndex()}
        onAt={pickAt}
      />

      {props.trays}

      <Show when={props.editing}>
        {(ed) => (
          <div class="editing" role="status">
            <p class="editing-line">
              <DitherIcon name="Edit" size={12} strokeWidth={1.5} />
              <span class="row-label is-wrap">
                Editing an earlier message. Sending goes back there: the messages after it leave the thread.
              </span>
            </p>
            <div class="editing-keys">
              <Show when={ed().restorable}>
                <label class="editing-choice">
                  <input
                    checked={ed().restore}
                    onChange={(e) => props.onEditing({ ...ed(), restore: e.currentTarget.checked })}
                    type="checkbox"
                    name="edit-restore"
                  />
                  <span class="row-label">Canvas back to before it</span>
                </label>
              </Show>
              <button type="button" class="editing-cancel" onClick={() => props.onCancelEdit()}>
                <span class="row-label">Cancel</span>
                <kbd class="row-label">esc</kbd>
              </button>
            </div>
          </div>
        )}
      </Show>
      <div
        class={`card${dropping() ? " is-dropping" : ""}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDropping(true)
        }}
        onDragLeave={(e) => e.target === e.currentTarget && setDropping(false)}
        onDrop={onDrop}
      >
        <Show when={props.context.length || draft.attachments().length}>
          <div class="chips">
            <For each={props.context}>
              {(c) => (
                <span class="ctx first-line">
                  <DitherIcon name="Layout" size={11} strokeWidth={1.5} />
                  <span class="row-label is-wrap">{c.name}</span>
                  <button
                    type="button"
                    class="ctx-x"
                    aria-label={`Leave ${c.name} out`}
                    onClick={() => props.onDropContext(c.id)}
                  >
                    <DitherIcon name="Close" size={10} strokeWidth={1.5} />
                  </button>
                </span>
              )}
            </For>
            <Attached attachments={draft.attachments()} onRemove={unattach} onUnfold={unfold} />
          </div>
        </Show>
        <Switch>
          <Match when={draft.notice()}>
            <p class="notice" role="status">
              {draft.notice()}
            </p>
          </Match>
          <Match when={slashHint()}>
            <p class="slash-hint">{slashHint()}</p>
          </Match>
        </Switch>
        <textarea
          ref={(el) => (box = el)}
          value={draft.text()}
          onInput={onInput}
          name="agent-goal"
          rows="1"
          class="prompt"
          placeholder={props.placeholder}
          enterkeyhint={props.touch ? "enter" : "send"}
          aria-label="Message the agent"
          aria-autocomplete="list"
          aria-expanded={listbox() !== null}
          aria-controls={listbox()?.id}
          aria-activedescendant={listbox()?.active}
          spellcheck={false}
          on:keydown={onKey}
          onPaste={onPaste}
          onCompositionEnd={onCompositionEnd}
        />
        <div class="foot">
          <button
            type="button"
            class="foot-key"
            aria-pressed={handoff.picking}
            aria-label="Pick frames on the canvas"
            title="Pick frames on the canvas (esc when done)"
            onClick={() => (handoff.picking = !handoff.picking)}
          >
            <DitherIcon name="Crosshair" size={13} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            class="foot-key"
            aria-label="Add a frame by name"
            title="Add a frame by name (@)"
            aria-pressed={atForced()}
            onClick={() => setAtForced(!atForced())}
          >
            @
          </button>
          <button
            type="button"
            class="pill"
            aria-expanded={props.pops.harness}
            aria-controls="agent-harness-picker"
            title={
              props.hello ? `${props.agentName || "Harness"}, bridge ${props.config.bridgeUrl}` : props.config.bridgeUrl
            }
            onClick={togglePicker}
          >
            <span class="led" data-on={String(!!agent())} aria-hidden="true"></span>
            <span class="row-label">{props.agentName || (props.bridgeOpen ? "Pick a harness" : "Harness")}</span>
            <DitherIcon name="ChevronDown" size={10} strokeWidth={1.5} />
          </button>
          <Show when={props.harness.model}>
            {(m) => (
              <button
                type="button"
                class="pill"
                aria-expanded={props.pops.model}
                aria-controls="agent-model-picker"
                title={`${props.agentName || "The harness"} runs ${modelName(m())}`}
                disabled={m().options.length < 2}
                onClick={() => {
                  props.pops.model = !props.pops.model
                  props.pops.harness = false
                  props.pops.settings = false
                }}
              >
                <span class="row-label">{modelName(m())}</span>
                <Show when={m().options.length > 1}>
                  <DitherIcon name="ChevronDown" size={10} strokeWidth={1.5} />
                </Show>
              </button>
            )}
          </Show>
          <button
            type="button"
            class={`send ${draft.text().trim() || draft.attachments().length ? "key-chrome" : "is-idle"}`}
            disabled={!draft.text().trim() && !draft.attachments().length}
            aria-label={props.busy ? `Queue (enter), or send now (${modKey("enter")})` : "Send (enter)"}
            title={props.busy ? `Queue (enter), or stop and send now (${modKey("enter")})` : "Send (enter)"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(ev) => ev.detail > 1 || props.onSend()}
          >
            <DitherIcon name="ArrowUp" size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div class="status">
        <button
          type="button"
          class="status-key"
          aria-pressed={props.config.auto}
          title={
            props.config.auto
              ? "Permission prompts are answered with their allow option"
              : "Permission prompts wait for you"
          }
          onClick={() => (props.config.auto = !props.config.auto)}
        >
          <DitherIcon name={props.config.auto ? "Unlock" : "Lock"} size={11} strokeWidth={1.5} />
          <span class="row-label">{props.config.auto ? "Auto" : "Ask"}</span>
        </button>
        <Show when={modes().length}>
          <button
            type="button"
            class="status-key"
            title={modes().find((m) => m.id === mode())?.description || "Switch mode"}
            onClick={() => props.onMode(modes()[(modes().findIndex((m) => m.id === mode()) + 1) % modes().length].id)}
          >
            <DitherIcon name="Bot" size={11} strokeWidth={1.5} />
            <span class="row-label">{modes().find((m) => m.id === mode())?.name || mode()}</span>
          </button>
        </Show>
        <button
          type="button"
          class="status-key is-glyph"
          aria-label="Follow the agent"
          title={
            props.config.follow
              ? "Following the agent: the canvas pans to each frame it changes"
              : "Follow the agent: pan the canvas to each frame it changes"
          }
          aria-pressed={props.config.follow}
          onClick={() => (props.config.follow = !props.config.follow)}
        >
          <DitherIcon name="Eye" size={12} strokeWidth={1.5} />
        </button>
        <Show when={props.hello}>
          {(at) => (
            <span class="status-key is-static" title={at().cwd}>
              <DitherIcon name="Folder" size={11} strokeWidth={1.5} />
              <span class="row-label">{folderOf(at().cwd)}</span>
            </span>
          )}
        </Show>
        <Show when={props.harness.context}>{(use) => <ContextMeter class="status-meter" use={use()} />}</Show>
        <button
          type="button"
          class="status-key is-icon"
          aria-pressed={props.pops.settings}
          aria-label="Settings"
          title="Settings: the bridge and the harness's own"
          onClick={() => {
            props.pops.settings = !props.pops.settings
            props.pops.harness = false
          }}
        >
          <DitherIcon name="Settings" size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
