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
import {
  type AgentCommand,
  type AgentEvent,
  callStudioTool,
  finishStudioTool,
  type Mode,
  type ModelChoice,
  STUDIO_TOOLS,
  type Usage,
} from "./tools"

type JsonRpcId = string | number
type Message = {
  jsonrpc: "2.0"
  id?: JsonRpcId
  method?: string
  params?: unknown
  result?: unknown
  error?: { code: number; message: string }
}

export type Harness = { id: string; name: string; command: string; installed: boolean; note?: string }
export type BridgeAgent = { id: string; name: string; command: string; pid: number }
export type BridgeHello = { cwd: string; harnesses: Harness[]; agent: BridgeAgent | null }

export type AcpPermissionOption = { optionId: string; name: string; kind: string }

/** A harness's permission options, read once as they arrive: an option is
 * kept only with a string id; its name falls back to the id and its kind to
 * "", so the panel never meets a missing field mid-prompt. */
export function permissionOptions(raw: unknown): AcpPermissionOption[] {
  return (Array.isArray(raw) ? raw : []).flatMap((o) =>
    o && typeof o === "object" && typeof o.optionId === "string" && o.optionId
      ? [
          {
            optionId: o.optionId,
            name: typeof o.name === "string" && o.name ? o.name : o.optionId,
            kind: typeof o.kind === "string" ? o.kind : "",
          },
        ]
      : [],
  )
}
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

/** A picture for the harness: a PNG of a frame, base64 without its prefix. */
export type PromptImage = { mimeType: string; data: string }

/** A prompt's content blocks: the text, then each picture when the harness
 * declared it takes them (an image block to one that did not is an error). */
export function promptBlocks(text: string, images: readonly PromptImage[], accepts: boolean) {
  return [
    { type: "text" as const, text },
    ...(accepts ? images.map((i) => ({ type: "image" as const, mimeType: i.mimeType, data: i.data })) : []),
  ]
}

/** Whether an `initialize` answer says the agent takes images. */
export const takesImages = (init: unknown): boolean =>
  (init as { agentCapabilities?: { promptCapabilities?: { image?: unknown } } } | null)?.agentCapabilities
    ?.promptCapabilities?.image === true

export type AcpClient = {
  /** The running agent's display name (its own `agentInfo.title`, then its
   * `name`, else the harness's). */
  readonly agent: string
  readonly hello: BridgeHello | null
  readonly sessionId: string | null
  readonly busy: boolean
  readonly modes: Mode[]
  readonly mode: string
  /** The model the harness runs, when its session says. */
  readonly model: ModelChoice | null
  readonly commands: AgentCommand[]
  /** Whether the running harness takes pictures in a prompt (its
   * `promptCapabilities.image`). */
  readonly acceptsImages: boolean
  /** Start a harness by preset id, or any command line; resolves once a session exists. */
  start(harness: string | { command: string }): Promise<void>
  stop(): void
  /** A fresh agent session (new context). */
  newSession(): Promise<string>
  setMode(id: string): Promise<void>
  /** Switch to one of the models the harness offers (its own setting). */
  setModel(id: string): Promise<void>
  /** One task: resolves when the agent's turn ends, with its stop reason and
   * the prose it streamed. Pictures ride along only if the harness takes them. */
  prompt(
    text: string,
    signal?: AbortSignal,
    images?: readonly PromptImage[],
  ): Promise<{ stopReason: string; text: string }>
  close(): void
}

