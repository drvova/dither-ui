import { type Accessor, createMemo, createSignal } from "solid-js"
import { unwrap } from "solid-js/store"
import type { AcpPermissionRequest } from "@/features/agent/acp"
import type { Built } from "@/features/agent/dither"
import type { AgentConfig } from "@/features/agent/tools"
import { askTitle } from "./model/steps"
import type { Entry } from "./model/thread"

// The panel's permission prompts: each asked as an entry of the thread and
// answered on its own row (two at once each on theirs), Auto answering a
// harness's with its allow option, never a built tool's.
type Approval = Extract<Entry, { kind: "approval" }>
type Option = Approval["options"][number]

export type ApprovalHooks = {
  config: AgentConfig
  /** The thread's store: a prompt is its newest entry once asked. */
  thread: { entries: Entry[] }
  push: (entry: Entry) => void
  agentName: Accessor<string>
  refocus: () => void
}

export function createApprovals(h: ApprovalHooks) {
  /** Every open permission prompt and how it is settled, keyed by its own
   * transcript entry: two prompts at once are each answered on their row. */
  const pending = new Map<Approval, (id: string | null) => void>()
  /** How many of them wait (the map itself tells nothing when it changes). */
  const [waiting, setWaiting] = createSignal(0)
  /** When the newest permission prompt came up: a digit typed under your
   * typing waits for a pause (`answerKey`). */
  let askedAt = 0

  function ask(title: string, options: Option[], code?: string): Promise<string | null> {
    askedAt = Date.now()
    h.push({ kind: "approval", title, options, answered: null, ...(code ? { code } : {}) })
    const entry = h.thread.entries[h.thread.entries.length - 1] as Approval
    return new Promise((resolve) => {
      pending.set(unwrap(entry), (id) => {
        entry.answered = id ?? "cancelled"
        pending.delete(unwrap(entry))
        setWaiting(pending.size)
        resolve(id)
      })
      setWaiting(pending.size)
    })
  }

  /** A tool the harness built runs only when you say so, every time: its
   * code is on the prompt, and Auto never answers it. */
  const approveTool = async (tool: Built): Promise<boolean> =>
    (await ask(
      `Run ${tool.name.replace(/_/g, " ")}, a tool ${h.agentName() || "your harness"} built`,
      [
        { id: "run", label: "Run it", primary: true },
        { id: "no", label: "Don't run" },
      ],
      tool.code,
    )) === "run"

  const askPermission = async (req: AcpPermissionRequest): Promise<string | null> => {
    const options = req.options.map((o) => ({
      id: o.optionId,
      label: o.name,
      primary: o.kind.startsWith("allow"),
      reject: o.kind.startsWith("reject"),
    }))
    if (h.config.auto) return options.find((o) => o.primary)?.id ?? options[0]?.id ?? null
    return ask(
      askTitle(req.title, (req.raw as { toolCall?: { rawInput?: unknown } } | null)?.toolCall?.rawInput),
      options.length
        ? options
        : [
            { id: "allow", label: "allow", primary: true },
            { id: "reject", label: "reject", reject: true },
          ],
    )
  }

  /** The newest permission prompt still waiting for its answer. */
  const openApproval = createMemo(() => {
    for (let i = h.thread.entries.length - 1; i >= 0; i--) {
      const e = h.thread.entries[i]
      if (e.kind === "approval" && e.answered === null) return e
    }
    return null
  })

  function answer(entry: Approval, id: string | null) {
    pending.get(unwrap(entry))?.(id)
    h.refocus()
  }
  /** A stop: every prompt that waits is settled unanswered. */
  function cancelAll() {
    for (const settle of [...pending.values()]) settle(null)
  }

  return { waiting, askedAt: () => askedAt, openApproval, approveTool, askPermission, answer, cancelAll }
}
