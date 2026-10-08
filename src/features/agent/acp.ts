// The composer as an ACP client. The Agent Client Protocol (JSON-RPC 2.0,
// agentclientprotocol.com) is how editors drive coding agents — Claude
// Code, Codex, Gemini CLI and others ship ACP adapters, and each one runs
// as the user's own signed-in process, which is the arrangement every
// vendor's terms allow. A web page cannot spawn a process, so the local
// bridge (`bridge/dither-bridge.mjs`) does: it spawns the agent over stdio,
// relays its JSON-RPC verbatim over a localhost websocket, injects an MCP
// server of the Studio tools into every new session, and forwards that
// server's tool calls back here as `studio/call` requests, which the page
// answers through the protocol. The browser never holds a credential.
//
// Everything the agent says arrives as `session/update` notifications; the
// panel renders them through the same AgentEvent stream the key-based loop
// emits, so both backends look identical in the transcript.
import type { CommandResult } from "./protocol"
import { runCommand } from "./protocol"
import { type AgentEvent, callStudioTool, finishStudioTool, STUDIO_TOOLS, type Usage } from "./llm"

type JsonRpcId = string | number
type Message = { jsonrpc: "2.0"; id?: JsonRpcId; method?: string; params?: unknown; result?: unknown; error?: { code: number; message: string } }

export type AcpPermissionOption = { optionId: string; name: string; kind: string }
export type AcpPermissionRequest = { title: string; options: AcpPermissionOption[]; raw: unknown }

export type AcpClientOptions = {
  url: string
  /** Answer a `session/request_permission`: the chosen optionId, or null to cancel. */
  permission: (req: AcpPermissionRequest) => Promise<string | null>
  run?: (command: unknown) => CommandResult
  onEvent?: (e: AgentEvent) => void
  onClose?: () => void
}

export type AcpClient = {
  readonly agent: string
  readonly sessionId: string | null
  readonly busy: boolean
  /** One task: resolves when the agent's turn ends, with its stop reason and the prose it streamed. */
  prompt(text: string, signal?: AbortSignal): Promise<{ stopReason: string; text: string }>
  /** Start a fresh agent session (new context). */
  newSession(): Promise<string>
  close(): void
}

/** Map one ACP `session/update` into transcript events. Pure. */
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
  return []
}

/** Extract usage from an ACP prompt response or update, when an agent reports it. */
export function usageOf(v: unknown): Usage | undefined {
  if (typeof v !== "object" || v === null) return undefined
  const u = (v as { usage?: { inputTokens?: number; outputTokens?: number; input_tokens?: number; output_tokens?: number } }).usage
  if (!u) return undefined
  return { input: u.inputTokens ?? u.input_tokens ?? 0, output: u.outputTokens ?? u.output_tokens ?? 0 }
}

/** Open the bridge and initialize the agent. Rejects when the bridge is not running. */
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
    let agent = "agent"
    let sessionId: string | null = null
    let busy = false
    // Prose arrives in segments between the agent's tool calls; each segment
    // becomes one assistant entry, the way each model message does in the
    // key loop, and the whole turn's text is returned from prompt().
    let segment = ""
    let turnText = ""
    let opened = false
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

    ws.onopen = async () => {
      opened = true
      send({ jsonrpc: "2.0", method: "bridge/tools", params: { tools: STUDIO_TOOLS.map((t) => ({ name: t.def.name, description: t.def.description, inputSchema: t.def.parameters })) } })
      try {
        const init = (await request("initialize", {
          protocolVersion: 1,
          clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
          clientInfo: { name: "dither-ui studio", version: "1" },
        })) as { agentInfo?: { name?: string }; agentCapabilities?: unknown }
        if (init?.agentInfo?.name) agent = init.agentInfo.name
        const s = (await request("session/new", { cwd: "/", mcpServers: [] })) as { sessionId?: string }
        sessionId = s?.sessionId ?? null
        resolve(client)
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)))
        ws.close()
      }
    }
    ws.onerror = () => {
      if (!opened) reject(new Error(`no bridge at ${o.url} — run: node bridge/dither-bridge.mjs --agent <command>`))
    }
    const fail = (message: string) => {
      for (const p of pending.values()) p.reject(new Error(message))
      pending.clear()
    }
    ws.onclose = () => {
      fail("bridge closed")
      o.onClose?.()
    }
    ws.onmessage = async (ev) => {
      let m: Message
      try {
        m = JSON.parse(String(ev.data)) as Message
      } catch {
        return
      }
      // Replies to our requests.
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
        case "bridge/hello":
          if (typeof params.agent === "string") agent = params.agent
          return
        case "bridge/exit":
          // The agent process died; the bridge restarts it on the next message,
          // but this session is gone with it.
          sessionId = null
          fail(`agent exited (${params.code ?? "signal"})`)
          return
        case "session/update": {
          const update = (params.update ?? {}) as Record<string, unknown>
          for (const e of mapUpdate(update)) {
            if (e.type === "delta") segment += e.text
            else if (e.type === "activity") flush()
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
          const result = await finishStudioTool(name, callStudioTool(name, args, run), "files")
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
        return agent
      },
      get sessionId() {
        return sessionId
      },
      get busy() {
        return busy
      },
      async newSession() {
        const s = (await request("session/new", { cwd: "/", mcpServers: [] })) as { sessionId?: string }
        sessionId = s?.sessionId ?? null
        return sessionId ?? ""
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
          o.onEvent?.({ type: "turn", step: 1, elapsedMs: Date.now() - started, usage: usageOf(res), context: 0 })
          if (stop === "cancelled") o.onEvent?.({ type: "error", message: "stopped" })
          else o.onEvent?.({ type: "done", steps: 1 })
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
        ws.close()
      },
    }
  })
}
