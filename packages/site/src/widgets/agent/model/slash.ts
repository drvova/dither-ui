// The composer's slash commands: the panel's own, then whatever the harness
// advertises (sent to it as text), what a picked command still takes, and
// a /word that is no command at all.
import type { AgentCommand } from "@/features/agent/tools"

export type Slash = { name: string; args?: string; desc: string; harness?: boolean }
export const OURS: Slash[] = [
  { name: "help", desc: "list commands" },
  { name: "harness", args: "<id | command>", desc: "start a harness: claude, codex, gemini, omp… or any ACP command" },
  { name: "connect", args: "[ws url]", desc: "connect the bridge" },
  { name: "new", desc: "fresh session (clears the transcript)" },
  { name: "mode", args: "<id>", desc: "switch the harness's mode" },
  { name: "auto", args: "on | off", desc: "answer permission prompts with their allow option" },
  { name: "evolve", args: "[count]", desc: "seeded variants of the selection" },
  { name: "select", args: "<name>", desc: "select a frame by name" },
  { name: "code", desc: "the selection as a Solid component" },
  { name: "copy", desc: "copy the last reply" },
  { name: "session", desc: "harness, tokens, frames" },
  { name: "undo", desc: "undo the last edit" },
  { name: "clear", desc: "clear the transcript" },
  { name: "stop", desc: "interrupt the run" },
  { name: "disconnect", desc: "close the bridge" },
]

/** Ours plus the harness's (one it names like ours stays ours). */
export const slashList = (commands: readonly AgentCommand[]): Slash[] => [
  ...OURS,
  ...commands
    .filter((c) => !OURS.some((o) => o.name === c.name))
    .map((c) => ({ name: c.name, args: c.input, desc: c.description, harness: true })),
]

/** A command picked (its name and a space typed) that takes something:
 * what it takes, in words. Empty otherwise. */
export function hintOf(input: string, all: readonly Slash[]): string {
  const m = /^\/([\w-]+) $/.exec(input)
  const c = m && all.find((x) => x.name === m[1])
  return c?.args ? `/${c.name} ${c.args}` : ""
}

/** The name of a /word that is no command here, or null (not a /word, or a
 * command). */
export function unknownOf(text: string, all: readonly Slash[]): string | null {
  const name = /^\/([a-z][\w-]*)(?:\s|$)/i.exec(text)?.[1]
  return name && !all.some((c) => c.name === name) ? name : null
}
