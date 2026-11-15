import { For } from "solid-js"
import { DitherMeter } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const meters = [
    { label: "Disk", value: 35 },
    { label: "Memory", value: 68 },
    { label: "CPU", value: 92 },
  ]

  return (
    <div class="mx-auto grid max-w-sm gap-3">
      <For each={meters}>
        {(m) => (
          <div>
            <div class="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>{m.label}</span>
              <span>{m.value}%</span>
            </div>
            <DitherMeter value={m.value} />
          </div>
        )}
      </For>
    </div>
  )
}

export const meta = defineExample({
  component: DitherMeter,
  title: "Meter",
  studio: { group: "display", frame: { w: 300, h: 80 }, controls: { value: { min: 0, max: 100 }, min: {}, max: {} } },
})
