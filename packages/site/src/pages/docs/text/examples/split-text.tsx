import { createSignal } from "solid-js"
import { DitherSplitText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [token, setToken] = createSignal(0)

  return (
    <div class="grid place-items-center gap-4">
      <DitherSplitText text="Split into characters" replayToken={token()} class="text-3xl" />
      <button type="button" onClick={() => setToken(token() + 1)}>
        Replay
      </button>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSplitText,
  title: "Split text",
  studio: {
    group: "display",
    frame: { w: 320, h: 100 },
    controls: {
      text: { demo: "Split text" },
      stagger: { min: 0, max: 200, step: 5 },
      duration: { min: 100, max: 2000, step: 50 },
    },
  },
})
