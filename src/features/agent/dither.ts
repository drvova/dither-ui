// The Studio as ONE tool for a harness: `dither`. Instead of every action's
// schema on every turn, a harness describes the job (`find`) and gets back
// only the actions that fit it, with their exact arguments, and the kit
// components that fit; it runs one (`run`); and when none fits the job
// well, it builds one that does (`build`): JavaScript that runs in the
// sandbox (`sandbox.ts`), calls the Studio's own actions, is kept, and is
// found first the next time. Every run of a built tool waits for the user.
import { reactive } from "vue"
import { readJson, writeJson } from "@/shared/lib/storage"
import { type CommandResult, registrySchema } from "./protocol"
import { callStudioTool, finishStudioTool, STUDIO_TOOLS, type ToolDef } from "./tools"

/** The tool's name, as the harness calls it (`mcp__dither-studio__dither`). */
export const DITHER_TOOL = "dither"

/** A tool a harness built: what it is for, its arguments, its code (the
 * body of an async function of `(args, studio)`). */
export type Built = {
  name: string
  description: string
  parameters: Record<string, unknown>
  code: string
  at: number
}

/** One call of the tool, parsed where it enters. */
export type DitherCall =
  | { kind: "find"; job: string }
  | { kind: "run"; action: string; args: Record<string, unknown> }
  | { kind: "build"; tool: Built }

/** What the composer is told: each action the tool ran, as a step. */
export type DitherStep = {
  name: string
  args: Record<string, unknown>
  result: CommandResult
  /** A tool a harness built, run as one step (its own calls are steps too). */
  built?: boolean
}

const ok = (data: unknown): CommandResult => ({ ok: true, data })
const fail = (error: string): CommandResult => ({ ok: false, error })
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)

/* ------------------------------ built tools ------------------------------ */

const BUILT_KEY = "dither-agent-built"
const NAME = /^[a-z][a-z0-9_]{2,39}$/
const CODE_MAX = 20_000

function parseBuilt(v: unknown): Built | string {
  if (!isObject(v)) return "build takes { name, description, parameters, code }"
  const { name, description, parameters, code } = v
  if (typeof name !== "string" || !NAME.test(name)) return "name: 3 to 40 of a-z, 0-9 and _, starting with a letter"
  if (STUDIO_TOOLS.some((t) => t.def.name === name) || name === "find" || name === "build")
    return `${name} is a Studio action already: run it`
  if (typeof description !== "string" || !description.trim()) return "description: what the tool is for"
  if (typeof code !== "string" || !code.trim()) return "code: the body of an async function of (args, studio)"
  if (code.length > CODE_MAX) return `code: at most ${CODE_MAX} characters`
  const params = isObject(parameters) ? parameters : { type: "object", properties: {} }
  const at = typeof v.at === "number" ? v.at : Date.now()
  return { name, description: description.trim(), parameters: params, code, at }
}

/** The tools harnesses built, newest first, kept across visits. */
export const built = reactive({
  list: (() => {
    const kept = readJson(BUILT_KEY)
    return Array.isArray(kept) ? kept.map(parseBuilt).filter((b): b is Built => typeof b !== "string") : []
  })(),
})
const keepBuilt = () => writeJson(BUILT_KEY, built.list)

export function removeBuilt(name: string): void {
  built.list = built.list.filter((b) => b.name !== name)
  keepBuilt()
}

/* --------------------------------- parse --------------------------------- */

/** The tool's input, untrusted, into one call or the reason it is none. */
export function parseDither(input: unknown): DitherCall | { error: string } {
  if (!isObject(input)) return { error: "dither takes { find } or { run, args } or { build }" }
  if (typeof input.find === "string" && input.find.trim()) return { kind: "find", job: input.find.trim() }
  if (typeof input.run === "string" && input.run.trim())
    return { kind: "run", action: input.run.trim(), args: isObject(input.args) ? input.args : {} }
  if (input.build !== undefined) {
    const tool = parseBuilt(input.build)
    return typeof tool === "string" ? { error: tool } : { kind: "build", tool }
  }
  return { error: "dither takes { find: <the job in words> }, { run: <action>, args }, or { build: { ... } }" }
}

