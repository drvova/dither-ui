import { createSignal } from "solid-js"
import { DitherButton, DitherDialog } from "@dither-kit"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <DitherButton onClick={() => setOpen(true)}>Open dialog</DitherButton>
      <DitherDialog
        open={open()}
        title="Confirm"
        description="Ship the dithered build to production?"
        onClose={() => setOpen(false)}
        footer={
          <DitherButton color="green" onClick={() => setOpen(false)}>
            Confirm
          </DitherButton>
        }
      >
        <p class="text-[13px] text-muted-foreground">Review the release before continuing.</p>
      </DitherDialog>
    </>
  )
}
