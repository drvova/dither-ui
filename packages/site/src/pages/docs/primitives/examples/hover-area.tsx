import { DitherHoverArea } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherHoverArea>
      {(scope) => (
        <div class="rounded-md bg-muted p-4 text-[13px]">
          {scope.hovered || scope.focused ? "Shown on hover or focus" : "Hover or focus"}
        </div>
      )}
    </DitherHoverArea>
  )
}

export const meta = defineExample({
  component: DitherHoverArea,
  title: "Hover area",
  studio: { group: "structure", frame: { w: 240, h: 100 }, controls: {}, slot: "Hover or focus" },
})