/* ---------------------------------- find --------------------------------- */

const STOP = new Set(
  "a an the to of for with and or on in into as at by it its this that be is are my me i we you".split(" "),
)
/** Words a person and a schema use for the same thing. */
const SAME: Record<string, string> = {
  page: "screen",
  form: "screen",
  view: "screen",
  layout: "screen",
  graph: "chart",
  plot: "chart",
  film: "video",
  movie: "video",
  mp4: "video",
  clip: "reel",
  delete: "remove",
  erase: "remove",
  change: "update",
  edit: "update",
  move: "update",
  rename: "update",
  resize: "update",
  create: "add",
  make: "add",
  new: "add",
  place: "add",
  put: "add",
  insert: "add",
  frame: "artboard",
  frames: "artboard",
  variant: "evolve",
  variants: "evolve",
  variation: "evolve",
  component: "component",
  components: "component",
  source: "code",
  vue: "code",
  export: "export",
  read: "get",
  show: "get",
  see: "get",
  look: "get",
}
const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w)

/** The words that count in a text: lower case, no small words, stemmed,
 * with a person's word for a thing mapped to the schema's. Pure. */
export function wordsOf(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map((w) => SAME[w] ?? stem(w))
}

type Action = { name: string; description: string; parameters: Record<string, unknown>; built: boolean }
const actions = (): Action[] => [
  ...built.list.map((b) => ({ ...b, built: true })),
  ...STUDIO_TOOLS.map(({ def }) => ({ ...def, built: false })),
]

/** How well an action fits a job: of the job's words any action speaks of
 * (the rest are content: a field's label, a language), the share it
 * answers, its name counting over its description; 0 to 1. */
function fitOf(job: string[], a: Action, known: Set<string>): number {
  const asked = job.filter((w) => known.has(w))
  if (!asked.length) return 0
  const name = new Set(wordsOf(a.name))
  const said = new Set(wordsOf(a.description))
  let score = 0
  for (const w of asked) score += name.has(w) ? 1 : said.has(w) ? 0.5 : 0
  return Math.min(1, score / asked.length + (a.built ? 0.05 : 0))
}

/** Below this, find says to build a tool for the job. */
export const GOOD_FIT = 0.5

/** The actions that fit a job best (with their exact arguments), the kit
 * components whose names it mentions, and how well the best one fits. */
export function findFor(job: string) {
  const words = wordsOf(job)
  const all = actions()
  const known = new Set(all.flatMap((a) => [...wordsOf(a.name), ...wordsOf(a.description)]))
  const ranked = all
    .map((a) => ({ a, fit: fitOf(words, a, known) }))
    .filter((x) => x.fit > 0)
    .sort((x, y) => y.fit - x.fit)
    .slice(0, 3)
  const wanted = new Set(words)
  const components = registrySchema()
    .components.map((c) => ({ c, hits: wordsOf(`${c.label} ${c.is} ${c.group}`).filter((w) => wanted.has(w)).length }))
    .filter((x) => x.hits > 0)
    .sort((x, y) => y.hits - x.hits)
    .slice(0, 6)
    .map(({ c }) => ({ is: c.is, label: c.label, group: c.group }))
  const best = ranked[0]?.fit ?? 0
  return {
    actions: ranked.map(({ a, fit }) => ({
      name: a.name,
      description: a.description,
      args: a.parameters,
      fit: Math.round(fit * 100) / 100,
      ...(a.built ? { built: true } : {}),
    })),
    components,
    fit: Math.round(best * 100) / 100,
    ...(best < GOOD_FIT
      ? {
          next: "No action fits this job well. Build one that does with { build: { name, description, parameters, code } }.",
        }
      : {}),
  }
}

/* --------------------------------- the tool ------------------------------ */

/** The one definition a harness reads: short, with every action's name so
 * an obvious one needs no `find`. */
