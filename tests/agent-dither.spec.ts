// @rstest-environment jsdom
// The Studio as one tool: a harness finds the action that fits its job (and
// the kit components that do), runs it, or builds one when none fits; a
// built tool is kept, found first next time, and runs only once the user
// says so.
import { beforeEach, describe, expect, it } from "rstack/test"
import {
  built,
  callDither,
  type DitherDeps,
  type DitherStep,
  ditherDef,
  findFor,
  GOOD_FIT,
  parseDither,
  removeBuilt,
  wordsOf,
} from "@/features/agent/dither"
import { STUDIO_TOOLS } from "@/features/agent/tools"

const ok = (data: unknown) => ({ ok: true as const, data })

function deps(over: Partial<DitherDeps> = {}) {
  const steps: DitherStep[] = []
  const commands: unknown[] = []
  const d: DitherDeps = {
    run: (c) => (commands.push(c), ok({ id: "f1", name: "Sign in" })),
    approve: async () => true,
    sandbox: async (_code, args, call) => ok({ ran: await call("add_screen", { name: String(args.title) }) }),
    onStep: (s) => steps.push(s),
    ...over,
  }
  return { d, steps, commands }
}

beforeEach(() => {
  localStorage.clear()
  built.list = []
})

describe("the one tool", () => {
  it("is one short definition naming every action, in place of every action's schema", () => {
    const def = ditherDef()
    for (const { def: t } of STUDIO_TOOLS) expect(def.description).toContain(t.name)
    const all = JSON.stringify(STUDIO_TOOLS.map((t) => t.def)).length
    expect(JSON.stringify(def).length).toBeLessThan(all / 3)
  })

  it("reads its input once into find, run or build, and says what it takes otherwise", () => {
    expect(parseDither({ find: " a sign-in screen " })).toEqual({ kind: "find", job: "a sign-in screen" })
    expect(parseDither({ run: "add_screen" })).toEqual({ kind: "run", action: "add_screen", args: {} })
    expect(parseDither({ build: { name: "Bad Name", description: "x", code: "return 1" } })).toMatchObject({
      error: expect.stringContaining("name"),
    })
    expect(parseDither({ build: { name: "add_screen", description: "x", code: "return 1" } })).toMatchObject({
      error: expect.stringContaining("already"),
    })
    expect(parseDither(null)).toMatchObject({ error: expect.any(String) })
  })
})

describe("finding what fits", () => {
  it("maps a person's words to the schema's", () => {
    expect(wordsOf("Make a login page with a graph")).toEqual(["add", "login", "screen", "chart"])
  })

  it("puts the action that fits the job first, with its exact arguments, and the components it names", () => {
    const found = findFor("a sign-in screen with an email field and a slider")
    expect(found.actions[0].name).toBe("add_screen")
    expect(found.actions[0].args).toEqual(STUDIO_TOOLS.find((t) => t.def.name === "add_screen")?.def.parameters)
    expect(found.actions.length).toBeLessThanOrEqual(3)
    expect(found.components.map((c) => c.is)).toContain("DitherSlider")
    expect(findFor("export it as a film").actions[0].name).toBe("export_video")
  })

  it("says to build a tool when nothing fits the job well", () => {
    const found = findFor("translate the copy into japanese")
    expect(found.fit).toBeLessThan(GOOD_FIT)
    expect(found.next).toContain("build")
  })
})

describe("running and building", () => {
  it("runs an action through the Studio protocol and shows it as its own step", async () => {
    const { d, steps, commands } = deps()
    const r = await callDither({ run: "add_screen", args: { name: "Sign in" } }, d)
    expect(r).toEqual(ok({ id: "f1", name: "Sign in" }))
    expect(commands).toEqual([{ name: "Sign in", type: "screen.add" }])
    expect(steps.map((s) => s.name)).toEqual(["add_screen"])
  })

  it("answers a failed run with what the action takes", async () => {
    const { d } = deps({ run: () => ({ ok: false, error: "rows required" }) })
    const r = await callDither({ run: "add_screen", args: {} }, d)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/^rows required\. add_screen takes \{/)
  })

  it("keeps a built tool, finds it first next time, and runs it only once the user says so", async () => {
    const tool = {
      name: "sign_in_flow",
      description: "a sign-in screen with a forgot password link and a remember me checkbox",
      code: "return await studio.run('add_screen', { name: args.title })",
    }
    const { d, steps } = deps()
    expect(await callDither({ build: tool }, d)).toMatchObject({ ok: true })
    expect(JSON.parse(localStorage.getItem("dither-agent-built") ?? "[]")[0].name).toBe("sign_in_flow")
    expect(findFor("sign-in screen with a forgot password link").actions[0]).toMatchObject({
      name: "sign_in_flow",
      built: true,
    })
    expect(ditherDef().description).toContain("sign_in_flow")

    // Asked, and refused: nothing runs.
    let asked = 0
    const refused = deps({ approve: async () => (asked++, false) })
    expect(await callDither({ run: "sign_in_flow", args: { title: "Hi" } }, refused.d)).toEqual({
      ok: false,
      error: "the user did not let it run",
    })
    expect(asked).toBe(1)
    expect(refused.commands).toEqual([])

    // Allowed: its own Studio calls are steps, then the tool's.
    const r = await callDither({ run: "sign_in_flow", args: { title: "Hi" } }, d)
    expect(r.ok).toBe(true)
    expect(steps.map((s) => [s.name, !!s.built])).toEqual([
      ["build", false],
      ["add_screen", false],
      ["sign_in_flow", true],
    ])
    removeBuilt("sign_in_flow")
    expect(built.list).toEqual([])
  })

  it("lets a built tool reach the Studio's actions only", async () => {
    const { d } = deps({ sandbox: async (_c, _a, call) => call("rm -rf", {}) })
    await callDither({ build: { name: "sneaky", description: "x", code: "" } }, d).catch(() => {})
    built.list = [{ name: "sneaky", description: "x", parameters: {}, code: "x", at: 1 }]
    expect(await callDither({ run: "sneaky" }, d)).toEqual({ ok: false, error: "no action rm -rf" })
  })
})
