import { createSignal, For } from "solid-js"
import { DitherSequence, steps } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [key, setKey] = createSignal(0)
  const [waves, setWaves] = createSignal(0)

  return (
    <>
      {/* children wave in from the center, ping-pong three times, quantized; the
           driver writes --seq-p (0 to 1) and data-seq (before, active or done) on
           each child, and each child styles itself from them. planSequence and
           sampleSequence run the same algebra under your own clock */}
      <DitherSequence
        stagger={0.07}
        from="center"
        duration={0.6}
        loop={3}
        yoyo
        easing={steps(4)}
        restartKey={key()}
        onComplete={() => setWaves(waves() + 1)}
        class="grid grid-cols-6 gap-2"
      >
        <For each={Array.from({ length: 12 }, (_, k) => k + 1)}>
          {() => <div class="h-8 rounded bg-foreground" style="opacity: var(--seq-p, 0)" />}
        </For>
      </DitherSequence>
      <button type="button" class="mt-3" onClick={() => setKey(key() + 1)}>
        Replay ({waves()} played)
      </button>
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
