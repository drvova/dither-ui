#!/usr/bin/env node
// dither-bridge: the local half of the Studio's ACP control plane.
//
// A browser cannot spawn a coding agent, so this one-file, zero-dependency
// Node process does, and nothing else:
//
//   browser ── websocket (127.0.0.1) ── bridge ── stdio ── ACP agent
//                                         │
//                       MCP (stdio) ──────┘  "dither-studio" server, spawned
//                       by the agent; its tools/call go back through the
//                       bridge to the browser as `studio/call`.
//
// The agent is the user's own: Claude Code's ACP adapter, Codex's, Gemini
// CLI's `--experimental-acp`, pi, omp, anything that speaks the Agent
// Client Protocol over stdio. It keeps its own login; no credential ever
// reaches the browser or this process. The bridge relays JSON-RPC
// verbatim and touches exactly one thing: every `session/new` (and
// `session/load`) gets the Studio MCP server added to `mcpServers`.
//
//   node bridge/dither-bridge.mjs --agent "npx @zed-industries/claude-code-acp"
//   node bridge/dither-bridge.mjs --agent "codex-acp" --port 8790 --cwd ~/work
//
// Then in the Studio's agent panel: backend "acp bridge" → run.
// Internal: `--mcp <port>` is the MCP server mode the agent spawns.
import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { createServer, request as httpRequest } from "node:http"
import { dirname, join } from "node:path"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"

const SELF = fileURLToPath(import.meta.url)
const args = process.argv.slice(2)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def
}

if (args.includes("--mcp")) {
  mcpMode(Number(opt("mcp", "8790")))
} else {
  serveMode({ agent: opt("agent", ""), port: Number(opt("port", "8790")), cwd: opt("cwd", process.cwd()) })
}

/* ------------------------------ websocket ------------------------------- */

const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

/** Minimal RFC 6455 server side: text frames, ping/pong, close. */
export function wsAccept(socket, key, onMessage, onClose) {
  const accept = createHash("sha1").update(key + WS_GUID).digest("base64")
  socket.write(["HTTP/1.1 101 Switching Protocols", "Upgrade: websocket", "Connection: Upgrade", `Sec-WebSocket-Accept: ${accept}`, "", ""].join("\r\n"))
  let buf = Buffer.alloc(0)
  let fragments = []
  socket.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk])
    for (;;) {
      const frame = decodeFrame(buf)
      if (!frame) return
      buf = buf.subarray(frame.size)
      if (frame.opcode === 8) {
        socket.end(encodeFrame(Buffer.alloc(0), 8))
        return
      }
      if (frame.opcode === 9) {
        socket.write(encodeFrame(frame.payload, 10))
        continue
      }
      if (frame.opcode === 10) continue
      fragments.push(frame.payload)
      if (frame.fin) {
        const text = Buffer.concat(fragments).toString("utf8")
        fragments = []
        onMessage(text)
      }
    }
  })
  socket.on("close", onClose)
  socket.on("error", onClose)
  return { send: (text) => socket.writable && socket.write(encodeFrame(Buffer.from(text, "utf8"), 1)), close: () => socket.end(encodeFrame(Buffer.alloc(0), 8)) }
}

export function decodeFrame(buf) {
  if (buf.length < 2) return null
  const fin = (buf[0] & 0x80) !== 0
  const opcode = buf[0] & 0x0f
  const masked = (buf[1] & 0x80) !== 0
  let len = buf[1] & 0x7f
  let off = 2
  if (len === 126) {
    if (buf.length < 4) return null
    len = buf.readUInt16BE(2)
    off = 4
  } else if (len === 127) {
    if (buf.length < 10) return null
    len = Number(buf.readBigUInt64BE(2))
    off = 10
  }
  const maskKey = masked ? buf.subarray(off, off + 4) : null
  if (masked) off += 4
  if (buf.length < off + len) return null
  const payload = Buffer.from(buf.subarray(off, off + len))
  if (maskKey) for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i & 3]
  return { fin, opcode, payload, size: off + len }
}

