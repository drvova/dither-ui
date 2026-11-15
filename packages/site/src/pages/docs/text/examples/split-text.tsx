import { createSignal } from "solid-js"
import { DitherSplitText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [replay, setReplay] = createSignal(0)

  return (
    <div class="grid min-h-24 place-items-center gap-4">
      <div class="text-3xl tracking-tight">
        <DitherSplitText text="Split into characters" replayToken={replay()} />
      </div>
      <button
        class="rounded-md border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        type="button"
        onClick={() => setReplay((n) => n + 1)}
      >
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
