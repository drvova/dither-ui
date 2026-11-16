import { createSignal } from "solid-js"
import { DitherToggle } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [bloomOn, setBloomOn] = createSignal(true)

  return (
    <div class="mx-auto max-w-sm text-center">
      <DitherToggle modelValue={bloomOn()} onUpdateModelValue={setBloomOn}>
        bloom
      </DitherToggle>
      <p class="mt-4 font-mono text-[11px] text-muted-foreground">bloom: {String(bloomOn())}</p>
    </div>
  )
}

export const meta = defineExample({
  component: DitherToggle,
  title: "Toggle",
  studio: { group: "inputs", frame: { w: 160, h: 80 }, slot: "Bold", controls: { color: {}, disabled: {} } },
})
