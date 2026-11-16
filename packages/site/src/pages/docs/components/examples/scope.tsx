import { createSignal } from "solid-js"
import { DitherScope, DitherSlider, DitherToggleGroup } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

type Wave = "sine" | "square" | "triangle" | "saw"

export default function Example() {
  const [wave, setWave] = createSignal("sine" as Wave)
  const [glow, setGlow] = createSignal(60)
  const waves = (["sine", "square", "triangle", "saw"] as const).map((w) => ({ value: w, label: w }))

  return (
    <div class="mx-auto grid max-w-md gap-5">
      <DitherScope signal={wave()} afterglow={glow() / 100} label="ch1" />
      <div role="group" aria-label="Wave" class="flex justify-center">
        <DitherToggleGroup modelValue={wave()} onUpdateModelValue={(v) => setWave(v as Wave)} options={waves} />
      </div>
      <DitherSlider modelValue={glow()} onUpdateModelValue={(v) => setGlow(v as number)} label="Afterglow" />
    </div>
  )
}

export const meta = defineExample({
  component: DitherScope,
  title: "Scope",
  studio: {
    group: "display",
    frame: { w: 300, h: 240 },
    controls: {
      signal: { kind: "select", options: ["sine", "square", "triangle", "saw"] },
      cycles: { min: 0.5, max: 8, step: 0.5 },
      speed: { min: 0, max: 4, step: 0.1 },
      gain: { min: 0.1, max: 1, step: 0.05 },
      afterglow: { min: 0, max: 1, step: 0.05 },
      label: {},
      color: {},
    },
  },
})