export function encodeFrame(payload, opcode) {
  const len = payload.length
  const head = len < 126 ? Buffer.from([0x80 | opcode, len]) : len < 65536 ? Buffer.from([0x80 | opcode, 126, len >> 8, len & 255]) : Buffer.concat([Buffer.from([0x80 | opcode, 127]), (() => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(len)); return b })()])
  return Buffer.concat([head, payload])
}

/* -------------------------------- serve --------------------------------- */

function serveMode({ agent, port, cwd }) {
  if (!agent) {
    console.error('dither-bridge: pass the agent to run, e.g. --agent "npx @zed-industries/claude-code-acp"')
    process.exit(2)
  }
  let browser = null // { send, close }
  let child = null
  let tools = []
  let relaySeq = 0
  const relayPending = new Map() // id → resolve
  const log = (...m) => console.log(new Date().toISOString().slice(11, 19), ...m)

  const readJson = (req) =>
    new Promise((resolve) => {
      let body = ""
      req.on("data", (c) => (body += c))
      req.on("end", () => {
        try {
          resolve(JSON.parse(body || "{}"))
        } catch {
          resolve({})
        }
      })
    })
  const json = (res, status, body) => {
    res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" })
    res.end(JSON.stringify(body))
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x")
    if (req.method === "GET" && url.pathname === "/") return json(res, 200, { bridge: "dither-ui", agent, connected: !!browser, tools: tools.length })
    if (req.method === "POST" && url.pathname === "/relay/tools") return json(res, 200, { tools })
    if (req.method === "POST" && url.pathname === "/relay/call") {
      if (!browser) return json(res, 503, { ok: false, error: "no studio tab connected" })
      const { name, arguments: a } = await readJson(req)
      const id = `b${++relaySeq}`
      const result = await new Promise((resolve) => {
        relayPending.set(id, resolve)
        browser.send(JSON.stringify({ jsonrpc: "2.0", id, method: "studio/call", params: { name, arguments: a ?? {} } }))
        setTimeout(() => relayPending.delete(id) && resolve({ ok: false, error: "studio did not answer" }), 30_000)
      })
      return json(res, 200, materialize(result))
    }
    json(res, 404, { error: "not found" })
  })

  server.on("upgrade", (req, socket) => {
    const key = req.headers["sec-websocket-key"]
    if (!key || browser) {
      socket.end("HTTP/1.1 409 Conflict\r\n\r\n")
      return
    }
    const ws = wsAccept(
      socket,
      key,
      (text) => fromBrowser(text),
      () => {
        if (browser !== ws) return
        browser = null
        stopAgent()
        log("studio disconnected")
      },
    )
    browser = ws
    log("studio connected")
    startAgent()
  })

  function startAgent() {
    stopAgent()
    log(`starting agent: ${agent}`)
    child = spawn(agent, { cwd, shell: true, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, DITHER_BRIDGE_PORT: String(port) } })
    const lines = createInterface({ input: child.stdout })
    lines.on("line", (line) => {
      if (!line.trim() || !browser) return
      // Verbatim relay, agent → browser.
      browser.send(line)
    })
    child.stderr.on("data", (d) => process.stderr.write(`[agent] ${d}`))
    child.on("exit", (code) => {
      log(`agent exited (${code ?? "signal"})`)
      browser?.send(JSON.stringify({ jsonrpc: "2.0", method: "bridge/exit", params: { code } }))
      child = null
    })
    browser?.send(JSON.stringify({ jsonrpc: "2.0", method: "bridge/hello", params: { agent, pid: child.pid, cwd } }))
  }

  function stopAgent() {
    if (!child) return
    child.kill()
    child = null
  }

  /** A tab's tool result may carry files for the project (`data.files:
   * [{ path, content }]`, e.g. a video composition): they are written under
   * --cwd — relative paths only, never above it — and replaced by their
   * paths, so the agent gets a location, not a payload. */
  function materialize(result) {
    const files = result?.data?.files
    if (!Array.isArray(files)) return result
    const written = []
    for (const f of files) {
      if (!f || typeof f.path !== "string" || typeof f.content !== "string") continue
      const rel = f.path.replace(/\\/g, "/")
      if (rel.startsWith("/") || /^[a-z]:/i.test(rel) || rel.split("/").includes("..")) continue
      const abs = join(cwd, rel)
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, f.content)
      written.push(rel)
      log(`wrote ${rel} (${f.content.length} chars)`)
    }
    result.data.files = written
    result.data.cwd = cwd
    return result
  }

  function fromBrowser(text) {
    let m
    try {
      m = JSON.parse(text)
    } catch {
      return
    }
    if (m.method === "bridge/tools") {
      tools = Array.isArray(m.params?.tools) ? m.params.tools : []
      return
    }
    // The browser answering a studio/call.
    if (typeof m.id === "string" && m.id.startsWith("b") && m.method === undefined) {
      const resolve = relayPending.get(m.id)
      if (resolve) {
        relayPending.delete(m.id)
        resolve(m.result ?? { ok: false, error: m.error?.message ?? "error" })
      }
      return
    }
    // The one edit: every new or loaded session gets the Studio MCP server.
    if ((m.method === "session/new" || m.method === "session/load") && m.params && typeof m.params === "object") {
      const servers = Array.isArray(m.params.mcpServers) ? m.params.mcpServers : []
      m.params.mcpServers = [...servers, { name: "dither-studio", command: process.execPath, args: [SELF, "--mcp", String(port)], env: [] }]
      if (!m.params.cwd || m.params.cwd === "/") m.params.cwd = cwd
    }
    if (!child) startAgent()
    child.stdin.write(`${JSON.stringify(m)}\n`)
  }

  server.listen(port, "127.0.0.1", () => {
    log(`dither-bridge on ws://127.0.0.1:${port} — agent: ${agent}`)
    log("open the Studio, choose the acp bridge backend, and send a prompt")
  })
  process.on("SIGINT", () => {
    stopAgent()
    process.exit(0)
  })
}

