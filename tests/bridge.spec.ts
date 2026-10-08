// The ACP control plane end to end, minus the browser: this test plays the
// Studio tab against the real bridge, which spawns the scripted agent in
// tests/fixtures, which spawns the bridge's own MCP server, whose tool call
// comes back here as `studio/call`.
import { spawn, type ChildProcess } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const PORT = 18790 + (process.pid % 500)
const URL_ = `ws://127.0.0.1:${PORT}`
const CWD = mkdtempSync(join(tmpdir(), "dither-bridge-"))
let bridge: ChildProcess
let logs = ""

beforeAll(async () => {
  // The agent runs from --cwd, so a script path must be absolute.
  bridge = spawn(process.execPath, ["bridge/dither-bridge.mjs", "--agent", `${process.execPath} ${resolve("tests/fixtures/fake-acp-agent.mjs")}`, "--port", String(PORT), "--cwd", CWD], { stdio: ["ignore", "pipe", "pipe"] })
  await new Promise<void>((resolve, reject) => {
    bridge.stdout!.on("data", (d: Buffer) => {
      logs += d.toString()
      if (logs.includes("dither-bridge on")) resolve()
    })
    bridge.stderr!.on("data", (d: Buffer) => (logs += d.toString()))
    bridge.on("exit", (code) => reject(new Error(`bridge exited ${code}: ${logs}`)))
  })
}, 10_000)

afterAll(() => {
  bridge?.kill()
  rmSync(CWD, { recursive: true, force: true })
})

type Rpc = { jsonrpc: "2.0"; id?: string | number; method?: string; params?: Record<string, unknown>; result?: unknown; error?: { message: string } }

function client() {
  const ws = new WebSocket(URL_)
  let seq = 0
  const pending = new Map<string, { res: (v: unknown) => void; rej: (e: Error) => void }>()
  const notifications: Rpc[] = []
  const calls: { name: string; args: Record<string, unknown> }[] = []
  const updates: string[] = []
  let permission: Rpc | null = null
  const send = (m: Omit<Rpc, "jsonrpc">) => ws.send(JSON.stringify({ jsonrpc: "2.0", ...m }))
  const request = (method: string, params?: Record<string, unknown>) =>
    new Promise<unknown>((res, rej) => {
      const id = `c${++seq}`
      pending.set(id, { res, rej })
      send({ id, method, params })
    })
  ws.onmessage = (ev) => {
    const m = JSON.parse(String(ev.data)) as Rpc
    if (m.id !== undefined && m.method === undefined) {
      const p = pending.get(String(m.id))
      pending.delete(String(m.id))
      if (m.error) p?.rej(new Error(m.error.message))
      else p?.res(m.result)
      return
    }
    if (m.method === "session/update") {
      updates.push(String((m.params?.update as { sessionUpdate: string }).sessionUpdate))
      return
    }
    if (m.method === "bridge/exit") {
      // A dead agent fails fast instead of timing the test out.
      for (const p of pending.values()) p.rej(new Error(`agent exited: ${logs}`))
      pending.clear()
    }
    if (m.method === "session/request_permission") {
      permission = m
      send({ id: m.id, result: { outcome: { outcome: "selected", optionId: "allow-once" } } })
      return
    }
    if (m.method === "studio/call") {
      const { name, arguments: args } = m.params as { name: string; arguments: Record<string, unknown> }
      calls.push({ name, args })
      const data =
        name === "export_video"
          ? { files: [{ path: "video/sign-in/index.html", content: "<!doctype html><title>sign in</title>" }, { path: "../escape.html", content: "no" }, { path: "/abs.html", content: "no" }], render: "npx hyperframes render video/sign-in" }
          : { id: "ab_1", name: args.name, kind: "screen" }
      send({ id: m.id, result: { ok: true, data } })
      return
    }
    notifications.push(m)
  }
  const open = new Promise<void>((res, rej) => {
    ws.onopen = () => res()
    ws.onerror = () => rej(new Error("no bridge"))
  })
  return { ws, open, request, send, notifications, calls, updates, permission: () => permission }
}

