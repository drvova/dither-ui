import { describe, expect, it } from "vitest"
import { compact, estimateTokens, runAgent, shapeResult, sse, STUDIO_TOOLS, systemPrompt, toAnthropic, toOpenAI, type AgentMessage } from "@/features/agent/llm"
import { mapUpdate, usageOf } from "@/features/agent/acp"

type Call = { url: string; body: Record<string, unknown>; headers: Record<string, string> }

function fakeFetch(responses: unknown[]) {
  const calls: Call[] = []
  const f = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init?.body)), headers: Object.fromEntries(Object.entries(init?.headers ?? {})) })
    const body = responses.shift() ?? {}
    return { ok: true, status: 200, json: async () => body } as Response
  }) as unknown as typeof fetch
  return { f, calls }
}

describe("message shaping", () => {
  const history: AgentMessage[] = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "placing", toolCalls: [{ id: "a", name: "add_component", args: { is: "DitherTabs" } }, { id: "b", name: "select", args: { id: "x" } }] },
    { role: "tool", toolCallId: "a", name: "add_component", content: "{\"ok\":true}" },
    { role: "tool", toolCallId: "b", name: "select", content: "{\"ok\":true}" },
  ]

  it("merges consecutive tool results into one Anthropic user turn", () => {
    const m = toAnthropic(history)
    expect(m.map((x) => x.role)).toEqual(["user", "assistant", "user"])
    expect(m[1].content.map((b) => b.type)).toEqual(["text", "tool_use", "tool_use"])
    expect(m[2].content).toHaveLength(2)
    expect(m[2].content.every((b) => b.type === "tool_result")).toBe(true)
  })

  it("emits OpenAI tool_calls and tool messages", () => {
    const m = toOpenAI("sys", history)
    expect(m[0]).toEqual({ role: "system", content: "sys" })
    const a = m[2] as { tool_calls: { function: { name: string; arguments: string } }[] }
    expect(a.tool_calls.map((c) => c.function.name)).toEqual(["add_component", "select"])
    expect(JSON.parse(a.tool_calls[0].function.arguments)).toEqual({ is: "DitherTabs" })
    expect((m[3] as { role: string }).role).toBe("tool")
  })
})

