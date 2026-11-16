// The close's print of heat (`HeatPrint`, the footer's own ramp): it drifts
// as its band arrives, then only under the hand over the band. An island of
// the landing; the band and the install it frames are the page's bytes.
import { onCleanup, onMount } from "solid-js"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"
import { CLOSE } from "@/pages/landing/heat"
import HeatPrint from "./HeatPrint"
import { useDrive } from "./drive"

export default function CloseHeat() {
  const heat = useDrive()
  let at: HTMLSpanElement | undefined
  onMount(() => {
    const band = at?.closest<HTMLElement>(".close")
    if (!band) return
    const hand = () => heat.drive()
    band.addEventListener("pointermove", hand)
    let seen: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      seen = new IntersectionObserver(
        (entries) => {
          if (!latestEntry(entries)?.isIntersecting) return
          heat.drive(CLOSE.drift)
          seen?.disconnect()
        },
        { threshold: 0.25 },
      )
      seen.observe(band)
    }
    onCleanup(() => {
      band.removeEventListener("pointermove", hand)
      seen?.disconnect()
    })
  })
  return (
    <>
      <span ref={(el) => (at = el)} hidden />
      <HeatPrint paused={!heat.driven()} />
    </>
  )
}
