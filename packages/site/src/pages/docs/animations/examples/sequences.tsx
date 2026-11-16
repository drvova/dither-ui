import { createMemo, createSignal, For } from "solid-js"
import { DitherSequence, linear, steps, type StaggerFrom } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  // a change of origin or easing, or Replay, rebuilds the plan and plays it again
  const [from, setFrom] = createSignal("center" as StaggerFrom)
  const [quantized, setQuantized] = createSignal(false)
  const [nonce, setNonce] = createSignal(0)
  const easing = createMemo(() => (quantized() ? steps(4) : linear))
  const key = createMemo(() => `${from()}|${quantized()}|${nonce()}`)

  // children wave in from the center, ping-pong three times, quantized; the driver writes --seq-p (0
  // to 1) and data-seq (before, active or done) on each child, and each child styles itself from
  // them. planSequence and sampleSequence run the same algebra under your own clock
  // seq-cell is a hook for your stylesheet: each cell reads the driver's --seq-p (0 to 1) and
  // data-seq; the docs give it opacity: var(--seq-p, 0) and a rise of (1 - p) * 16px
  return (
    <>
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <For each={["start", "center", "end", "edges"] as const}>
          {(opt) => (
            <button
              class={`rounded border px-2 py-1 text-[11px] ${
                from() === opt
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border/60 text-muted-foreground hover:bg-accent/40"
              }`}
              aria-pressed={from() === opt}
              onClick={() => setFrom(opt)}
            >
              {opt}
            </button>
          )}
        </For>
        <button
          class={`rounded border px-2 py-1 text-[11px] ${
            quantized()
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border/60 text-muted-foreground hover:bg-accent/40"
          }`}
          aria-pressed={quantized()}
          onClick={() => setQuantized((on) => !on)}
        >
          {quantized() ? "steps(4)" : "linear"}
        </button>
        <button
          class="rounded border border-border/60 px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent/40"
          onClick={() => setNonce((n) => n + 1)}
        >
          Replay
        </button>
      </div>
      <DitherSequence
        stagger={0.07}
        from={from()}
        duration={0.6}
        loop={3}
        yoyo
        easing={easing()}
        restartKey={key()}
        class="grid grid-cols-6 gap-2"
      >
        <For each={Array.from({ length: 12 }, (_, i) => i + 1)}>{(i) => <div class="seq-cell">{i}</div>}</For>
      </DitherSequence>
    </>
  )
}

export const meta = defineExample({
  component: DitherSequence,
  title: "Sequence",
  studio: {
    group: "display",
    frame: { w: 300, h: 140 },
    controls: {
      stagger: { min: 0, max: 1, step: 0.01, demo: 0.06 },
      from: { kind: "select", options: ["start", "center", "end", "edges"], demo: "start" },
      duration: { min: 0.1, max: 5, step: 0.1, demo: 0.5 },
      delay: { min: 0, max: 3, step: 0.1 },
      loop: { min: 1, max: 10, step: 1, demo: 1 },
      yoyo: { demo: false },
      restartOnView: {},
      paused: {},
    },
    slot: "Sequence",
  },
})
