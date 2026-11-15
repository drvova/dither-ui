import { createSignal } from "solid-js"
import { DitherButton, DitherAlertDialog } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)

  return (
    <>
      <DitherButton color="red" onClick={() => setOpen(true)}>
        Delete artboard…
      </DitherButton>
      <DitherAlertDialog
        open={open()}
        danger
        title="Delete artboard?"
        description="This removes the artboard and its layers. There is no undo across sessions."
        confirmLabel="Delete"
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

export const meta = defineExample({
  component: DitherAlertDialog,
  title: "Alert dialog",
  studio: {
    group: "overlays",
    frame: { w: 300, h: 150 },
    controls: {
      title: { demo: "Delete item?" },
      description: { demo: "This action cannot be undone." },
      confirmLabel: {},
      cancelLabel: {},
      danger: {},
    },
    model: { prop: "open", event: "cancel" },
  },
})
