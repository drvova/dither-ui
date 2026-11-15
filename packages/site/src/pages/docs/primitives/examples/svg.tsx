import { DitherSvg } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherSvg viewBox="0 0 24 24" label="Done">
      <path d="M5 12l4 4 10-10" />
    </DitherSvg>
  )
}

export const meta = defineExample({
  component: DitherSvg,
  title: "Svg",
  studio: { group: "display", frame: { w: 200, h: 90 }, controls: { viewBox: {}, label: { demo: "" } }, slot: "" },
})
