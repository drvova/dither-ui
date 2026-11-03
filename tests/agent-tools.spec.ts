// @rstest-environment jsdom
import { readFileSync } from "node:fs"
import { beforeEach, describe, expect, it } from "rstack/test"
import {
  mapUpdate,
  modelName,
  modelOf,
  modesOf,
  permissionOptions,
  promptBlocks,
  takesImages,
  usageOf,
} from "@/features/agent/acp"
import {
  callStudioTool,
  loadAgentConfig,
  loadDraft,
  saveAgentConfig,
  saveDraft,
  STUDIO_SERVER,
  STUDIO_TOOLS,
} from "@/features/agent/tools"
import type { CommandResult } from "@/features/agent/protocol"

beforeEach(() => {
  localStorage.clear()
})

describe("studio tools", () => {
  it("map one to one onto protocol commands and carry schemas a harness can read", () => {
    const names = STUDIO_TOOLS.map((t) => t.def.name)
    expect(names).toEqual([
      "list_artboards",
      "get_registry",
      "add_screen",
      "add_component",
      "add_chart",
      "add_widget",
      "add_reel",
      "update_artboard",
      "remove_artboard",
      "select",
      "evolve",
      "get_code",
      "get_document",
      "seek_clock",
      "export_video",
    ])
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
  it("reads a harness's permission options once, whatever it sends", () => {
    expect(
      permissionOptions([
        { optionId: "allow-once", name: "Allow", kind: "allow_once" },
        { optionId: "reject", kind: 7 },
        { name: "no id" },
        null,
        "x",
      ]),
    ).toEqual([
      { optionId: "allow-once", name: "Allow", kind: "allow_once" },
      { optionId: "reject", name: "reject", kind: "" },
    ])
    expect(permissionOptions(undefined)).toEqual([])
  })
  it("turns session updates into composer events", () => {
    expect(mapUpdate({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "hi" } })).toEqual([
      { type: "delta", text: "hi" },
    ])
    // The harness's reasoning streams apart from its reply.
    expect(mapUpdate({ sessionUpdate: "agent_thought_chunk", content: { type: "text", text: "hmm" } })).toEqual([
      { type: "thought", text: "hmm" },
    ])
    expect(mapUpdate({ sessionUpdate: "agent_thought_chunk", content: { type: "image" } })).toEqual([])
    expect(
      mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t1", title: "Read file src/app.ts", status: "pending" }),
    ).toEqual([{ type: "activity", id: "t1", title: "Read file src/app.ts", status: "pending" }])
    // A status-only update keeps the title it announced with.
    expect(mapUpdate({ sessionUpdate: "tool_call_update", toolCallId: "t1", status: "completed" })).toEqual([
      { type: "activity", id: "t1", title: "", status: "completed" },
    ])
    // Studio tools are rendered from the bridge's studio/call path, not the agent's mirror.
    // The harness's mirror of its call of the Studio's one tool is drawn from
    // the call itself; a file of a dither project is not that tool.
    expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t2", title: "mcp__dither-studio__dither" })).toEqual([])
    expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t3", title: "dither" })).toEqual([])
    expect(
      mapUpdate({ sessionUpdate: "tool_call", toolCallId: "t4", title: "Read dither-kit/engine/pixel.ts" }),
    ).toHaveLength(1)
    // A call that arrives untitled is named by a later update, never by its id.
    expect(mapUpdate({ sessionUpdate: "tool_call", toolCallId: "toolu_01", status: "pending" })).toEqual([
      { type: "activity", id: "toolu_01", title: "", status: "pending" },
    ])
    expect(mapUpdate({ sessionUpdate: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] })).toEqual(
      [{ type: "plan", entries: [{ content: "Add a screen", status: "in_progress" }] }],
    )
    expect(mapUpdate({ sessionUpdate: "current_mode_update", currentModeId: "plan" })).toEqual([
      { type: "mode", current: "plan", modes: [] },
    ])
    expect(
      mapUpdate({
        sessionUpdate: "available_commands_update",
        availableCommands: [{ name: "review", description: "Review the diff", input: { hint: "<path>" } }, { name: 7 }],
      }),
    ).toEqual([{ type: "commands", commands: [{ name: "review", description: "Review the diff", input: "<path>" }] }])
    expect(mapUpdate({ sessionUpdate: "user_message_chunk" })).toEqual([])
  })

  it("sends pictures only to a harness that said it takes them", () => {
    const png = { mimeType: "image/png", data: "iVBOR" }
    expect(takesImages({ agentCapabilities: { promptCapabilities: { image: true } } })).toBe(true)
    for (const init of [
      { agentCapabilities: { promptCapabilities: { image: "yes" } } },
      { agentCapabilities: {} },
      null,
    ])
      expect(takesImages(init)).toBe(false)
    expect(promptBlocks("look", [png], true)).toEqual([
      { type: "text", text: "look" },
      { type: "image", mimeType: "image/png", data: "iVBOR" },
    ])
    expect(promptBlocks("look", [png], false)).toEqual([{ type: "text", text: "look" }])
  })

  it("reads modes and usage off the agent's answers", () => {
    expect(
      modesOf({
        sessionId: "s",
        modes: {
          currentModeId: "code",
          availableModes: [
            { id: "code", name: "Code" },
            { id: "plan", name: "Plan", description: "read only" },
          ],
        },
      }),
    ).toEqual({
      current: "code",
      modes: [
        { id: "code", name: "Code", description: undefined },
        { id: "plan", name: "Plan", description: "read only" },
      ],
    })
    expect(modesOf({ sessionId: "s" })).toBeNull()
    expect(usageOf({ usage: { inputTokens: 5, outputTokens: 2 } })).toEqual({ input: 5, output: 2 })
    expect(usageOf({})).toBeUndefined()
  })

  it("names the Studio's MCP server as the bridge does", () => {
    // The bridge is its own zero-dependency file: its copy of the name is
    // pinned here, so a harness's `mcp__<server>__<tool>` titles read back.
    expect(readFileSync("bridge/dither-bridge.mjs", "utf8")).toContain(`name: "${STUDIO_SERVER}"`)
  })

  it("reads the model a harness runs off its session's config options, and follows its updates", () => {
    // As Claude Code's ACP adapter sends it: a select of category "model",
    // its default entry naming the model it resolves to.
    const session = {
      sessionId: "s",
      configOptions: [
        { id: "mode", category: "mode", type: "select", currentValue: "default", options: [] },
        {
          id: "model",
          name: "Model",
          category: "model",
          type: "select",
          currentValue: "default",
          options: [
            { value: "default", name: "Default (recommended)", description: "Opus 5.5" },
            { value: "sonnet", name: "Sonnet", description: "Sonnet 5.5 for everyday tasks" },
          ],
        },
      ],
    }
    const m = modelOf(session)
    expect(m).toEqual({
      configId: "model",
      current: "default",
      options: [
        { id: "default", name: "Default (recommended)", description: "Opus 5.5" },
        { id: "sonnet", name: "Sonnet", description: "Sonnet 5.5 for everyday tasks" },
      ],
    })
    expect(modelName(m!)).toBe("Opus 5.5")
    expect(modelName({ ...m!, current: "sonnet" })).toBe("Sonnet")
    // Grouped values flatten; a session with no model option has none.
    const grouped = modelOf({
      configOptions: [
        {
          id: "m",
          category: "model",
          type: "select",
          currentValue: "a",
          options: [{ group: "g", options: [{ value: "a", name: "A" }] }],
        },
      ],
    })
    expect(grouped?.options.map((o) => o.id)).toEqual(["a"])
    expect(modelOf({ sessionId: "s" })).toBeNull()
    expect(mapUpdate({ sessionUpdate: "config_option_update", configOptions: session.configOptions })).toEqual([
      { type: "model", model: m },
    ])
  })
})

describe("composer state", () => {
  it("keeps the harness choice and the bridge address, never a secret", () => {
    expect(loadAgentConfig()).toEqual({ bridgeUrl: "ws://127.0.0.1:8790", harness: "", command: "", auto: false })
    saveAgentConfig({ bridgeUrl: "ws://127.0.0.1:9000", harness: "custom", command: "omp --mode acp", auto: true })
    expect(loadAgentConfig()).toEqual({
      bridgeUrl: "ws://127.0.0.1:9000",
      harness: "custom",
      command: "omp --mode acp",
      auto: true,
    })
    expect(Object.keys(JSON.parse(localStorage.getItem("dither-agent-config") ?? "{}"))).toEqual([
      "bridgeUrl",
      "harness",
      "command",
      "auto",
    ])
  })

  it("keeps each project's unsent message, and forgets an empty one", () => {
    saveDraft("p1", "a sign-in screen")
    saveDraft("p2", "a table")
    expect(loadDraft("p1")).toBe("a sign-in screen")
    expect(loadDraft("p2")).toBe("a table")
    saveDraft("p1", "  ")
    expect(loadDraft("p1")).toBe("")
    expect(localStorage.getItem("dither-agent-draft-p1")).toBeNull()
  })
})