describe("agent loop", () => {
  it("executes tool calls against the protocol and stops on prose (anthropic)", async () => {
    const { f, calls } = fakeFetch([
      { content: [{ type: "text", text: "Adding tabs." }, { type: "tool_use", id: "t1", name: "add_component", input: { is: "DitherTabs", props: { variant: "segmented" } } }] },
      { content: [{ type: "text", text: "Done: one tabs frame." }] },
    ])
    const ran: unknown[] = []
    const events: string[] = []
    const transcript = await runAgent({
      provider: { kind: "anthropic", apiKey: "k", model: "m" },
      goal: "add tabs",
      fetch: f,
      run: (c) => {
        ran.push(c)
        return { ok: true, data: { id: "ab1" } }
      },
      onEvent: (e) => events.push(e.type),
    })
    // The loop reads the canvas for context before every turn; the tool call is the rest.
    expect(ran.filter((c) => (c as { type: string }).type !== "artboard.list")).toEqual([{ type: "component.add", is: "DitherTabs", props: { variant: "segmented" } }])
    expect(events.filter((t) => t !== "turn" && t !== "delta")).toEqual(["assistant", "tool", "assistant", "done"])
    expect(events.filter((t) => t === "turn")).toHaveLength(2)
    expect(calls[0].url).toBe("https://api.anthropic.com/v1/messages")
    expect(calls[0].headers["x-api-key"]).toBe("k")
    expect(calls[0].headers["anthropic-dangerous-direct-browser-access"]).toBe("true")
    expect((calls[0].body.tools as unknown[]).length).toBe(STUDIO_TOOLS.length)
    // Second call carries the tool result back.
    const second = calls[1].body.messages as { role: string; content: { type: string }[] }[]
    expect(second[second.length - 1].content[0].type).toBe("tool_result")
    expect(transcript[transcript.length - 1]).toMatchObject({ role: "assistant", content: "Done: one tabs frame." })
  })

  it("speaks the OpenAI shape, honours baseUrl, and reports unknown tools", async () => {
    const { f, calls } = fakeFetch([
      { choices: [{ message: { content: null, tool_calls: [{ id: "c1", function: { name: "nope", arguments: "{}" } }, { id: "c2", function: { name: "list_artboards", arguments: "not json" } }] } }] },
      { choices: [{ message: { content: "ok" } }] },
    ])
    const events: { type: string; result?: { ok: boolean } }[] = []
    await runAgent({
      provider: { kind: "openai", apiKey: "k", model: "m", baseUrl: "http://localhost:11434/" },
      goal: "x",
      fetch: f,
      run: () => ({ ok: true, data: [] }),
      onEvent: (e) => events.push(e as never),
    })
    expect(calls[0].url).toBe("http://localhost:11434/v1/chat/completions")
    expect(calls[0].headers.authorization).toBe("Bearer k")
    expect(events.filter((e) => e.type === "tool").map((e) => e.result?.ok)).toEqual([false, true])
    const second = calls[1].body.messages as { role: string }[]
    expect(second.filter((m) => m.role === "tool")).toHaveLength(2)
  })

  it("surfaces provider errors and the step budget", async () => {
    const bad = (async () => ({ ok: false, status: 401, json: async () => ({ error: { message: "bad key" } }) }) as Response) as unknown as typeof fetch
    const events: { type: string; message?: string }[] = []
    await runAgent({ provider: { kind: "anthropic", apiKey: "", model: "m" }, goal: "x", fetch: bad, onEvent: (e) => events.push(e as never) })
    expect(events).toEqual([{ type: "error", message: "bad key" }])
    const loop = (async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: "tool_use", id: "t", name: "list_artboards", input: {} }] }) }) as Response) as unknown as typeof fetch
    const ev2: string[] = []
    await runAgent({ provider: { kind: "anthropic", apiKey: "k", model: "m" }, goal: "x", fetch: loop, maxSteps: 2, run: () => ({ ok: true, data: [] }), onEvent: (e) => ev2.push(e.type) })
    expect(ev2.filter((t) => t !== "turn")).toEqual(["tool", "tool", "error"])
  })

  it("delivers steering text after tool results in one user turn, and reports usage", async () => {
    const { f, calls } = fakeFetch([
      { content: [{ type: "tool_use", id: "t1", name: "list_artboards", input: {} }], usage: { input_tokens: 120, output_tokens: 8 } },
      { content: [{ type: "text", text: "ok" }], usage: { input_tokens: 150, output_tokens: 4 } },
    ])
    const queue = ["make it blue"]
    const events: { type: string; usage?: { input: number }; text?: string }[] = []
    await runAgent({
      provider: { kind: "anthropic", apiKey: "k", model: "m" },
      goal: "x",
      fetch: f,
      run: () => ({ ok: true, data: [] }),
      pull: () => queue.splice(0),
      onEvent: (e) => events.push(e as never),
    })
    const second = calls[1].body.messages as { role: string; content: { type: string; text?: string }[] }[]
    const last = second[second.length - 1]
    expect(last.role).toBe("user")
    expect(last.content.map((b) => b.type)).toEqual(["tool_result", "text"])
    expect(last.content[1].text).toBe("make it blue")
    expect(events.filter((e) => e.type === "steer").map((e) => e.text)).toEqual(["make it blue"])
    expect(events.filter((e) => e.type === "turn").map((e) => e.usage?.input)).toEqual([120, 150])
  })

  it("streams SSE from both providers and reports deltas", async () => {
    const stream = (lines: string[]) => {
      const enc = new TextEncoder()
      return new ReadableStream<Uint8Array>({
        start(c) {
          for (const l of lines) c.enqueue(enc.encode(l))
          c.close()
        },
      })
    }
    const sseFetch = (body: string[]) =>
      (async () => ({ ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }), body: stream(body) }) as Response) as unknown as typeof fetch
    const anthropic = sseFetch([
      'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":50}}}\n\n',
      'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text"}}\n\n',
      'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hel"}}\n\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"lo"}}\n\n',
      'data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"t9","name":"list_artboards"}}\n\ndata: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{}"}}\n\n',
      'data: {"type":"message_delta","usage":{"output_tokens":7}}\n\n',
    ])
    const deltas: string[] = []
    const ev: { type: string }[] = []
    await runAgent({ provider: { kind: "anthropic", apiKey: "k", model: "m" }, goal: "x", fetch: anthropic, maxSteps: 1, run: () => ({ ok: true, data: [] }), onEvent: (e) => { ev.push(e); if (e.type === "delta") deltas.push(e.text) } })
    expect(deltas).toEqual(["Hel", "lo"])
    const turn = ev.find((e) => e.type === "turn") as { usage?: { input: number; output: number } }
    expect(turn.usage).toEqual({ input: 50, output: 7 })
    expect(ev.filter((e) => e.type === "tool")).toHaveLength(1)
    const openai = sseFetch([
      'data: {"choices":[{"delta":{"content":"Pla"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"ced.","tool_calls":[{"index":0,"id":"c1","function":{"name":"list_art"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"name":"boards","arguments":"{}"}}]}}]}\n\n',
      'data: {"choices":[],"usage":{"prompt_tokens":9,"completion_tokens":3}}\n\ndata: [DONE]\n\n',
    ])
    const d2: string[] = []
    const ev2: { type: string; name?: string }[] = []
    await runAgent({ provider: { kind: "openai", apiKey: "k", model: "m" }, goal: "x", fetch: openai, maxSteps: 1, run: () => ({ ok: true, data: [] }), onEvent: (e) => { ev2.push(e as never); if (e.type === "delta") d2.push(e.text) } })
    expect(d2.join("")).toBe("Placed.")
    expect(ev2.find((e) => e.type === "tool")?.name).toBe("list_artboards")
    // The parser itself: multi-line data and events.
    const got: string[] = []
    for await (const m of sse(stream(["event: a\ndata: 1\ndata: 2\n\n", "data: 3\n\n"]))) got.push(`${m.event ?? ""}:${m.data}`)
    expect(got).toEqual(["a:1\n2", ":3"])
  })

  it("retries transient failures with backoff and asks before destructive tools", async () => {
    let n = 0
    const flaky = (async () => {
      n++
      if (n === 1) return { ok: false, status: 529, json: async () => ({ error: { message: "overloaded" } }) } as Response
      return { ok: true, status: 200, json: async () => ({ content: [{ type: "tool_use", id: "t1", name: "remove_artboard", input: { id: "ab1" } }] }) } as Response
    }) as unknown as typeof fetch
    const ev: { type: string; attempt?: number; result?: { ok: boolean; error?: string } }[] = []
    const ran: unknown[] = []
    await runAgent({
      provider: { kind: "anthropic", apiKey: "k", model: "m" },
      goal: "x",
      fetch: flaky,
      maxSteps: 1,
      run: (c) => { ran.push(c); return { ok: true, data: [] } },
      approve: async () => false,
      onEvent: (e) => ev.push(e as never),
    })
    expect(ev.find((e) => e.type === "retry")?.attempt).toBe(1)
    const tool = ev.find((e) => e.type === "tool")
    expect(tool?.result).toEqual({ ok: false, error: "denied by the user" })
    expect(ran.some((c) => (c as { type: string }).type === "artboard.remove")).toBe(false)
  }, 10_000)

  it("shapes results, estimates context and compacts old tool results only", () => {
    const shaped = shapeResult("get_document", { ok: true, data: { src: `data:image/png;base64,${"A".repeat(500)}` } })
    expect(shaped).toContain("chars elided")
    expect(shaped.length).toBeLessThan(200)
    const big = shapeResult("get_registry", { ok: true, data: "x".repeat(20_000) })
    expect(big).toContain("truncated")
    expect(big).toContain("pass `is`")
    const long = "r".repeat(400)
    const msgs: AgentMessage[] = [
      { role: "user", content: "one" },
      { role: "assistant", content: "", toolCalls: [{ id: "a", name: "get_document", args: {} }] },
      { role: "tool", toolCallId: "a", name: "get_document", content: `{"ok":true,"data":"${long}"}` },
      { role: "user", content: "two" },
      { role: "assistant", content: "", toolCalls: [{ id: "b", name: "list_artboards", args: {} }] },
      { role: "tool", toolCallId: "b", name: "list_artboards", content: `{"ok":true,"data":"${long}"}` },
      { role: "user", content: "three" },
    ]
    const out = compact(msgs, 2)
    expect(out[2].content).toContain("[compacted: ok")
    expect(out[5].content).toBe(msgs[5].content)
    expect(estimateTokens("sys", out)).toBeLessThan(estimateTokens("sys", msgs))
  })

  it("maps ACP session updates into transcript events", () => {
    expect(mapUpdate({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "hi" } })).toEqual([{ type: "delta", text: "hi" }])
    expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t1", title: "Read file src/app.ts", status: "pending" })).toEqual([{ type: "activity", id: "t1", title: "Read file src/app.ts", status: "pending" }])
    // A status-only update keeps the title it announced with.
    expect(mapUpdate({ sessionUpdate: "tool_call_update", toolCallId: "t1", status: "completed" })).toEqual([{ type: "activity", id: "t1", title: "", status: "completed" }])
    // Studio tools are rendered from the bridge's studio/call path, not the agent's mirror.
    expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t2", title: "add_screen" })).toEqual([])
    expect(mapUpdate({ sessionUpdate: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] })).toEqual([{ type: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] }])
    expect(usageOf({ usage: { inputTokens: 5, outputTokens: 2 } })).toEqual({ input: 5, output: 2 })
    expect(usageOf({})).toBeUndefined()
  })

  it("builds a system prompt from the live registry", () => {
    const s = systemPrompt()
    expect(s).toMatch(/inputs: .*DitherSlider/)
    expect(s).toContain("get_registry")
    expect(s.length).toBeLessThan(12_000)
    expect(systemPrompt("2 frames — A (bar chart, id x)")).toContain("Canvas now: 2 frames")
  })
})
