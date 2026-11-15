import { createSignal } from "solid-js"
import { DitherClickOutside } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  return (
    <DitherClickOutside onOutside={() => setOpen(false)}>
      <button type="button" onClick={() => setOpen(!open())}>
        {open() ? "Press outside this" : "Open the menu"}
      </button>
    </DitherClickOutside>
  )
}

export const meta = defineExample({
  component: DitherClickOutside,
  title: "Click outside",
  studio: { group: "structure", frame: { w: 240, h: 110 }, controls: { enabled: {} }, slot: "Press outside this" },
})
