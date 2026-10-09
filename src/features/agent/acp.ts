// The composer as an Agent Client Protocol client, through the local bridge.
//
// ACP (JSON-RPC 2.0, agentclientprotocol.com) is how editors drive coding
// agents, and every agent that speaks it runs as the user's own signed-in
// process — the arrangement every vendor's terms allow. A page cannot spawn
// a process, so `bridge/dither-bridge.mjs` does: it knows the harnesses
// (presets + what is on the PATH), spawns the one the composer picks over
// stdio, relays its JSON-RPC verbatim over a loopback websocket, injects an
// MCP server of the Studio tools into every session, and forwards that
// server's tool calls back here as `studio/call`, answered through the
// protocol. The browser never holds a credential.
//
// Bridge-only methods: `bridge/hello` (the bridge's state: cwd, harnesses,
// the running agent or null — sent on connect and after every start/stop),
// `bridge/start` / `bridge/stop` (ours), `bridge/tools` (ours, on open),
// `bridge/exit` (the agent died), `studio/call` (a Studio tool call).
import type { CommandResult } from "./protocol"
import { runCommand } from "./protocol"
import { type AgentCommand, type AgentEvent, callStudioTool, finishStudioTool, type Mode, STUDIO_TOOLS, type Usage } from "./tools"

type JsonRpcId = string | number
type Message = { jsonrpc: "2.0"; id?: JsonRpcId; method?: string; params?: unknown; result?: unknown; error?: { code: number; message: string } }

export type Harness = { id: string; name: string; command: string; installed: boolean; note?: string }
export type BridgeAgent = { id: string; name: string; command: string; pid: number }
export type BridgeHello = { cwd: string; harnesses: Harness[]; agent: BridgeAgent | null }

export type AcpPermissionOption = { optionId: string; name: string; kind: string }
export type AcpPermissionRequest = { title: string; options: AcpPermissionOption[]; raw: unknown }

export type AcpClientOptions = {
  url: string
  /** Answer a `session/request_permission`: the chosen optionId, or null to cancel. */
  permission: (req: AcpPermissionRequest) => Promise<string | null>
  run?: (command: unknown) => CommandResult
  onEvent?: (e: AgentEvent) => void
  /** The bridge's state changed: a harness started, stopped or died. */
  onHello?: (h: BridgeHello) => void
  onClose?: () => void
}

export type AcpClient = {
  /** The running agent's display name (its own `agentInfo.name`, else the harness's). */
  readonly agent: string
  readonly hello: BridgeHello | null
  readonly sessionId: string | null
  readonly busy: boolean
  readonly modes: Mode[]
  readonly mode: string
  readonly commands: AgentCommand[]
  /** Start a harness by preset id, or any command line; resolves once a session exists. */
  start(harness: string | { command: string }): Promise<void>
  stop(): void
  /** A fresh agent session (new context). */
  newSession(): Promise<string>
  setMode(id: string): Promise<void>
  /** One task: resolves when the agent's turn ends, with its stop reason and the prose it streamed. */
  prompt(text: string, signal?: AbortSignal): Promise<{ stopReason: string; text: string }>
  close(): void
}

/** Map one ACP `session/update` into composer events. Pure. */
export function mapUpdate(update: Record<string, unknown>): AgentEvent[] {
  const kind = update.sessionUpdate
  if (kind === "agent_message_chunk") {
    const c = update.content as { type?: string; text?: string } | undefined
    return c?.type === "text" && c.text ? [{ type: "delta", text: c.text }] : []
  }
  if (kind === "tool_call" || kind === "tool_call_update") {
    const id = String(update.toolCallId ?? "")
    // Updates usually carry only a status; an empty title keeps the earlier one.
    const title = typeof update.title === "string" ? update.title : kind === "tool_call" ? id : ""
    // Studio tools reach the page through the bridge's studio/call path and
    // are rendered there with their result; skip the agent's mirror of them.
    if (STUDIO_TOOLS.some((t) => title.includes(t.def.name))) return []
    return [{ type: "activity", id, title, status: String(update.status ?? (kind === "tool_call" ? "pending" : "in_progress")) }]
  }
  if (kind === "plan") {
    const entries = Array.isArray(update.entries) ? (update.entries as { content?: unknown; status?: unknown }[]) : []
    return [{ type: "plan", entries: entries.map((e) => ({ content: String(e.content ?? ""), status: String(e.status ?? "pending") })) }]
  }
  if (kind === "current_mode_update") return [{ type: "mode", current: String(update.currentModeId ?? ""), modes: [] }]
  if (kind === "available_commands_update") {
    const list = Array.isArray(update.availableCommands) ? (update.availableCommands as { name?: unknown; description?: unknown; input?: { hint?: unknown } | null }[]) : []
    return [{ type: "commands", commands: list.filter((c) => typeof c.name === "string").map((c) => ({ name: String(c.name), description: String(c.description ?? ""), input: typeof c.input?.hint === "string" ? c.input.hint : undefined })) }]
  }
  return []
}

