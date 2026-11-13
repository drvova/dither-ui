import { onCleanup, onMount, Show } from "solid-js"
import { ETHICALADS_PUBLISHER } from "@/shared/config/ads"
import "./AdSlot.css"

/** One EthicalAds text unit, dressed in the house tokens. Renders nothing
 * without a publisher slug, so the layout never shows a broken box. */
const SCRIPT_ID = "ethicalads-client"
const SCRIPT_SRC = "https://media.ethicalads.io/media/client/ethicalads.min.js"

declare global {
  interface Window {
    ethicalads?: { load: () => void }
  }
}

/** The slug as the config may come to hold it (it is empty until a publisher signs up). */
const PUBLISHER: string = ETHICALADS_PUBLISHER

export default function AdSlot() {
  let root: HTMLDivElement | undefined
  let scheduled = false
  let io: IntersectionObserver | null = null

  function start() {
    if (window.ethicalads) {
      window.ethicalads.load()
      return
    }
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script")
      s.id = SCRIPT_ID
      s.src = SCRIPT_SRC
      s.async = true
      s.onload = () => window.ethicalads?.load()
      document.head.appendChild(s)
    }
  }

  /** Eligible: load the library once the document has finished loading plus a
   * beat, so its work (measured: ~440 rAF/s the moment it evaluates) lands
   * clear of first paint, LCP and the mount tasks. */
  function schedule() {
    if (scheduled) return
    scheduled = true
    const go = () => setTimeout(start, 1500)
    if (document.readyState === "complete") go()
    else window.addEventListener("load", go, { once: true })
  }

  onMount(() => {
    if (!PUBLISHER) return
    // Gate on the slot actually approaching the viewport: the aside is
    // display:none under lg, so phones never pay for the ad at all. The gate is
    // IntersectionObserver on purpose — Safari has no requestIdleCallback —
    // and an 8s-after-load safety net means a missed observation can never
    // strand the unit. The guard on `started` keeps both paths single-fire.
    if (typeof IntersectionObserver !== "undefined" && root) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io?.disconnect()
            io = null
            schedule()
          }
        },
        { rootMargin: "300px" },
      )
      io.observe(root)
      window.addEventListener(
        "load",
        () =>
          setTimeout(() => {
            if (io) {
              io.disconnect()
              io = null
              schedule()
            }
          }, 8000),
        { once: true },
      )
      onCleanup(() => {
        io?.disconnect()
        io = null
      })
    } else {
      schedule()
    }
  })

  return (
    <Show when={PUBLISHER}>
      <div ref={(el) => (root = el)} class="ad-slot-scope ad-slot mt-8">
        <div data-ea-publisher={PUBLISHER} data-ea-type="text" data-ea-style="adbox" />
        <p class="mt-1.5 text-[11px] text-muted-foreground">Ethical ad</p>
      </div>
    </Show>
  )
}
