// What the chat shows when no bridge answers: the one line that starts it,
// to copy, and the panel looking for it until it does (or a while passes).
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"
import { copyText, DitherIcon } from "@dither-ui/kit"
import { BRIDGE_FILE, bridgeCommand } from "@/features/agent/acp"
import { assetPath } from "@/shared/lib/routes"
import Mascot from "@/shared/ui/Mascot"
import "./BridgeSetup.css"

type BridgeSetupProps = { looking: boolean; url: string; onLook?: () => void }

export default function BridgeSetup(props: BridgeSetupProps) {
  // The page's own address is read once it is a page (never on a server).
  const [page, setPage] = createSignal<Location | null>(null)
  onMount(() => setPage(location))
  const command = createMemo(() => {
    const at = page()
    return at ? bridgeCommand(new URL(at.href), new URL(assetPath(BRIDGE_FILE), at.origin), props.url) : ""
  })
  const [copied, setCopied] = createSignal(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  async function copy() {
    if (!(await copyText(command()))) return
    setCopied(true)
    clearTimeout(timer)
    timer = setTimeout(() => setCopied(false), 1600)
  }
  onCleanup(() => clearTimeout(timer))

  return (
    <section class="bridge-setup-scope setup" aria-labelledby="bridge-setup-title">
      <div class="setup-head">
        <Mascot size={26} alive class="setup-mascot" />
        <h3 id="bridge-setup-title" class="setup-title">
          Start the bridge
        </h3>
      </div>
      <p class="setup-note">
        Your harness runs on your machine, signed in as you. The bridge connects it to this tab. Run this in the folder
        it should work in:
      </p>
      <div class="setup-line">
        <code class="setup-cmd">{command()}</code>
        <button
          type="button"
          class="setup-copy"
          aria-label={copied() ? "Copied" : "Copy the command"}
          title={copied() ? "Copied" : "Copy the command"}
          onClick={copy}
        >
          <DitherIcon name={copied() ? "Check" : "Copy"} size={13} strokeWidth={1.5} />
        </button>
      </div>
      <p class="setup-status" role="status">
        <Show
          when={props.looking}
          fallback={
            <>
              Stopped looking.{" "}
              <button type="button" class="setup-again" onClick={() => props.onLook?.()}>
                Look again
              </button>
            </>
          }
        >
          <span class="spin" aria-hidden="true"></span>Looking for it at {props.url}
        </Show>
      </p>
      <p class="setup-note">
        Working in a clone of dither-ui? <code>node bridge/dither-bridge.mjs</code> runs the same bridge.
      </p>
    </section>
  )
}