export function ditherDef(): ToolDef {
  const names = actions()
    .map((a) => a.name)
    .join(", ")
  return {
    name: DITHER_TOOL,
    description:
      'The dither-ui Studio in one tool. Describe the job with { find: "<the job in words>" } to get the actions that fit it best, each with its exact arguments, and the kit components that fit; then { run: "<action>", args: { ... } }. ' +
      `Actions: ${names}. ` +
      'When no action fits the job well (find says how well), build one that does: { build: { name, description, parameters, code } }, where parameters is a JSON schema and code is the body of an async JavaScript function of (args, studio); `await studio.run("<action>", args)` calls a Studio action and returns { ok, data } or { ok, error }, and what the code returns is the tool\'s answer. ' +
      "It runs in a sandbox (no page, no network, 10 seconds), the user approves each run, and it is kept and found first next time: run it like any action.",
    parameters: {
      type: "object",
      properties: {
        find: { type: "string", description: "the job in words" },
        run: { type: "string", description: "an action's name" },
        args: { type: "object", description: "the action's arguments" },
        build: {
          type: "object",
          properties: {
            name: { type: "string", description: "snake_case, 3 to 40 characters" },
            description: { type: "string", description: "what the tool is for, in words find can match" },
            parameters: { type: "object", description: "JSON schema of its arguments" },
            code: { type: "string", description: "body of an async function of (args, studio)" },
          },
          required: ["name", "description", "code"],
        },
      },
    },
  }
}

export type DitherDeps = {
  /** The Studio protocol (a test passes its own). */
  run: (command: unknown) => CommandResult
  /** Asks the user before a built tool runs; never answered for them. */
  approve: (tool: Built, args: Record<string, unknown>) => Promise<boolean>
  /** Runs a built tool's code where it cannot reach the page. */
  sandbox: (
    code: string,
    args: Record<string, unknown>,
    call: (action: string, args: Record<string, unknown>) => Promise<CommandResult>,
  ) => Promise<CommandResult>
  /** Each action that ran, for the thread. */
  onStep: (step: DitherStep) => void
}

async function runAction(action: string, args: Record<string, unknown>, deps: DitherDeps): Promise<CommandResult> {
  if (!STUDIO_TOOLS.some((t) => t.def.name === action)) return fail(`no action ${action}`)
  const result = await finishStudioTool(action, callStudioTool(action, args, deps.run))
  deps.onStep({ name: action, args, result })
  if (result.ok) return result
  // A failed call answers with what the action takes, to try again right.
  const def = STUDIO_TOOLS.find((t) => t.def.name === action)?.def
  return fail(`${result.error}. ${action} takes ${JSON.stringify(def?.parameters ?? {})}`)
}

/** One call of the `dither` tool, from the harness's raw input. */
export async function callDither(input: unknown, deps: DitherDeps): Promise<CommandResult> {
  const call = parseDither(input)
  if ("error" in call) return fail(call.error)
  if (call.kind === "find") {
    const found = findFor(call.job)
    deps.onStep({ name: "find", args: { job: call.job }, result: ok(found) })
    return ok(found)
  }
  if (call.kind === "build") {
    built.list = [call.tool, ...built.list.filter((b) => b.name !== call.tool.name)]
    keepBuilt()
    const result = ok({ built: call.tool.name, next: `Run it with { run: "${call.tool.name}", args }.` })
    deps.onStep({ name: "build", args: { name: call.tool.name }, result })
    return result
  }
  const tool = built.list.find((b) => b.name === call.action)
  if (!tool) {
    if (STUDIO_TOOLS.some((t) => t.def.name === call.action)) return runAction(call.action, call.args, deps)
    return fail(
      `no action ${call.action}. Actions: ${actions()
        .map((a) => a.name)
        .join(", ")}`,
    )
  }
  if (!(await deps.approve(tool, call.args))) {
    const result = fail("the user did not let it run")
    deps.onStep({ name: tool.name, args: call.args, result, built: true })
    return result
  }
  // Its calls reach the Studio's own actions only, each a step of its own.
  const result = await deps.sandbox(tool.code, call.args, (action, args) => runAction(action, args, deps))
  deps.onStep({ name: tool.name, args: call.args, result, built: true })
  return result
}