/** The modes a `session/new` answer offers, when the agent has any. */
export function modesOf(v: unknown): { current: string; modes: Mode[] } | null {
  const m = (v as { modes?: { currentModeId?: unknown; availableModes?: { id?: unknown; name?: unknown; description?: unknown }[] } } | null)?.modes
  if (!m || !Array.isArray(m.availableModes)) return null
  return {
    current: String(m.currentModeId ?? ""),
    modes: m.availableModes.filter((x) => typeof x.id === "string").map((x) => ({ id: String(x.id), name: String(x.name ?? x.id), description: typeof x.description === "string" ? x.description : undefined })),
  }
}

/** Extract usage from an ACP prompt response or update, when an agent reports it. */
export function usageOf(v: unknown): Usage | undefined {
  if (typeof v !== "object" || v === null) return undefined
  const u = (v as { usage?: { inputTokens?: number; outputTokens?: number; input_tokens?: number; output_tokens?: number } }).usage
  if (!u) return undefined
  return { input: u.inputTokens ?? u.input_tokens ?? 0, output: u.outputTokens ?? u.output_tokens ?? 0 }
}

/** Open the bridge. Resolves once it has said hello; a harness already
 * running there is initialized before that. Rejects when no bridge answers. */
export function connectAcp(o: AcpClientOptions): Promise<AcpClient> {
  const run = o.run ?? runCommand
  return new Promise<AcpClient>((resolve, reject) => {
    let ws: WebSocket
    try {
      ws = new WebSocket(o.url)
    } catch (e) {
      reject(new Error(`bridge url: ${e instanceof Error ? e.message : String(e)}`))
      return
    }
    let seq = 0
    const pending = new Map<JsonRpcId, { resolve: (v: unknown) => void; reject: (e: Error) => void }>()
    let hello: BridgeHello | null = null
    let agentName = ""
    let sessionId: string | null = null
    let busy = false
    let modes: Mode[] = []
    let mode = ""
    let commands: AgentCommand[] = []
    let opened = false
    let settled = false
    let waitHello: ((h: BridgeHello) => void) | null = null
    // Prose arrives in segments between the agent's tool calls; each segment
    // becomes one assistant entry, and the whole turn's text is returned.
    let segment = ""
    let turnText = ""
    const flush = () => {
      if (!segment) return
      o.onEvent?.({ type: "assistant", text: segment })
      turnText += (turnText ? "\n" : "") + segment
      segment = ""
    }

    const send = (m: Message) => ws.send(JSON.stringify(m))
    const request = (method: string, params?: unknown) =>
      new Promise<unknown>((res, rej) => {
        const id = `c${++seq}`
        pending.set(id, { resolve: res, reject: rej })
        send({ jsonrpc: "2.0", id, method, params })
      })
    const notify = (method: string, params?: unknown) => send({ jsonrpc: "2.0", method, params })
    const fail = (message: string) => {
      for (const p of pending.values()) p.reject(new Error(message))
      pending.clear()
    }
    const resetAgent = () => {
      sessionId = null
      modes = []
      mode = ""
      commands = []
    }

    /** initialize + session/new against the running harness. */
    const boot = async () => {
      const init = (await request("initialize", {
        protocolVersion: 1,
        clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
        clientInfo: { name: "dither-ui studio", version: "1" },
      })) as { agentInfo?: { name?: string } }
      if (init?.agentInfo?.name) agentName = init.agentInfo.name
      await client.newSession()
    }
    const nextHello = () =>
      new Promise<BridgeHello>((res, rej) => {
        waitHello = res
        setTimeout(() => {
          if (waitHello === res) {
            waitHello = null
            rej(new Error("the bridge did not answer"))
          }
        }, 20_000)
      })

    ws.onopen = () => {
      opened = true
      send({ jsonrpc: "2.0", method: "bridge/tools", params: { tools: STUDIO_TOOLS.map((t) => ({ name: t.def.name, description: t.def.description, inputSchema: t.def.parameters })) } })
    }
    ws.onerror = () => {
      if (!opened) reject(new Error(`no bridge at ${o.url} — run: node bridge/dither-bridge.mjs`))
    }
    ws.onclose = () => {
      fail("bridge closed")
      if (!settled) reject(new Error("bridge closed"))
      o.onClose?.()
    }
    ws.onmessage = async (ev) => {
      let m: Message
      try {
        m = JSON.parse(String(ev.data)) as Message
      } catch {
        return
      }
      if (m.id !== undefined && m.method === undefined) {
        const p = pending.get(m.id)
        if (!p) return
        pending.delete(m.id)
        if (m.error) p.reject(new Error(m.error.message))
        else p.resolve(m.result)
        return
      }
      if (!m.method) return
      const params = (m.params ?? {}) as Record<string, unknown>
      switch (m.method) {
        case "bridge/hello": {
          hello = { cwd: String(params.cwd ?? ""), harnesses: Array.isArray(params.harnesses) ? (params.harnesses as Harness[]) : [], agent: (params.agent as BridgeAgent | null) ?? null }
          agentName = hello.agent?.name ?? ""
          resetAgent()
          o.onHello?.(hello)
          if (waitHello) {
            const w = waitHello
            waitHello = null
            w(hello)
          } else if (!settled) {
            // First hello: a harness the bridge already runs is booted now.
            settled = true
            if (hello.agent) boot().then(() => resolve(client), reject)
            else resolve(client)
          }
          return
        }
        case "bridge/exit":
          resetAgent()
          agentName = ""
          if (hello) {
            hello = { ...hello, agent: null }
            o.onHello?.(hello)
          }
          fail(`harness exited (${params.code ?? "signal"})`)
          return
        case "session/update": {
          const update = (params.update ?? {}) as Record<string, unknown>
          for (let e of mapUpdate(update)) {
            if (e.type === "delta") segment += e.text
            else if (e.type === "activity") flush()
            else if (e.type === "mode") {
              mode = e.current
              e = { ...e, modes }
            } else if (e.type === "commands") commands = e.commands
            o.onEvent?.(e)
          }
          return
        }
        case "session/request_permission": {
          const tc = (params.toolCall ?? {}) as { title?: string }
          const options = Array.isArray(params.options) ? (params.options as AcpPermissionOption[]) : []
          const chosen = await o.permission({ title: String(tc.title ?? "permission"), options, raw: params })
          send({ jsonrpc: "2.0", id: m.id, result: chosen ? { outcome: { outcome: "selected", optionId: chosen } } : { outcome: { outcome: "cancelled" } } })
          return
        }
        case "studio/call": {
          // The bridge's MCP server forwarding the harness's tool call.
          const name = String(params.name ?? "")
          const args = typeof params.arguments === "object" && params.arguments !== null ? (params.arguments as Record<string, unknown>) : {}
          const result = await finishStudioTool(name, callStudioTool(name, args, run))
          flush()
          o.onEvent?.({ type: "tool", name, args, result })
          send({ jsonrpc: "2.0", id: m.id, result })
          return
        }
        default:
          // Capabilities we declared off (fs/terminal) and anything unknown.
          if (m.id !== undefined) send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `unsupported: ${m.method}` } })
      }
    }

    const client: AcpClient = {
      get agent() {
        return agentName || hello?.agent?.name || ""
      },
      get hello() {
        return hello
      },
      get sessionId() {
        return sessionId
      },
      get busy() {
        return busy
      },
      get modes() {
        return modes
      },
      get mode() {
        return mode
      },
      get commands() {
        return commands
      },
      async start(harness) {
        const wait = nextHello()
        notify("bridge/start", typeof harness === "string" ? { harness } : { command: harness.command })
        const h = await wait
        if (!h.agent) throw new Error("the bridge could not start that harness")
        await boot()
      },
      stop() {
        notify("bridge/stop")
      },
      async newSession() {
        const s = await request("session/new", { cwd: hello?.cwd || "/", mcpServers: [] })
        sessionId = (s as { sessionId?: string })?.sessionId ?? null
        const found = modesOf(s)
        modes = found?.modes ?? []
        mode = found?.current ?? ""
        if (found) o.onEvent?.({ type: "mode", current: mode, modes })
        return sessionId ?? ""
      },
      async setMode(id) {
        await request("session/set_mode", { sessionId, modeId: id })
        mode = id
        o.onEvent?.({ type: "mode", current: id, modes })
      },
      async prompt(goal, signal) {
        if (!sessionId) await client.newSession()
        busy = true
        segment = ""
        turnText = ""
        const started = Date.now()
        const onAbort = () => notify("session/cancel", { sessionId })
        signal?.addEventListener("abort", onAbort, { once: true })
        try {
          const res = (await request("session/prompt", { sessionId, prompt: [{ type: "text", text: goal }] })) as { stopReason?: string }
          const stop = res?.stopReason ?? "end_turn"
          flush()
          o.onEvent?.({ type: "turn", elapsedMs: Date.now() - started, usage: usageOf(res) })
          if (stop === "cancelled") o.onEvent?.({ type: "error", message: "stopped" })
          else o.onEvent?.({ type: "done" })
          return { stopReason: stop, text: turnText }
        } catch (e) {
          flush()
          o.onEvent?.({ type: "error", message: signal?.aborted ? "stopped" : e instanceof Error ? e.message : String(e) })
          return { stopReason: "error", text: turnText }
        } finally {
          busy = false
          signal?.removeEventListener("abort", onAbort)
        }
      },
      close() {
        settled = true
        ws.close()
      },
    }
  })
}
