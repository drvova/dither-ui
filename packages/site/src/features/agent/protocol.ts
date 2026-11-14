// The Studio agent protocol: one command vocabulary, three doors.
//
//   1. `window.ditherStudio.run(command)` — for code in the page's main
//      world (the agent panel, devtools, debugger-driven harnesses).
//   2. DOM events — for code in ANY world, including browser-extension
//      agents whose scripts cannot see page globals (sitegeist's
//      `browserjs()` runs in Chrome's USER_SCRIPT world): dispatch
//      `dither-studio:command` on `document` with a JSON STRING detail
//      `{ id, command }`; the page answers with `dither-studio:result`
//      carrying `{ id, ok, data | error }` as a JSON string. Strings cross
//      worlds; objects do not.
//   3. The document mirror — a `<script type="application/json"
//      id="dither-studio-document">` in <head> holding the live document,
//      refreshed on the autosave cadence, readable from any world.
//
// Every command is untrusted input, parsed once by its row of the command
// table (`commands.ts`), which `runCommand` runs.
import { directedTime, isDirected, release, seek } from "@dither-ui/kit"
import { documentSnapshot, editor, type StudioDocument, watch } from "../../entities/editor"
import { type CommandResult, PROTOCOL_VERSION, registrySchema, runCommand } from "./commands"
import { isPlain } from "./fields"

export const COMMAND_EVENT = "dither-studio:command"
export const RESULT_EVENT = "dither-studio:result"
export const MIRROR_ID = "dither-studio-document"

/** The kit clock as any driver sees it: seconds in, a held moment out. */
type StudioClockApi = {
  seek: (seconds: number) => void
  release: () => void
  directed: () => boolean
  /** The held moment in seconds, null while time runs. */
  time: () => number | null
}

const clockApi = (): StudioClockApi => ({
  seek: (seconds) => seek(Math.max(0, Number(seconds) || 0) * 1000),
  release,
  directed: isDirected,
  time: () => {
    const ms = directedTime()
    return ms === null ? null : ms / 1000
  },
})

type StudioAgentApi = {
  version: number
  run: (command: unknown) => CommandResult
  registry: () => ReturnType<typeof registrySchema>
  document: () => StudioDocument
  clock: StudioClockApi
}

declare global {
  interface Window {
    ditherStudio?: StudioAgentApi
  }
}

/** Open the three doors on the mounted studio. Returns the closer. */
export function installStudioAgentApi(): () => void {
  const onCommand = (e: Event) => {
    const raw = (e as CustomEvent).detail
    let msg: Record<string, unknown>
    try {
      const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : raw
      msg = isPlain(parsed) ? parsed : {}
    } catch {
      msg = {}
    }
    const command = isPlain(msg.command) ? msg.command : msg
    const result = runCommand(command)
    document.dispatchEvent(new CustomEvent(RESULT_EVENT, { detail: JSON.stringify({ id: msg.id ?? null, ...result }) }))
  }
  document.addEventListener(COMMAND_EVENT, onCommand)

  let mirror = document.getElementById(MIRROR_ID) as HTMLScriptElement | null
  if (!mirror) {
    mirror = document.createElement("script")
    mirror.type = "application/json"
    mirror.id = MIRROR_ID
    document.head.appendChild(mirror)
  }
  mirror.dataset.version = String(PROTOCOL_VERSION)
  const refresh = () => {
    mirror!.textContent = JSON.stringify(documentSnapshot())
  }
  refresh()
  let timer: ReturnType<typeof setTimeout> | undefined
  const stop = watch(
    () => [editor.artboards, editor.groups],
    () => {
      clearTimeout(timer)
      timer = setTimeout(refresh, 400)
    },
    { deep: true },
  )

  window.ditherStudio = {
    version: PROTOCOL_VERSION,
    run: runCommand,
    registry: registrySchema,
    document: documentSnapshot,
    clock: clockApi(),
  }

  return () => {
    stop()
    clearTimeout(timer)
    document.removeEventListener(COMMAND_EVENT, onCommand)
    mirror?.remove()
    delete window.ditherStudio
  }
}
