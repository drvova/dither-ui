// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { mapUpdate, modesOf, usageOf } from "@/features/agent/acp"
import { callStudioTool, loadAgentConfig, loadSession, saveAgentConfig, saveSession, STUDIO_TOOLS } from "@/features/agent/tools"
import type { CommandResult } from "@/features/agent/protocol"

beforeEach(() => localStorage.clear())

describe("studio tools", () => {
  it("map one to one onto protocol commands and carry schemas a harness can read", () => {
    const names = STUDIO_TOOLS.map((t) => t.def.name)
    expect(names).toEqual(["list_artboards", "get_registry", "add_screen", "add_component", "add_chart", "add_widget", "add_reel", "update_artboard", "remove_artboard", "select", "evolve", "get_code", "get_document", "seek_clock", "export_video"])
    for (const t of STUDIO_TOOLS) expect(t.def.parameters).toMatchObject({ type: "object" })
    const seen: unknown[] = []
    const run = (c: unknown): CommandResult => {
      seen.push(c)
      return { ok: true, data: [] }
    }
    expect(callStudioTool("add_chart", { chart: "bar", name: "Q3" }, run)).toEqual({ ok: true, data: [] })
    expect(seen).toEqual([{ chart: "bar", name: "Q3", type: "chart.add" }])
    expect(callStudioTool("nope", {}, run)).toEqual({ ok: false, error: "unknown tool nope" })
  })
})

describe("acp mapping", () => {
  it("turns session updates into composer events", () => {
    expect(mapUpdate({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "hi" } })).toEqual([{ type: "delta", text: "hi" }])
    expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t1", title: "Read file src/app.ts", status: "pending" })).toEqual([{ type: "activity", id: "t1", title: "Read file src/app.ts", status: "pending" }])
    // A status-only update keeps the title it announced with.
    expect(mapUpdate({ sessionUpdate: "tool_call_update", toolCallId: "t1", status: "completed" })).toEqual([{ type: "activity", id: "t1", title: "", status: "completed" }])
    // Studio tools are rendered from the bridge's studio/call path, not the agent's mirror.
    expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t2", title: "add_screen" })).toEqual([])
    expect(mapUpdate({ sessionUpdate: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] })).toEqual([{ type: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] }])
    expect(mapUpdate({ sessionUpdate: "current_mode_update", currentModeId: "plan" })).toEqual([{ type: "mode", current: "plan", modes: [] }])
    expect(mapUpdate({ sessionUpdate: "available_commands_update", availableCommands: [{ name: "review", description: "Review the diff", input: { hint: "<path>" } }, { name: 7 }] })).toEqual([{ type: "commands", commands: [{ name: "review", description: "Review the diff", input: "<path>" }] }])
    expect(mapUpdate({ sessionUpdate: "user_message_chunk" })).toEqual([])
  })

  it("reads modes and usage off the agent's answers", () => {
    expect(modesOf({ sessionId: "s", modes: { currentModeId: "code", availableModes: [{ id: "code", name: "Code" }, { id: "plan", name: "Plan", description: "read only" }] } })).toEqual({ current: "code", modes: [{ id: "code", name: "Code", description: undefined }, { id: "plan", name: "Plan", description: "read only" }] })
    expect(modesOf({ sessionId: "s" })).toBeNull()
    expect(usageOf({ usage: { inputTokens: 5, outputTokens: 2 } })).toEqual({ input: 5, output: 2 })
    expect(usageOf({})).toBeUndefined()
  })
})

describe("composer state", () => {
  it("keeps the harness choice and the bridge address, never a secret", () => {
    expect(loadAgentConfig()).toEqual({ bridgeUrl: "ws://127.0.0.1:8790", harness: "", command: "", auto: false })
    saveAgentConfig({ bridgeUrl: "ws://127.0.0.1:9000", harness: "custom", command: "omp --mode acp", auto: true })
    expect(loadAgentConfig()).toEqual({ bridgeUrl: "ws://127.0.0.1:9000", harness: "custom", command: "omp --mode acp", auto: true })
    expect(Object.keys(JSON.parse(localStorage.getItem("dither-agent-config") ?? "{}"))).toEqual(["bridgeUrl", "harness", "command", "auto"])
  })

  it("persists a project's transcript under a cap, dropping the oldest entries first", () => {
    const big = Array.from({ length: 400 }, (_, i) => ({ kind: "assistant", text: `${i}:${"x".repeat(1000)}` }))
    saveSession("p1", { entries: big, usage: { input: 1, output: 2 } })
    const s = loadSession<{ kind: string; text: string }>("p1")
    expect(s?.usage).toEqual({ input: 1, output: 2 })
    expect(s?.entries.length).toBeLessThan(400)
    expect(s?.entries.at(-1)?.text.startsWith("399:")).toBe(true)
    saveSession("p1", { entries: [], usage: { input: 0, output: 0 } })
    expect(loadSession("p1")).toBeNull()
  })
})
