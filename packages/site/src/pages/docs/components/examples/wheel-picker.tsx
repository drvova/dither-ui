import { createSignal } from "solid-js"
import { DitherWheelPicker } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))
  const [hour, setHour] = createSignal("09")
  const [minute, setMinute] = createSignal("30")

  return (
    <div class="flex flex-col items-center gap-4">
      {/* wheels compose side by side; each is one drum */}
      <div class="flex items-center gap-1">
        <DitherWheelPicker modelValue={hour()} onUpdateModelValue={setHour} options={HOURS} label="Hour" />
        <span class="text-muted-foreground">:</span>
        <DitherWheelPicker
          modelValue={minute()}
          onUpdateModelValue={setMinute}
          options={MINUTES}
          label="Minute"
          color="green"
        />
      </div>
      <p class="font-mono text-[11px] text-muted-foreground">
        time: {hour()}:{minute()}
      </p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherWheelPicker,
  title: "Wheel picker",
  studio: {
    group: "inputs",
    frame: { w: 200, h: 180 },
    controls: {
      color: {},
      options: { kind: "list", demo: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
      rows: { min: 3, max: 9, step: 2 },
      label: {},
    },
  },
})
