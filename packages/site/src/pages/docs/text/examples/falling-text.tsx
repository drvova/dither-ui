import { createSignal } from "solid-js"
import { DitherFallingText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [token, setToken] = createSignal(0)

  return (
    <div class="grid place-items-center gap-4">
      <DitherFallingText text="Falling into place" replayToken={token()} class="text-3xl" />
      <button type="button" onClick={() => setToken(token() + 1)}>
        Replay
      </button>
    </div>
  )
}

export const meta = defineExample({
  component: DitherFallingText,
  title: "Falling text",
  studio: {
    group: "display",
    frame: { w: 300, h: 100 },
    controls: {
      text: { demo: "Falling text" },
      stagger: { min: 0, max: 200, step: 5 },
      duration: { min: 100, max: 2000, step: 50 },
    },
  },
})
