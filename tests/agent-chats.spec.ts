// @rstest-environment jsdom
// A project's chats with the agent: the list the Studio's sidebar shows, the
// chat open in the panel, and each chat's thread.
import { beforeEach, describe, expect, it } from "rstack/test"
import {
  agoOf,
  chats,
  loadThread,
  newChat,
  openChat,
  openProject,
  removeChat,
  saveThread,
  titleOf,
} from "@/features/agent/chats"

type E = { kind: string; text?: string }
const said = (...texts: string[]): { entries: E[]; usage: { input: number; output: number } } => ({
  entries: texts.map((text) => ({ kind: "user", text })),
  usage: { input: 0, output: 0 },
})

beforeEach(() => {
  localStorage.clear()
  chats.project = ""
})

describe("a project's chats", () => {
  it("lists a chat once something is said in it, newest first, and keeps each thread apart", () => {
    openProject("p1")
    const first = chats.active
    expect(chats.list).toEqual([])
    saveThread("p1", first, said("A sign-in screen\nwith a link"), true)
    newChat()
    const second = chats.active
    expect(second).not.toBe(first)
    expect(chats.list.map((c) => c.id)).toEqual([first])
    saveThread("p1", second, said("A table"), true)
    expect(chats.list.map((c) => c.title)).toEqual(["A table", "A sign-in screen"])
    openChat(first)
    expect(loadThread<E>("p1", chats.active)?.entries[0].text).toBe("A sign-in screen\nwith a link")
    // Something new said in the older chat brings it to the top.
    saveThread("p1", first, said("A sign-in screen", "Make it dark"), true)
    expect(chats.list[0].id).toBe(first)
  })

  it("keeps a chat in its place when nothing new is said, and drops one emptied", () => {
    openProject("p1")
    const a = chats.active
    saveThread("p1", a, said("One"), true)
    newChat()
    const b = chats.active
    saveThread("p1", b, said("Two"), true)
    const at = chats.list.find((c) => c.id === a)?.at
    saveThread("p1", a, said("One"))
    expect(chats.list.map((c) => c.id)).toEqual([b, a])
    expect(chats.list[1].at).toBe(at)
    saveThread("p1", b, said())
    expect(chats.list.map((c) => c.id)).toEqual([a])
  })

  it("opens a project at its newest chat, and a removed chat hands over to the next", () => {
    openProject("p1")
    const a = chats.active
    saveThread("p1", a, said("One"), true)
    newChat()
    const b = chats.active
    saveThread("p1", b, said("Two"), true)
    chats.project = ""
    openProject("p1")
    expect(chats.active).toBe(b)
    removeChat(b)
    expect(chats.active).toBe(a)
    expect(loadThread("p1", b)).toBeNull()
    removeChat(a)
    expect(chats.list).toEqual([])
    expect(chats.active).not.toBe(a)
  })

  it("makes the thread a project kept before chats existed its first chat", () => {
    localStorage.setItem(
      "dither-agent-session-p1",
      JSON.stringify({ entries: [{ kind: "user", text: "An old ask" }], usage: { input: 3, output: 4 } }),
    )
    openProject("p1")
    expect(chats.list.map((c) => c.title)).toEqual(["An old ask"])
    expect(loadThread("p1", chats.active)?.usage).toEqual({ input: 3, output: 4 })
    expect(localStorage.getItem("dither-agent-session-p1")).toBeNull()
  })

  it("keeps a thread under a cap, dropping the oldest entries first", () => {
    openProject("p1")
    const big = Array.from({ length: 400 }, (_, i) => ({ kind: "assistant", text: `${i}:${"x".repeat(1000)}` }))
    saveThread("p1", chats.active, { entries: big, usage: { input: 1, output: 2 } }, true)
    const s = loadThread<E>("p1", chats.active)
    expect(s?.usage).toEqual({ input: 1, output: 2 })
    expect(s?.entries.length).toBeLessThan(400)
    expect(s?.entries.at(-1)?.text?.startsWith("399:")).toBe(true)
  })

  it("names a chat by its first message", () => {
    expect(titleOf([])).toBe("New chat")
    expect(
      titleOf([
        { kind: "system", text: "connected" },
        { kind: "user", text: "A\nB" },
      ]),
    ).toBe("A")
  })

  it("says how long ago the way a chat list does", () => {
    const now = Date.UTC(2026, 10, 3, 12)
    const ago = (ms: number) => agoOf(now - ms, now)
    expect(ago(20_000)).toBe("now")
    expect(ago(9 * 60_000)).toBe("9m")
    expect(ago(2 * 3_600_000)).toBe("2h")
    expect(ago(3 * 86_400_000)).toBe("3d")
    expect(ago(15 * 86_400_000)).toBe("2w")
    expect(ago(60 * 86_400_000)).toBe("Sep 4")
  })
})
