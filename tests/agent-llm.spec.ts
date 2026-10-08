import { describe, expect, it } from "vitest"
import { runAgent, STUDIO_TOOLS, systemPrompt, toAnthropic, toOpenAI, type AgentMessage } from "@/features/agent/llm"

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
    expect(ran).toEqual([{ type: "component.add", is: "DitherTabs", props: { variant: "segmented" } }])
    expect(events.filter((t) => t !== "turn")).toEqual(["assistant", "tool", "assistant", "done"])
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

  it("builds a system prompt from the live registry", () => {
    const s = systemPrompt()
    expect(s).toMatch(/inputs: .*DitherSlider/)
    expect(s).toContain("get_registry")
    expect(s.length).toBeLessThan(12_000)
  })
})
