import { createSignal } from "solid-js"
import { DitherSlideAction } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [count, setCount] = createSignal(0)

  // a 1:1 thumb drag where flick momentum counts; an early release springs back, and Enter or Space
  // confirms without the slide
  return (
    <div class="flex min-h-24 flex-col items-center justify-center gap-3">
      <DitherSlideAction label="Slide to deploy" color="green" onConfirm={() => setCount((n) => n + 1)} />
      <p class="font-mono text-[10px] text-muted-foreground">deploys: {count()}</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherSlideAction,
  title: "Slide action",
  studio: {
    group: "display",
    frame: { w: 300, h: 100 },
    controls: { label: { demo: "Slide to confirm" }, color: { demo: "blue" }, disabled: {} },
  },
})
