import { DitherHoverArea } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherHoverArea class="mx-auto max-w-sm">
      {(scope) => (
        <div
          class={`rounded-md border p-4 text-center text-[12px] transition-colors ${scope.hovered || scope.focused ? "border-foreground text-foreground" : "border-border/60 text-muted-foreground"}`}
        >
          {scope.hovered || scope.focused ? "revealed" : "hover or tab onto this"}
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
