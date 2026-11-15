import { createSignal } from "solid-js"
import { DitherReveal } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [nonce, setNonce] = createSignal(0)

  return (
    <>
      <DitherReveal direction="right" cell={4} duration={1.4} restartKey={nonce()} class="h-32 w-56">
        <div class="grid h-full place-items-center rounded-lg border bg-card text-lg">Revealed</div>
      </DitherReveal>
      <button type="button" class="mt-3" onClick={() => setNonce(nonce() + 1)}>
        Replay
      </button>

      {/* or drive it from a timeline: progress (0 to 1) sets the mask, a pure
           function of it; wipeStyle gives any element the same mask */}
    </>
  )
}

export const meta = defineExample({
  component: DitherReveal,
  title: "Dither reveal",
  studio: {
    group: "display",
    frame: { w: 260, h: 140 },
    controls: {
      duration: { min: 0.1, max: 10, step: 0.1, demo: 1.2 },
      delay: { min: 0, max: 10, step: 0.1 },
      direction: { options: ["none", "right", "left", "down", "up", "iris"], demo: "none" },
      cell: { min: 1, max: 16, step: 1 },
      band: { min: 0, max: 40, step: 1 },
      reverse: {},
    },
    slot: "Revealed",
  },
})
