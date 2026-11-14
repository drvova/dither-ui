import { createMemo, createSignal, onCleanup } from "solid-js"
import { type AcpClient, type AcpPermissionRequest, connectAcp, NoBridge } from "@/features/agent/acp"
import type { Built } from "@/features/agent/dither"
import type { AgentConfig, AgentEvent } from "@/features/agent/tools"
import {
  CLOSED,
  clientOf,
  type Connection,
  connected,
  connecting,
  failed,
  heard,
  helloOf,
  lost,
  type Setup,
  setupOf,
  withSetup,
} from "./model/session"
import type { Entry } from "./model/thread"

// The panel's bridge: found, opened and closed, as one `Connection`
// (`model/session.ts`). When none answers, the chat shows how to start it
// while this looks again every few seconds, for a while, until one answers.
export type BridgeHooks = {
  config: AgentConfig
  onEvent: (e: AgentEvent) => void
  permission: (req: AcpPermissionRequest) => Promise<string | null>
  approveTool: (tool: Built) => Promise<boolean>
  /** A line for the thread (the bridge found, closed, an error). */
  say: (entry: Entry) => void
  /** The setup card came up: keep it in view. */
  onLooking: () => void
  /** A look found the bridge. */
  onFound: () => void
  /** The bridge runs no harness (any more): the harness's state goes. */
  onBare: () => void
}

const LOOK_EVERY = 2500
const LOOK_FOR = 5 * 60_000

export function createBridge(h: BridgeHooks) {
  const [conn, setConn] = createSignal<Connection<AcpClient>>(CLOSED)
  const acp = () => clientOf(conn())
  const hello = () => helloOf(conn())
  const harnesses = createMemo(() => hello()?.harnesses ?? [])
  const agent = createMemo(() => hello()?.agent ?? null)
  /** Who answers, as a person reads it: a harness picked from the bridge's
   * list goes by that name (Claude Code, not its adapter's package), any
   * other command by the name it introduced itself with. */
  const [agentName, setAgentName] = createSignal("")
  const nameIt = () =>
    setAgentName(
      (agent() && harnesses().find((x) => x.id === agent()?.id)?.name) || acp()?.agent || agent()?.name || "",
    )
  const system = (text: string) => h.say({ kind: "system", text })

  let lookTimer: ReturnType<typeof setInterval> | undefined
  function stopLooking(next: Setup) {
    clearInterval(lookTimer)
    lookTimer = undefined
    setConn(withSetup(conn(), next))
  }
  function lookForBridge() {
    setConn(withSetup(conn(), "looking"))
    h.onLooking()
    clearInterval(lookTimer)
    const until = Date.now() + LOOK_FOR
    lookTimer = setInterval(async () => {
      if (acp()) return stopLooking("none")
      if (Date.now() > until) return stopLooking("stopped")
      if (await connect(h.config.bridgeUrl, true)) {
        stopLooking("none")
        system("bridge connected")
        h.onFound()
      }
    }, LOOK_EVERY)
  }
  onCleanup(() => clearInterval(lookTimer))

  /** Open the bridge at `url`. When none answers, the setup shows and the
   * panel keeps looking; a `quiet` try (one of those looks) says nothing. */
  async function connect(url = h.config.bridgeUrl, quiet = false): Promise<AcpClient | null> {
    const open = acp()
    if (open) return open
    if (conn().kind === "connecting") return null
    setConn(connecting(conn()))
    h.config.bridgeUrl = url
    try {
      const client = await connectAcp({
        url,
        onEvent: h.onEvent,
        permission: h.permission,
        approveTool: h.approveTool,
        onHello: (said) => {
          setConn(heard(conn(), said))
          if (!said.agent) h.onBare()
          nameIt()
        },
        onClose: () => {
          if (acp()) system("bridge closed")
          setConn(lost(conn()))
        },
      })
      // The client resolves once the bridge has said hello.
      const said = hello() ?? client.hello
      if (!said) throw new Error("the bridge opened without a hello")
      clearInterval(lookTimer)
      lookTimer = undefined
      setConn(connected(client, said))
      nameIt()
      return client
    } catch (e) {
      setConn(failed(conn()))
      if (e instanceof NoBridge) {
        if (!quiet && setupOf(conn()) !== "looking") lookForBridge()
      } else if (!quiet) h.say({ kind: "error", text: e instanceof Error ? e.message : String(e) })
      return null
    }
  }

  function disconnect() {
    acp()?.close()
    setConn(lost(conn()))
  }

  return { conn, acp, hello, harnesses, agent, agentName, nameIt, connect, lookForBridge, disconnect }
}
