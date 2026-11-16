import { DitherLayer, DitherStage } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherStage duration={3} class="h-40 rounded-lg border">
      <DitherLayer keyframes={[{ x: "0cqw" }, { x: "60cqw" }]} duration={3} loop yoyo class="p-4 text-[12px]">
        a layer in container units
      </DitherLayer>
    </DitherStage>
  )
}

export const meta = defineExample({
  component: DitherLayer,
  title: "Layer",
  studio: {
    group: "display",
    frame: { w: 320, h: 160 },
    controls: {
      duration: { min: 0.1, max: 30, step: 0.1 },
      delay: { min: 0, max: 10, step: 0.1 },
      loop: { kind: "boolean" },
      yoyo: {},
      origin: {},
    },
  },
  states: [{ origin: "0% 100%" }],
})
