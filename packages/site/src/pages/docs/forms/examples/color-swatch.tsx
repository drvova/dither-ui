import { createSignal, For } from "solid-js"
import { DitherColorSwatch } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const palette = [
    { color: "#5227FF", label: "Iris" },
    { color: "#7CFF67", label: "Mint" },
    { color: "#FFB454", label: "Amber" },
    { color: "#FF5C7A", label: "Rose" },
    { color: "#4CC2FF", label: "Sky" },
  ]
  const [active, setActive] = createSignal("#5227FF")

  return (
    <div class="flex justify-center gap-2">
      <For each={palette}>
        {(c) => (
          <DitherColorSwatch
            color={c.color}
            label={c.label}
            selected={c.color === active()}
            onSelect={() => setActive(c.color)}
          />
        )}
      </For>
    </div>
  )
}

export const meta = defineExample({
  component: DitherColorSwatch,
  title: "Color swatch",
  studio: {
    group: "inputs",
    frame: { w: 220, h: 90 },
    controls: { color: {}, label: { demo: "Iris" }, selected: {}, size: { min: 12, max: 64 }, disabled: {} },
  },
  states: [{ color: "#3DA5FF" }],
})