describe("dither-bridge", () => {
  it("relays ACP verbatim, injects the Studio MCP server, and routes its tool calls back to the tab", async () => {
    const c = client()
    await c.open
    c.send({ method: "bridge/tools", params: { tools: [{ name: "add_screen", description: "place a screen", inputSchema: { type: "object" } }] } })
    const init = (await c.request("initialize", { protocolVersion: 1, clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false }, clientInfo: { name: "test", version: "1" } })) as { agentInfo: { name: string } }
    expect(init.agentInfo.name).toBe("fake-acp")
    const s = (await c.request("session/new", { cwd: "/", mcpServers: [] })) as { sessionId: string }
    expect(s.sessionId).toMatch(/^sess_/)
    // The agent spawned the injected server and listed the tab's tools through it.
    expect(c.updates).toContain("agent_message_chunk")

    const r = (await c.request("session/prompt", { sessionId: s.sessionId, prompt: [{ type: "text", text: "a sign-in screen" }] })) as { stopReason: string; usage: { inputTokens: number } }
    expect(r.stopReason).toBe("end_turn")
    expect(r.usage.inputTokens).toBe(2400)
    expect(c.permission()?.params?.options).toHaveLength(3)
    expect(c.calls).toEqual([{ name: "add_screen", args: expect.objectContaining({ name: "Sign in" }) }])
    expect(new Set(c.updates)).toEqual(new Set(["agent_message_chunk", "plan", "tool_call", "tool_call_update"]))
    expect(c.notifications.map((n) => n.method)).toEqual(["bridge/hello"])

    const health = (await fetch(`http://127.0.0.1:${PORT}/`).then((x) => x.json())) as { connected: boolean; tools: number }
    expect(health).toMatchObject({ connected: true, tools: 1 })

    // A second tab is refused while one is connected.
    const second = client()
    await expect(second.open).rejects.toThrow()
    c.ws.close()
  }, 20_000)

  it("writes a tool result's files under --cwd and never outside it", async () => {
    await new Promise((r) => setTimeout(r, 200))
    const c = client()
    await c.open
    await c.request("initialize", { protocolVersion: 1, clientCapabilities: {}, clientInfo: { name: "test", version: "1" } })
    const s = (await c.request("session/new", { cwd: "/", mcpServers: [] })) as { sessionId: string }
    const r = (await c.request("session/prompt", { sessionId: s.sessionId, prompt: [{ type: "text", text: "export the frame as a video" }] })) as { stopReason: string }
    expect(r.stopReason).toBe("end_turn")
    expect(c.calls.map((x) => x.name)).toEqual(["export_video"])
    expect(readFileSync(join(CWD, "video/sign-in/index.html"), "utf8")).toContain("sign in")
    expect(existsSync(join(CWD, "escape.html"))).toBe(false)
    expect(existsSync(join(CWD, "..", "escape.html"))).toBe(false)
    expect(existsSync("/abs.html")).toBe(false)
    // The agent was told the path, not handed the payload.
    expect(c.updates.filter((u) => u === "agent_message_chunk").length).toBeGreaterThan(0)
    c.ws.close()
  }, 20_000)

  it("cancels a running prompt", async () => {
    await new Promise((r) => setTimeout(r, 200)) // the bridge frees the slot on close
    const c = client()
    await c.open
    await c.request("initialize", { protocolVersion: 1, clientCapabilities: {}, clientInfo: { name: "test", version: "1" } })
    const s = (await c.request("session/new", { cwd: "/", mcpServers: [] })) as { sessionId: string }
    const done = c.request("session/prompt", { sessionId: s.sessionId, prompt: [{ type: "text", text: "slow" }] })
    await new Promise((r) => setTimeout(r, 30))
    c.send({ method: "session/cancel", params: { sessionId: s.sessionId } })
    expect(await done).toEqual({ stopReason: "cancelled" })
    expect(c.calls).toEqual([])
    c.ws.close()
  }, 20_000)
})
