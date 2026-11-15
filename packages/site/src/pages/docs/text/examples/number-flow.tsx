import { createSignal, onCleanup, onMount } from "solid-js"
import { DitherNumberFlow } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [value, setValue] = createSignal(12480)
  onMount(() => {
    const timer = window.setInterval(() => setValue((v) => v + Math.round(Math.random() * 900 - 300)), 2400)
    onCleanup(() => window.clearInterval(timer))
  })

  // a live metric: the digits roll on every change
  return (
    <div class="flex min-h-24 items-center justify-center gap-3 text-4xl tracking-tight">
      <span class="text-2xl text-muted-foreground" aria-hidden="true">
        $
      </span>
      <DitherNumberFlow value={value()} />
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
