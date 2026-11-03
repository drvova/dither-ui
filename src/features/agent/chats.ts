// A project's chats with the agent: the list the Studio's sidebar shows
// (newest first, each with its title and when it last moved), the chat open
// in the agent panel, and each chat's thread (capped). The page and the
// panel share it and both open the active project through it. Imported by
// path (`features/agent/chats`), so the page never pulls the agent's
// protocol into its chunk.
import { reactive } from "vue"
import { readJson, storage, writeJson } from "@/shared/lib/storage"
import type { Usage } from "./tools"

export type ChatMeta = { id: string; title: string; at: number }
export type AgentSession<E> = { entries: E[]; usage: Usage }

const INDEX = "dither-agent-chats-"
const SESSION = "dither-agent-session-"
const CAP = 160_000

export const chats = reactive({
  /** The project whose chats these are. */
  project: "",
  /** Chats with something said in them, newest first. */
  list: [] as ChatMeta[],
  /** The chat open in the panel; a new one is not listed until it moves. */
  active: "",
})

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const threadKey = (project: string, chat: string) => `${SESSION}${project}/${chat}`
const isMeta = (c: unknown): c is ChatMeta =>
  !!c &&
  typeof c === "object" &&
  typeof (c as ChatMeta).id === "string" &&
  typeof (c as ChatMeta).title === "string" &&
  typeof (c as ChatMeta).at === "number"
const writeIndex = () => writeJson(INDEX + chats.project, chats.list)

/** The chat's title: its first message's first line, else a new chat. */
export function titleOf(entries: readonly { kind: string; text?: string }[]): string {
  const first = entries.find((e) => e.kind === "user")
  return first?.text?.split("\n")[0] || "New chat"
}

/** Open a project's chats (a no-op when they are open): its newest chat,
 * else a new one. A thread kept before chats existed becomes its first. */
export function openProject(project: string): void {
  if (chats.project === project) return
  const stored = readJson(INDEX + project)
  chats.project = project
  chats.list = Array.isArray(stored) ? stored.filter(isMeta) : []
  const earlier = storage.get(SESSION + project)
  if (earlier !== null) {
    const id = newId()
    storage.set(threadKey(project, id), earlier)
    storage.remove(SESSION + project)
    const thread = loadThread<{ kind: string; text?: string }>(project, id)
    chats.list.unshift({ id, title: titleOf(thread?.entries ?? []), at: Date.now() })
    writeIndex()
  }
  chats.active = chats.list[0]?.id ?? newId()
}

/** A fresh chat, open; it joins the list once something is said in it. */
export function newChat(): void {
  chats.active = newId()
}

export function openChat(id: string): void {
  if (chats.list.some((c) => c.id === id)) chats.active = id
}

/** A chat gone, its thread with it; the newest left (or a new one) opens. */
export function removeChat(id: string): void {
  storage.remove(threadKey(chats.project, id))
  chats.list = chats.list.filter((c) => c.id !== id)
  writeIndex()
  if (chats.active === id) chats.active = chats.list[0]?.id ?? newId()
}

const count = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0)

/** A chat's thread as kept. Read back, an entry is kept only as an object
 * with a `kind`, and the token counts are numbers. */
export function loadThread<E>(project: string, chat: string): AgentSession<E> | null {
  const d = readJson(threadKey(project, chat)) as { entries?: unknown; usage?: Partial<Usage> } | null
  if (!d || !Array.isArray(d.entries)) return null
  const entries = d.entries.filter((e) => !!e && typeof e === "object" && typeof e.kind === "string") as E[]
  return { entries, usage: { input: count(d.usage?.input), output: count(d.usage?.output) } }
}

/** Keep a chat's thread (capped; oldest entries go first) and its place in
 * the list: its title, and, when `moved` (something new was said), its
 * time and a place at the top. An empty chat is no chat. */
export function saveThread<E extends { kind: string; text?: string }>(
  project: string,
  chat: string,
  s: AgentSession<E>,
  moved = false,
): void {
  if (!s.entries.length) {
    storage.remove(threadKey(project, chat))
    if (project === chats.project && chats.list.some((c) => c.id === chat)) {
      chats.list = chats.list.filter((c) => c.id !== chat)
      writeIndex()
    }
    return
  }
  const entries = [...s.entries]
  let json = JSON.stringify({ ...s, entries })
  while (json.length > CAP && entries.length) {
    entries.shift()
    json = JSON.stringify({ ...s, entries })
  }
  storage.set(threadKey(project, chat), json)
  if (project !== chats.project) return
  const was = chats.list.find((c) => c.id === chat)
  const title = titleOf(s.entries)
  if (was && !moved && was.title === title) return
  const meta = { id: chat, title, at: !was || moved ? Date.now() : was.at }
  chats.list =
    moved || !was
      ? [meta, ...chats.list.filter((c) => c.id !== chat)]
      : chats.list.map((c) => (c.id === chat ? meta : c))
  writeIndex()
}

/** How long ago, the way a list of chats says it: now, 5m, 2h, 3d, 2w,
 * then the day. */
export function agoOf(at: number, now = Date.now()): string {
  const m = Math.floor((now - at) / 60_000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  if (d < 35) return `${Math.floor(d / 7)}w`
  return new Date(at).toLocaleDateString("en", { month: "short", day: "numeric" })
}
