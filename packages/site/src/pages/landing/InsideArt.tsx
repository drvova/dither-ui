// A What's-inside card's strip (`inside.ts`), printed by the kit
// through the card's screen (its character, a still print, is the page's
// bytes). The bridge's board runs as its card comes into view, then only
// while the reader moves the page. Decorative: what the kit prints is
// hidden from assistive technology by itself. An island of the landing.
import { onCleanup, onMount, Show } from "solid-js"
import { DitherCircuit, DitherGradient, DitherReveal, DitherScreen } from "@dither-ui/kit"
import { latestEntry } from "@dither-ui/kit/engine/visibility.ts"
import { INSIDE, type InsideCard } from "@/pages/landing/inside"
import { STOCK } from "@/pages/landing/plate"
import { useDrive } from "./drive"

/** How long the bridge's board runs by itself as its card comes into view. */
const BOARD_DANCE = 3000

export default function InsideArt(props: { name: InsideCard["name"] }) {
  const card = INSIDE.find((c) => c.name === props.name)!
  const board = useDrive()
  let at: HTMLSpanElement | undefined
  onMount(() => {
    if (card.art !== "circuit" || typeof IntersectionObserver === "undefined") return
    const li = at?.closest("li")
    if (!li) return
    let inView = false
    const scrolled = () => inView && board.drive()
    const seen = new IntersectionObserver(
      (entries) => {
        const was = inView
        inView = !!latestEntry(entries)?.isIntersecting
        if (inView && !was) board.drive(BOARD_DANCE)
      },
      { threshold: 0.5 },
    )
    seen.observe(li)
    addEventListener("scroll", scrolled, { passive: true })
    onCleanup(() => {
      seen.disconnect()
      removeEventListener("scroll", scrolled)
    })
  })
  return (
    <>
      <DitherScreen screen={card.screen}>
        <DitherReveal class="inside-art" duration={0.72} easing="glide" aria-hidden="true">
          <Show
            when={card.art === "circuit"}
            fallback={<DitherGradient from={card.ink} to={STOCK} direction="down" cell={4} />}
          >
            <DitherCircuit ink={card.ink} seed={11} density={1} pitch={3} paused={!board.driven()} />
          </Show>
        </DitherReveal>
      </DitherScreen>
      <span ref={(el) => (at = el)} hidden />
    </>
  )
}
