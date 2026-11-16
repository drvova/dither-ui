import { createStore } from "solid-js/store"
import { DitherCheckbox } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [opts, setOpts] = createStore({ grid: true, snap: false, rulers: true })

  return (
    <div class="mx-auto grid max-w-sm gap-3">
      <DitherCheckbox modelValue={opts.grid} onUpdateModelValue={(v) => setOpts("grid", v)}>
        Show grid
      </DitherCheckbox>
      <DitherCheckbox modelValue={opts.snap} onUpdateModelValue={(v) => setOpts("snap", v)}>
        Snap to pixels
      </DitherCheckbox>
      <DitherCheckbox modelValue={opts.rulers} onUpdateModelValue={(v) => setOpts("rulers", v)}>
        Show rulers
      </DitherCheckbox>
    </div>
  )
}

export const meta = defineExample({
  component: DitherCheckbox,
  title: "Checkbox",
  studio: {
    group: "inputs",
    frame: { w: 180, h: 80 },
    model: { demo: true },
    slot: "Remember me",
    controls: { color: {}, disabled: {} },
  },
})
