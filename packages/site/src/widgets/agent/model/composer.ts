// The composer as data: the menus the field opens (the commands on `/`, the
// frames on `@`) and the option each highlights, what Up and Down recall,
// the queue of messages written while a turn runs, and what the field says
// sending will do now. Pure: `ui/Composer.tsx` holds the field and its keys.
import type { AgentConfig, Setting, Usage } from "@/features/agent"
import type { BridgeHello } from "@/features/agent/acp"
import { moved, type Queued } from "./compose"
import type { Harness } from "./session"
import type { Slash } from "./slash"

/* ---------------------------------- menus --------------------------------- */

/** Which menu over the composer is open, beside the field's own (`/`, `@`). */
export type Pops = { harness: boolean; settings: boolean; model: boolean }

/** The composer's props its menus (`ui/ComposerMenus.tsx`) take: the
 * harness they show and what they do to it. */
export type HarnessMenus = {
  config: AgentConfig
  pops: Pops
  /** Who answers, and the bridge as it last said hello. */
  agentName: string
  hello: BridgeHello | null
  connecting: boolean
  harness: Harness
  usage: Usage
  lastTurnMs: number
  onStart: (choice: string | { command: string }) => void
  onStopHarness: () => void
  onModel: (id: string) => void
  onSetting: (s: Setting, id: string) => void
}

/** The command menu shows while the field is one /word, until Esc. */
export const slashOpenOf = (text: string, dismissed: boolean) => !dismissed && /^\/[\w-]*$/.test(text)
export function slashMatchesOf(text: string, all: readonly Slash[]): Slash[] {
  const q = text.slice(1).toLowerCase()
  return all.filter((c) => c.name.startsWith(q))
}
/** A command picked into the field, with room for what it takes. */
export const completion = (c: Slash) => `/${c.name}${c.args ? " " : ""}`

/** The @ word being typed at the field's end (at a word's start), or null. */
export const atQueryOf = (text: string): string | null => /(?:^|\s)@([^\s@]*)$/.exec(text)?.[1] ?? null
/** The frames the @ word names, the ones already in hand left out. */
export function atMatchesOf<A extends { id: string; name: string }>(
  query: string | null,
  frames: readonly A[],
  inHand: readonly { id: string }[],
): A[] {
  const q = (query ?? "").toLowerCase()
  return frames.filter((a) => a.name.toLowerCase().includes(q) && !inHand.some((c) => c.id === a.id))
}
/** The field once a frame is picked from its @ word: the word goes. */
export const withoutAt = (text: string) => text.replace(/(^|\s)@[^\s@]*$/, "$1")

/** The option after (or before) `i` of `n`, round the ends. */
export const stepped = (i: number, n: number, down: boolean) => (i + (down ? 1 : n - 1)) % n

/** The open listbox and its highlighted option, which the field announces. */
export function listboxOf(menu: { slash: number | null; at: number | null }) {
  return menu.slash !== null
    ? { id: "agent-commands", active: `agent-command-${menu.slash}` }
    : menu.at !== null
      ? { id: "agent-frames", active: `agent-frame-${menu.at}` }
      : null
}

/* --------------------------------- recall --------------------------------- */

/** Up walks back through what was sent from an empty field (or from a
 * message recalled); Down walks forward, past the newest to an empty field.
 * `cursor` is the place in `sent`, -1 for none. Null: the key is the field's. */
export function recall(
  cursor: number,
  sent: readonly string[],
  text: string,
  key: "ArrowUp" | "ArrowDown",
): { cursor: number; text: string } | null {
  const recalling = cursor !== -1
  if (key === "ArrowUp" && sent.length && (recalling || !text)) {
    const at = recalling ? Math.max(0, cursor - 1) : sent.length - 1
    return { cursor: at, text: sent[at] }
  }
  if (key === "ArrowDown" && recalling) {
    const at = cursor + 1 < sent.length ? cursor + 1 : -1
    return { cursor: at, text: at === -1 ? "" : sent[at] }
  }
  return null
}

/* ---------------------------------- queue --------------------------------- */

/** Messages written while a turn runs, in the order they go; `paused` after
 * a stop, until you send one or press Send next. */
export type Queue = { items: Queued[]; paused: boolean }
export const NO_QUEUE: Queue = { items: [], paused: false }

/** A message joins the queue: last, or first (it goes next). */
export const enqueued = (q: Queue, item: Queued, first = false): Queue => ({
  ...q,
  items: first ? [item, ...q.items] : [...q.items, item],
})
/** A queued message to the front, the queue going on; null when it is gone. */
export function toFront(q: Queue, id: string): Queue | null {
  const at = q.items.findIndex((x) => x.id === id)
  if (at < 0) return null
  return { items: [q.items[at], ...q.items.filter((x) => x.id !== id)], paused: false }
}
export const without = (q: Queue, id: string): Queue => ({ ...q, items: q.items.filter((x) => x.id !== id) })
/** A queued message one place toward the front. */
export const movedUp = (q: Queue, id: string): Queue => ({
  ...q,
  items: moved(
    q.items,
    q.items.findIndex((x) => x.id === id),
    -1,
  ),
})

/* -------------------------------- the field ------------------------------- */

/** What the field says sending does now: answer the prompt that waits,
 * queue behind the stop or the turn, start the bridge or the harness, or ask. */
export function placeholderOf(s: {
  asking: { options: readonly unknown[] } | null
  stopping: boolean
  busy: boolean
  bridge: boolean
  agent: boolean
}): string {
  return s.asking
    ? `Answer 1 to ${Math.min(9, s.asking.options.length)}, or redirect`
    : s.stopping
      ? "Queue for after the stop"
      : s.busy
        ? "Queue a follow-up"
        : !s.bridge
          ? "Ask; this starts the bridge"
          : !s.agent
            ? "Ask; this starts your harness"
            : "Ask, / for commands"
}

/** Tokens as the status says them (12.3k, 45k). */
export const tokensOf = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n))
/** A turn's length as the settings say it. */
export const msOf = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`)
/** The folder's own name out of a path, either separator. */
export const folderOf = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path

/** A digit typed while a permission prompt waits answers it only once you
 * have paused this long since the key before, or since it came up. */
export const TYPING_GUARD = 1500
/** The option a key answers: 1 to 9 from an empty field, unless the prompt
 * came up under your typing and you have not paused since. */
export function answerKey<O>(
  options: readonly O[],
  key: { key: string; meta: boolean; empty: boolean },
  times: { asked: number; typedBefore: number; typed: number },
): O | null {
  const settled = times.asked - times.typedBefore >= TYPING_GUARD || times.typed - times.typedBefore >= TYPING_GUARD
  if (!settled || !key.empty || key.meta || !/^[1-9]$/.test(key.key)) return null
  return options[Number(key.key) - 1] ?? null
}
