import { createSignal } from "solid-js"
import { DitherAlertDialog, DitherButton } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [open, setOpen] = createSignal(false)
  const [lastChoice, setLastChoice] = createSignal("nothing yet")

  return (
    <div class="flex flex-col items-center gap-4">
      <DitherButton color="red" onClick={() => setOpen(true)}>
        Delete artboard…
      </DitherButton>
      <p class="text-[12px] text-muted-foreground">Last choice: {lastChoice()}</p>
      <DitherAlertDialog
        open={open()}
        danger
        title="Delete artboard?"
        description="This removes the artboard and its layers. There is no undo across sessions."
        confirmLabel="Delete"
        onConfirm={() => (setOpen(false), setLastChoice("confirmed"))}
        onCancel={() => (setOpen(false), setLastChoice("cancelled"))}
      />
    </div>
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
