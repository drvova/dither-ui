import { createSignal } from "solid-js"
import { DitherSignaturePad } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [signature, setSignature] = createSignal("")

  return (
    <>
      <DitherSignaturePad height={140} onChange={setSignature} />
      <p class="mt-2 text-[12px] text-muted-foreground">{signature() ? "Signed" : "Sign above"}</p>
    </>
  )
}

export const meta = defineExample({
  component: DitherSignaturePad,
  title: "Signature pad",
  studio: {
    group: "inputs",
    frame: { w: 440, h: 230 },
    controls: { width: { min: 200, max: 800 }, height: { demo: 160, min: 80, max: 400 }, disabled: {} },
  },
})
