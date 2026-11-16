import { createSignal, For } from "solid-js"
import { DitherReveal } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [direction, setDirection] = createSignal<"none" | "right" | "down" | "iris">("none")
  const [nonce, setNonce] = createSignal(0)
  const replay = (to: "none" | "right" | "down" | "iris") => {
    setDirection(to)
    setNonce((n) => n + 1)
  }

  // or drive it from a timeline: progress (0 to 1) sets the mask, a pure function of it; wipeStyle
  // gives any element the same mask
  return (
    <div class="flex flex-col items-center gap-3">
      <DitherReveal direction={direction()} cell={4} duration={1.4} restartKey={nonce()} class="h-32 w-56">
        <div class="grid h-full w-full place-items-center rounded-lg border border-border/60 bg-card">
          <span class="text-lg tracking-tight">Revealed</span>
        </div>
      </DitherReveal>
      <div class="flex flex-wrap items-center gap-2">
        <For
          each={
            [
              ["none", "Dissolve"],
              ["right", "Wipe right"],
              ["down", "Wipe down"],
              ["iris", "Iris"],
            ] as const
          }
        >
          {(opt) => (
            <button
              type="button"
              class={`rounded border px-2 py-1 text-[11px] ${
                direction() === opt[0]
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-accent/40"
              }`}
              aria-pressed={direction() === opt[0]}
              onClick={() => replay(opt[0])}
            >
              {opt[1]}
            </button>
          )}
        </For>
        <button
          type="button"
          class="rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
          onClick={() => setNonce((n) => n + 1)}
        >
          Replay
        </button>
      </div>
    </div>
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
