import { createSignal, Show } from "solid-js"
import { DitherOverlay } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(true)

  return (
    <div class="relative isolate grid h-40 place-items-center overflow-hidden rounded-md">
      <button type="button" onClick={() => setOpen(true)}>
        Dim this box
      </button>
      <Show when={open()}>
        <DitherOverlay class="absolute" onClick={() => setOpen(false)} />
      </Show>
    </div>
  )
}

export const meta = defineExample({
  component: DitherOverlay,
  title: "Overlay",
  studio: { group: "overlays", frame: { w: 260, h: 120 }, controls: { dim: {}, interactive: {} } },
})
