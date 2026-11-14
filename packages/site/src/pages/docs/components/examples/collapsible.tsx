import { createSignal } from "solid-js"
import { DitherCollapsible } from "@dither-kit"

export default function Example() {
  const [openA, setOpenA] = createSignal(true)
  const [openB, setOpenB] = createSignal(false)

  return (
    <>
      <DitherCollapsible modelValue={openA()} onUpdateModelValue={setOpenA} title="What is dithering?" color="blue">
        Ordered dithering trades smooth gradients for a fixed threshold matrix: the same Bayer 4x4 behind every fill in
        this kit.
      </DitherCollapsible>
      <DitherCollapsible modelValue={openB()} onUpdateModelValue={setOpenB} title="Why canvas?" color="purple">
        One engine paints every fill, so components stay coherent.
      </DitherCollapsible>
    </>
  )
}
