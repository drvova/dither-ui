import { DitherLink } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <p class="text-[13px]">
      Read the <DitherLink href="#link">Link</DitherLink> section, then keep going. The underline widens on hover and
      settles back.
    </p>
  )
}

export const meta = defineExample({
  component: DitherLink,
  title: "Link",
  studio: { group: "display", frame: { w: 220, h: 80 }, controls: { href: { kind: "url", demo: "#" }, external: {} } },
})
