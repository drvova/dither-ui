import { DitherLink } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherLink href="/docs">Docs home</DitherLink>
}

export const meta = defineExample({
  component: DitherLink,
  title: "Link",
  studio: { group: "display", frame: { w: 220, h: 80 }, controls: { href: { kind: "url", demo: "#" }, external: {} } },
})
