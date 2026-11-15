import { DitherCode } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherCode>npm run build</DitherCode>
}

export const meta = defineExample({
  component: DitherCode,
  title: "Code",
  studio: { group: "display", frame: { w: 240, h: 80 }, controls: {} },
})
