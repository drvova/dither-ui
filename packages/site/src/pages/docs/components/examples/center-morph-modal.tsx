import { createSignal } from "solid-js"
import { DitherButton, DitherCenterMorphModal } from "@dither-kit"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <DitherButton onClick={() => setOpen(true)}>Open modal</DitherButton>
      <DitherCenterMorphModal open={open()} label="Release notes" onClose={() => setOpen(false)}>
        <div class="flex h-full flex-col justify-end gap-2">
          <h3 class="text-sm font-medium text-foreground">v2.4: dithered everything</h3>
          <p class="max-w-md text-[13px] leading-relaxed text-muted-foreground">
            This full-size surface unfolded from its exact center. Press Escape, the backdrop, or the inset control to
            fold it back.
          </p>
        </div>
      </DitherCenterMorphModal>
    </>
  )
}
