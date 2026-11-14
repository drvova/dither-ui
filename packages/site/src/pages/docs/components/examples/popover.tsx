import { createSignal } from "solid-js"
import { DitherPopover, DitherButton } from "@dither-kit"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  return (
    <DitherPopover
      open={open()}
      align="center"
      onClose={() => setOpen(false)}
      trigger={<DitherButton onClick={() => setOpen(!open())}>Open popover</DitherButton>}
    >
      <p class="text-[12px] leading-relaxed text-muted-foreground">
        Anchored to its trigger. Escape or an outside press closes it.
      </p>
    </DitherPopover>
  )
}
