import { DitherPortal } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="h-24 overflow-hidden rounded-md bg-muted p-4 text-[13px]">
      Declared in a box with overflow hidden.
      <DitherPortal disabled>Teleported content</DitherPortal>
    </div>
  )
}

export const meta = defineExample({
  component: DitherPortal,
  title: "Portal",
  studio: {
    group: "structure",
    frame: { w: 240, h: 100 },
    controls: { to: { kind: "select", options: ["body"] }, disabled: {} },
  },
})