/* ---------------------------------- mcp --------------------------------- */

/** The MCP stdio server the agent spawns. Every tool is relayed to the
 * bridge over local HTTP, which forwards it to the browser. */
function mcpMode(port) {
  const post = (path, body) =>
    new Promise((resolve) => {
      const req = httpRequest({ host: "127.0.0.1", port, path, method: "POST", headers: { "content-type": "application/json" } }, (res) => {
        let data = ""
        res.on("data", (c) => (data += c))
        res.on("end", () => {
          try {
            resolve(JSON.parse(data || "{}"))
          } catch {
            resolve({ ok: false, error: "bad relay reply" })
          }
        })
      })
      req.on("error", (e) => resolve({ ok: false, error: `bridge unreachable: ${e.message}` }))
      req.end(JSON.stringify(body))
    })
  const out = (m) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...m })}\n`)
  const lines = createInterface({ input: process.stdin })
  lines.on("line", async (line) => {
    let m
    try {
      m = JSON.parse(line)
    } catch {
      return
    }
    if (m.method === "initialize") return out({ id: m.id, result: { protocolVersion: m.params?.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "dither-studio", version: "1" } } })
    if (m.method === "notifications/initialized") return
    if (m.method === "ping") return out({ id: m.id, result: {} })
    if (m.method === "tools/list") {
      const { tools } = await post("/relay/tools", {})
      return out({ id: m.id, result: { tools: Array.isArray(tools) ? tools : [] } })
    }
    if (m.method === "tools/call") {
      const result = await post("/relay/call", { name: m.params?.name, arguments: m.params?.arguments ?? {} })
      return out({ id: m.id, result: { content: [{ type: "text", text: JSON.stringify(result) }], isError: result?.ok === false } })
    }
    if (m.id !== undefined) out({ id: m.id, error: { code: -32601, message: `unsupported: ${m.method}` } })
  })
  lines.on("close", () => process.exit(0))
}
