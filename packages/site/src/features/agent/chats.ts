// A project's chats with the agent: the list the Studio's sidebar shows
// (newest first, each with its title and when it last moved), the chat open
// in the agent panel, and each chat's thread (capped). The page and the
// panel share it and both open the active project through it. Imported by
// path (`features/agent/chats`), so the page never pulls the agent's
// protocol into its chunk.
import { createMutable } from "solid-js/store"
import { readJson, storage, writeJson } from "@/shared/lib/storage"
import type { Usage } from "./tools"
import { STORAGE_PREFIXES } from "@/shared/config/storage"

/** A chat as the sidebar lists it. `named`: the title is one the user gave
 * it, kept over the first message's; `pinned`: it stands in the Pinned
 * group above the dated ones. */
export type ChatMeta = { id: string; title: string; at: number; named?: boolean; pinned?: boolean }
export type AgentSession<E> = { entries: E[]; usage: Usage }

const CAP = 160_000

export const chats = createMutable({
  /** The project whose chats these are. */
  project: "",
  /** Chats with something said in them, newest first. */
  list: [] as ChatMeta[],
  /** The chat open in the panel; a new one is not listed until it moves. */
  active: "",
})

const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const threadKey = (project: string, chat: string) => `${STORAGE_PREFIXES.thread}${project}/${chat}`
/** A chat as an index hands it back, untrusted: the fields of a chat, each
 * of its kind, the flags only when they are true. */
function metaOf(c: unknown): ChatMeta | null {
  if (!c || typeof c !== "object") return null
  const o = c as Record<string, unknown>
  if (typeof o.id !== "string" || typeof o.title !== "string" || typeof o.at !== "number") return null
  return {
    id: o.id,
    title: o.title.slice(0, 200),
    at: o.at,
    ...(o.named === true ? { named: true } : {}),
    ...(o.pinned === true ? { pinned: true } : {}),
  }
}
/** A project's chats as kept, parsed. */
const readIndex = (project: string): ChatMeta[] => {
  const stored = readJson(STORAGE_PREFIXES.chats + project)
  return Array.isArray(stored) ? stored.flatMap((c) => metaOf(c) ?? []) : []
}
const writeIndex = () => writeJson(STORAGE_PREFIXES.chats + chats.project, chats.list)

/** The chat's title: its first message's first line, else a new chat. */
export function titleOf(entries: readonly { kind: string; text?: string }[]): string {
  const first = entries.find((e) => e.kind === "user")
  return first?.text?.split("\n")[0] || "New chat"
}

/** Open a project's chats (a no-op when they are open): its newest chat,
 * else a new one. A thread kept before chats existed becomes its first. */
export function openProject(project: string): void {
  if (chats.project === project) return
  chats.project = project
  chats.list = readIndex(project)
  const earlier = storage.get(STORAGE_PREFIXES.thread + project)
  if (earlier !== null) {
    const id = newId()
    storage.set(threadKey(project, id), earlier)
    storage.remove(STORAGE_PREFIXES.thread + project)
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

/** Forget a deleted project's chats: their index, every thread and every
 * unsent draft kept under its id. */
export function forgetProject(project: string): void {
  if (!project) return
  for (const key of storage.keys())
    for (const prefix of [STORAGE_PREFIXES.chats, STORAGE_PREFIXES.thread, STORAGE_PREFIXES.draft])
      if (key.startsWith(prefix) && key.slice(prefix.length).split("/")[0] === project) storage.remove(key)
}

/** A project's chats: the open project's as they stand, another's as kept
 * (what a search across projects reads). */
export const chatsOf = (project: string): ChatMeta[] => (project === chats.project ? chats.list : readIndex(project))

/** Give a chat a title of the user's own; an empty one gives it back the
 * first message's. */
export function renameChat(id: string, title: string): void {
  const clean = title.trim().replace(/\s+/g, " ").slice(0, 200)
  chats.list = chats.list.map((c) => {
    if (c.id !== id) return c
    if (clean) return { ...c, title: clean, named: true }
    const thread = loadThread<{ kind: string; text?: string }>(chats.project, id)
    const { named: _, ...rest } = c
    return { ...rest, title: titleOf(thread?.entries ?? []) }
  })
  writeIndex()
}

/** Pin a chat above the dated groups, or let it go back among them. */
export function pinChat(id: string, pinned: boolean): void {
  chats.list = chats.list.map((c) => {
    if (c.id !== id) return c
    const { pinned: _, ...rest } = c
    return pinned ? { ...rest, pinned: true } : rest
  })
  writeIndex()
}

export type ChatGroup = { label: string; chats: ChatMeta[] }

/** The sidebar's groups: Pinned, then by the day each chat last moved
 * (Today, Yesterday, This week, Earlier), each newest first, empty ones left out. */
export function chatGroups(list: readonly ChatMeta[], now = Date.now()): ChatGroup[] {
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  const today = day.getTime()
  const DAY = 86_400_000
  const groups: ChatGroup[] = [
    { label: "Pinned", chats: [] },
    { label: "Today", chats: [] },
    { label: "Yesterday", chats: [] },
    { label: "This week", chats: [] },
    { label: "Earlier", chats: [] },
  ]
  for (const c of [...list].sort((a, b) => b.at - a.at)) {
    const g = c.pinned ? 0 : c.at >= today ? 1 : c.at >= today - DAY ? 2 : c.at >= today - 6 * DAY ? 3 : 4
    groups[g].chats.push(c)
  }
  return groups.filter((g) => g.chats.length)
}

/** The chat before or after the open one, in the order the sidebar shows them. */
export function stepChat(by: -1 | 1, now = Date.now()): void {
  const order = chatGroups(chats.list, now).flatMap((g) => g.chats)
  if (!order.length) return
  const at = order.findIndex((c) => c.id === chats.active)
  const next = at < 0 ? (by > 0 ? 0 : order.length - 1) : Math.min(order.length - 1, Math.max(0, at + by))
  chats.active = order[next].id
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
  // Listed once something is said in it, not when the harness first speaks.
  if (project !== chats.project || !s.entries.some((e) => e.kind === "user")) return
  const was = chats.list.find((c) => c.id === chat)
  // A title the user gave is kept over the first message's.
  const title = was?.named ? was.title : titleOf(s.entries)
  if (was && !moved && was.title === title) return
  const meta: ChatMeta = { ...was, id: chat, title, at: !was || moved ? Date.now() : was.at }
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
