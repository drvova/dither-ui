import { createSignal } from "solid-js"
import { DitherGauge, DitherSlider } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [pressure, setPressure] = createSignal(62)

  return (
    <>
      <div class="grid grid-cols-3 gap-4">
        <DitherGauge value={pressure()} label="kPa" />
        <DitherGauge value={84} label="load" warn={0.75} />
        <DitherGauge value={1.6} min={0} max={4} ticks={8} decimals={1} label="bar" warn={null} />
      </div>
      <DitherSlider modelValue={pressure()} onUpdateModelValue={setPressure} label="Pressure" />
    </>
  )
}

export const meta = defineExample({
  component: DitherGauge,
  title: "Gauge",
  studio: {
    group: "display",
    frame: { w: 220, h: 220 },
    controls: {
      value: { min: 0, max: 100, demo: 62 },
      min: {},
      max: {},
      ticks: { min: 1, max: 20, step: 1 },
      warn: { min: 0, max: 1, step: 0.05 },
      label: { demo: "load" },
      color: {},
    },
  },
})
