import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherNumberFlow } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [metric, setMetric] = createSignal(12480)
  // a live metric: the digits roll on every change
  let timer = 0
  onMount(() => {
    timer = window.setInterval(() => setMetric(metric() + Math.round(Math.random() * 900 - 300)), 2400)
  })
  onCleanup(() => clearInterval(timer))

  return (
    <div class="text-4xl">
      $<DitherNumberFlow value={metric()} />
    </div>
  )
}

export const meta = defineExample({
  component: DitherNumberFlow,
  title: "Number flow",
  studio: {
    group: "display",
    frame: { w: 220, h: 100 },
    controls: {
      value: { min: 0, max: 1000000, step: 1, demo: 12480 },
      decimals: { min: 0, max: 4, step: 1 },
      duration: { min: 100, max: 2000, step: 50 },
    },
  },
})
