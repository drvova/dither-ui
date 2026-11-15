import { DitherExternalLink } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherExternalLink href="https://docs.solidjs.com">Solid docs</DitherExternalLink>
}

export const meta = defineExample({
  component: DitherExternalLink,
  title: "External link",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { href: { kind: "url" }, iconSize: { min: 8, max: 20 } },
  },
})