/** Map one ACP `session/update` into composer events. Pure. */
export function mapUpdate(update: Record<string, unknown>): AgentEvent[] {
  const kind = update.sessionUpdate
  if (kind === "agent_message_chunk" || kind === "agent_thought_chunk") {
    const c = update.content as { type?: string; text?: string } | undefined
    if (c?.type !== "text" || !c.text) return []
    return [{ type: kind === "agent_message_chunk" ? "delta" : "thought", text: c.text }]
  }
  if (kind === "tool_call" || kind === "tool_call_update") {
    const id = String(update.toolCallId ?? "")
    // Updates usually carry only a status; an empty title keeps the earlier one.
    const title = typeof update.title === "string" ? update.title : ""
    // Studio tools reach the page through the bridge's studio/call path and
    // are rendered there with their result; skip the agent's mirror of them.
    if (STUDIO_TOOLS.some((t) => title.includes(t.def.name))) return []
    const toolKind = typeof update.kind === "string" ? { kind: update.kind } : {}
    return [
      {
        type: "activity",
        id,
        title,
        status: String(update.status ?? (kind === "tool_call" ? "pending" : "in_progress")),
        ...toolKind,
      },
    ]
  }
  if (kind === "plan") {
    const entries = Array.isArray(update.entries) ? (update.entries as { content?: unknown; status?: unknown }[]) : []
    return [
      {
        type: "plan",
        entries: entries.map((e) => ({ content: String(e.content ?? ""), status: String(e.status ?? "pending") })),
      },
    ]
  }
  if (kind === "current_mode_update") return [{ type: "mode", current: String(update.currentModeId ?? ""), modes: [] }]
  if (kind === "config_option_update") {
    const model = modelOf(update)
    return model ? [{ type: "model", model }] : []
  }
  if (kind === "available_commands_update") {
    const list = Array.isArray(update.availableCommands)
      ? (update.availableCommands as { name?: unknown; description?: unknown; input?: { hint?: unknown } | null }[])
      : []
    return [
      {
        type: "commands",
        commands: list
          .filter((c) => typeof c.name === "string")
          .map((c) => ({
            name: String(c.name),
            description: String(c.description ?? ""),
            input: typeof c.input?.hint === "string" ? c.input.hint : undefined,
          })),
      },
    ]
  }
  return []
}

/** The modes a `session/new` answer offers, when the agent has any. */
export function modesOf(v: unknown): { current: string; modes: Mode[] } | null {
  const m = (
    v as {
      modes?: { currentModeId?: unknown; availableModes?: { id?: unknown; name?: unknown; description?: unknown }[] }
    } | null
  )?.modes
  if (!m || !Array.isArray(m.availableModes)) return null
  return {
    current: String(m.currentModeId ?? ""),
    modes: m.availableModes
      .filter((x) => typeof x.id === "string")
      .map((x) => ({
        id: String(x.id),
        name: String(x.name ?? x.id),
        description: typeof x.description === "string" ? x.description : undefined,
      })),
  }
}

type ConfigValue = { value?: unknown; name?: unknown; description?: unknown; options?: ConfigValue[] }

/** The model a session runs, from its config options (`configOptions` on a
 * `session/new` answer or a `config_option_update`): the select of category
 * "model", its values flattened out of any groups. Null when the agent
 * reports none. */
export function modelOf(v: unknown): ModelChoice | null {
  const list = (v as { configOptions?: unknown } | null)?.configOptions
  if (!Array.isArray(list)) return null
  const o = (
    list as { id?: unknown; category?: unknown; type?: unknown; currentValue?: unknown; options?: unknown }[]
  ).find((x) => !!x && x.type === "select" && (x.category === "model" || x.id === "model"))
  if (!o || typeof o.id !== "string" || !Array.isArray(o.options)) return null
  const flat = (o.options as ConfigValue[]).flatMap((x) => (Array.isArray(x.options) ? x.options : [x]))
  const options = flat
    .filter((x) => typeof x.value === "string")
    .map((x) => ({
      id: String(x.value),
      name: String(x.name ?? x.value),
      description: typeof x.description === "string" && x.description ? x.description : undefined,
    }))
  return { configId: o.id, current: String(o.currentValue ?? ""), options }
}

/** A model's name as a person reads it: a "default" entry says which model
 * it is (its description names it), any other its own name. */
export function modelName(m: ModelChoice): string {
  const o = m.options.find((x) => x.id === m.current)
  if (!o) return m.current
  return o.id === "default" && o.description ? o.description : o.name
}

