import { DitherButton } from "@dither-kit"
import { DitherToaster, toast } from "@dither-kit"

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
