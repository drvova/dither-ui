import { createSignal } from "solid-js"
import { DitherGauge, DitherSlider } from "@dither-kit"

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