/** Extract usage from an ACP prompt response or update, when an agent reports it. */
export function usageOf(v: unknown): Usage | undefined {
  if (typeof v !== "object" || v === null) return undefined
  const u = (
    v as { usage?: { inputTokens?: number; outputTokens?: number; input_tokens?: number; output_tokens?: number } }
  ).usage
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
    let model: ModelChoice | null = null
    let commands: AgentCommand[] = []
    let images = false
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
      model = null
      commands = []
      images = false
    }

    /** initialize + session/new against the running harness. */
    const boot = async () => {
      const init = (await request("initialize", {
        protocolVersion: 1,
        clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
        clientInfo: { name: "dither-ui studio", version: "1" },
      })) as { agentInfo?: { name?: string; title?: string } }
      // The title is for people (an adapter's name is often its package's).
      const said = init?.agentInfo?.title || init?.agentInfo?.name
      if (said) agentName = said
      images = takesImages(init)
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
      send({
        jsonrpc: "2.0",
        method: "bridge/tools",
        params: {
          tools: STUDIO_TOOLS.map((t) => ({
            name: t.def.name,
            description: t.def.description,
            inputSchema: t.def.parameters,
          })),
        },
      })
    }
    ws.onerror = () => {
      if (!opened) reject(new Error(`No bridge at ${o.url}. Run node bridge/dither-bridge.mjs.`))
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
          hello = {
            cwd: String(params.cwd ?? ""),
            harnesses: Array.isArray(params.harnesses) ? (params.harnesses as Harness[]) : [],
            agent: (params.agent as BridgeAgent | null) ?? null,
          }
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
            // A thought or a tool call ends the prose before it.
            else if (e.type === "activity" || e.type === "thought") flush()
            else if (e.type === "mode") {
              mode = e.current
              e = { ...e, modes }
            } else if (e.type === "model") model = e.model
            else if (e.type === "commands") commands = e.commands
            o.onEvent?.(e)
          }
          return
        }
        case "session/request_permission": {
          const tc = (params.toolCall ?? {}) as { title?: string }
          const options = permissionOptions(params.options)
          const chosen = await o.permission({ title: String(tc.title ?? "permission"), options, raw: params })
          send({
            jsonrpc: "2.0",
            id: m.id,
            result: chosen
              ? { outcome: { outcome: "selected", optionId: chosen } }
              : { outcome: { outcome: "cancelled" } },
          })
          return
        }
        case "studio/call": {
          // The bridge's MCP server forwarding the harness's tool call.
          const name = String(params.name ?? "")
          const args =
            typeof params.arguments === "object" && params.arguments !== null
              ? (params.arguments as Record<string, unknown>)
              : {}
          const result = await finishStudioTool(name, callStudioTool(name, args, run))
          flush()
          o.onEvent?.({ type: "tool", name, args, result })
          send({ jsonrpc: "2.0", id: m.id, result })
          return
        }
        default:
          // Capabilities we declared off (fs/terminal) and anything unknown.
          if (m.id !== undefined)
            send({ jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `unsupported: ${m.method}` } })
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
      get acceptsImages() {
        return images
      },
      get modes() {
        return modes
      },
      get mode() {
        return mode
      },
      get model() {
        return model
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
        model = modelOf(s)
        if (model) o.onEvent?.({ type: "model", model })
        return sessionId ?? ""
      },
      async setModel(id) {
        if (!model) return
        const res = await request("session/set_config_option", { sessionId, configId: model.configId, value: id })
        model = modelOf(res) ?? { ...model, current: id }
        o.onEvent?.({ type: "model", model })
      },
      async setMode(id) {
        await request("session/set_mode", { sessionId, modeId: id })
        mode = id
        o.onEvent?.({ type: "mode", current: id, modes })
      },
      async prompt(goal, signal, pictures = []) {
        if (!sessionId) await client.newSession()
        busy = true
        segment = ""
        turnText = ""
        const started = Date.now()
        const onAbort = () => notify("session/cancel", { sessionId })
        signal?.addEventListener("abort", onAbort, { once: true })
        try {
          const res = (await request("session/prompt", {
            sessionId,
            prompt: promptBlocks(goal, pictures, images),
          })) as {
            stopReason?: string
          }
          const stop = res?.stopReason ?? "end_turn"
          flush()
          o.onEvent?.({ type: "turn", elapsedMs: Date.now() - started, usage: usageOf(res) })
          o.onEvent?.({ type: stop === "cancelled" ? "stopped" : "done" })
          return { stopReason: stop, text: turnText }
        } catch (e) {
          flush()
          // A stop is not a failure: the turn ends as the user asked.
          if (signal?.aborted) {
            o.onEvent?.({ type: "stopped" })
            return { stopReason: "cancelled", text: turnText }
          }
          o.onEvent?.({ type: "error", message: e instanceof Error ? e.message : String(e) })
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
