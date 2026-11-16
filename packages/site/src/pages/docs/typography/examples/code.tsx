import { DitherCode } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <p class="text-[13px] leading-relaxed text-muted-foreground">
      Run <DitherCode>npm run build</DitherCode> before shipping: the <DitherCode>dist/</DitherCode> folder is the
      artifact.
    </p>
  )
}

export const meta = defineExample({
  component: DitherCode,
  title: "Code",
  studio: { group: "display", frame: { w: 240, h: 80 }, controls: {} },
})
