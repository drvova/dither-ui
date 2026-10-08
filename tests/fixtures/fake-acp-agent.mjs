// A scripted ACP agent over stdio, the stand-in for Claude Code / Codex /
// pi in `tests/bridge.spec.ts`. One prompt: streams prose, publishes a plan,
// announces a tool call, asks one permission, then calls the Studio's
// `add_screen` through the MCP server the bridge injected. `session/cancel`
// ends the turn with stopReason "cancelled".
import { spawn } from "node:child_process"
import { createInterface } from "node:readline"

const out = (m) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...m })}\n`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let seq = 0
const pending = new Map()
const request = (method, params) =>
  new Promise((resolve, reject) => {
    const id = `a${++seq}`
    pending.set(id, { resolve, reject })
    out({ id, method, params })
  })
const notify = (method, params) => out({ method, params })
const settle = (map, m) => {
  const p = map.get(m.id)
  if (!p) return
  map.delete(m.id)
  if (m.error) p.reject(new Error(m.error.message))
  else p.resolve(m.result)
}

let mcp = null
let cancelled = false

/** Spawn one MCP stdio server and speak just enough MCP to list and call tools. */
function startMcp(server) {
  const env = { ...process.env, ...Object.fromEntries((server.env ?? []).map((e) => [e.name, e.value])) }
  const child = spawn(server.command, server.args ?? [], { stdio: ["pipe", "pipe", "inherit"], env })
  let mseq = 0
  const mpending = new Map()
  createInterface({ input: child.stdout }).on("line", (line) => {
    try {
      settle(mpending, JSON.parse(line))
    } catch {
      /* not json */
    }
  })
  const req = (method, params) =>
    new Promise((resolve, reject) => {
      const id = ++mseq
      mpending.set(id, { resolve, reject })
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`)
    })
  return {
    async init() {
      await req("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "fake-acp", version: "0" } })
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`)
      const { tools } = await req("tools/list", {})
      return tools.map((t) => t.name)
    },
    call: (name, args) => req("tools/call", { name, arguments: args }),
    kill: () => child.kill(),
  }
}

const SCREEN = {
  name: "Sign in",
  rows: [
    { cells: [{ is: "DitherInput", props: { placeholder: "Email" }, grow: true }] },
    { cells: [{ is: "DitherInput", props: { placeholder: "Password" }, grow: true }] },
    { cells: [{ is: "DitherBadge", slotText: "Continue", props: { color: "blue" } }], justify: "end" },
  ],
  frame: { w: 360, h: 300 },
}

async function prompt(id, params) {
  const sessionId = params.sessionId
  const goal = params.prompt.map((p) => p.text ?? "").join(" ")
  const update = (u) => notify("session/update", { sessionId, update: u })
  const plan = (a, b) => update({ sessionUpdate: "plan", entries: [{ content: "Check the registry", status: a, priority: "medium" }, { content: "Place the screen", status: b, priority: "high" }] })
  const say = async (s) => {
    for (const word of s.split(" ")) {
      if (cancelled) return
      update({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: `${word} ` } })
      await sleep(20)
    }
  }
  const end = (extra = {}) => out({ id, result: { stopReason: cancelled ? "cancelled" : "end_turn", ...extra } })
  await say(`Reading the goal: "${goal}".`)
  plan("in_progress", "pending")
  update({ sessionUpdate: "tool_call", toolCallId: "t1", title: "Read dither-kit/registry.json", kind: "read", status: "pending" })
  await sleep(60)
  update({ sessionUpdate: "tool_call_update", toolCallId: "t1", status: "completed" })
  plan("completed", "in_progress")
  if (cancelled) return end()
  const perm = await request("session/request_permission", {
    sessionId,
    toolCall: { toolCallId: "t2", title: "add_screen: Sign in", kind: "edit", status: "pending" },
    options: [
      { optionId: "allow-once", name: "Allow once", kind: "allow_once" },
      { optionId: "allow-always", name: "Allow always", kind: "allow_always" },
      { optionId: "reject", name: "Reject", kind: "reject_once" },
    ],
  })
  if (perm?.outcome?.outcome !== "selected" || perm.outcome.optionId === "reject") {
    await say("Understood, leaving the canvas as it is.")
    return end()
  }
  const r = mcp ? await mcp.call("add_screen", SCREEN) : { isError: true }
  plan("completed", r.isError ? "pending" : "completed")
  await say(r.isError ? "The Studio rejected the screen." : "Placed a sign-in screen with email, password and a Continue badge.")
  end({ usage: { inputTokens: 2400, outputTokens: 120 } })
}

createInterface({ input: process.stdin }).on("line", async (line) => {
  let m
  try {
    m = JSON.parse(line)
  } catch {
    return
  }
  if (m.id !== undefined && m.method === undefined) return settle(pending, m)
  switch (m.method) {
    case "initialize":
      return out({ id: m.id, result: { protocolVersion: 1, agentCapabilities: { loadSession: false }, agentInfo: { name: "fake-acp", version: "0" }, authMethods: [] } })
    case "session/new": {
      const studio = (m.params?.mcpServers ?? []).find((s) => s.name === "dither-studio")
      if (studio) {
        mcp = startMcp(studio)
        const names = await mcp.init()
        notify("session/update", { sessionId: "pending", update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: `[mcp dither-studio: ${names.length} tools]` } } })
      }
      return out({ id: m.id, result: { sessionId: `sess_${Date.now().toString(36)}` } })
    }
    case "session/prompt":
      cancelled = false
      return prompt(m.id, m.params)
    case "session/cancel":
      cancelled = true
      return
    default:
      if (m.id !== undefined) out({ id: m.id, error: { code: -32601, message: `unsupported: ${m.method}` } })
  }
})
process.stdin.on("close", () => {
  mcp?.kill()
  process.exit(0)
})
