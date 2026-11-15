import { createSignal } from "solid-js"
import { DitherSlideAction } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [deploys, setDeploys] = createSignal(0)

  return (
    <>
      {/* a 1:1 thumb drag where flick momentum counts; an early release springs
           back, and Enter or Space confirms without the slide */}
      <DitherSlideAction label="Slide to deploy" color="green" onConfirm={() => setDeploys(deploys() + 1)} />
      <p class="text-[10px]">deploys: {deploys()}</p>
    </>
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
