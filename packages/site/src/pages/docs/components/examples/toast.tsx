import { DitherButton } from "@dither-kit"
import { DitherToaster, toast } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      <DitherToaster />
      <DitherButton color="green" onClick={() => toast("Saved", { color: "green" })}>
        Save
      </DitherButton>
      <DitherButton color="red" onClick={() => toast("Export failed", { color: "red" })}>
        Export
      </DitherButton>
    </>
  )
}

export const meta = defineExample({
  component: DitherToaster,
  title: "Toaster",
  studio: {
    group: "overlays",
    frame: { w: 260, h: 130 },
    story: { color: { kind: "color", demo: "blue" }, message: { kind: "text", demo: "Saved to project" } },
    controls: {},
  },
})
