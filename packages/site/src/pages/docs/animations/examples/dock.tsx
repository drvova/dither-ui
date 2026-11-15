import { createSignal } from "solid-js"
import { DitherDock } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [picked, setPicked] = createSignal("none")

  return (
    <>
      {/* a gaussian magnify around the pointer */}
      <DitherDock
        items={[
          { value: "home", label: "Home" },
          { value: "studio", label: "Studio", color: "purple" },
          { value: "docs", label: "Docs", color: "green" },
          { value: "alerts", label: "Alerts", color: "red" },
        ]}
        onSelect={(value) => setPicked(value)}
      />
      <p class="mt-2 text-[10px]">selected: {picked()}</p>
    </>
  )
}

export const meta = defineExample({
  component: DitherDock,
  title: "Dock",
  studio: {
    group: "display",
    frame: { w: 340, h: 110 },
    controls: {
      items: { kind: "list", demo: ["Home", "Studio", "Docs", "Alerts"] },
      magnify: { min: 1, max: 3, step: 0.1 },
      range: { min: 30, max: 200, step: 10 },
    },
  },
})
